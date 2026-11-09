<?php
// Recados do jogo: uma sala por local + data. Só entra quem confirmou presença.
//   GET  api/recados.php?local=ID&data=AAAA-MM-DD&depois=ULTIMO_ID[&completo=1]
//   POST api/recados.php   { local, data, texto }
require_once __DIR__ . '/helpers.php';

const RECADOS_MAX_CARACTERES   = 500;
const RECADOS_LIMITE_MENSAGENS = 5;   // no máximo 5 mensagens...
const RECADOS_LIMITE_SEGUNDOS  = 30;  // ...a cada 30 segundos

$usuarioId = exigirLogin();
$metodo = $_SERVER['REQUEST_METHOD'];
$dados  = $metodo === 'POST' ? corpoRequisicao() : $_GET;
$localId = (int)($dados['local'] ?? 0);
$data    = trim((string)($dados['data'] ?? ''));
if (!$localId || !dataValida($data)) erro('Mural de recados inválido.');

try {
    $stL = $pdo->prepare('SELECT id, nome, bairro, emoji_capa, foto_url FROM locais WHERE id = ?');
    $stL->execute([$localId]);
    $local = $stL->fetch();
    if (!$local) erro('Local não encontrado.', 404);
    if (!usuarioNaSala($pdo, $usuarioId, $localId, $data))
        erro('Confirme presença neste local e nesta data para entrar no recados do jogo.', 403);

    $stA = $pdo->prepare('SELECT ? >= CURDATE()');
    $stA->execute([$data]);
    $podeEscrever = (bool)$stA->fetchColumn();

    if ($metodo === 'POST') enviarMensagem($pdo, $usuarioId, $localId, $data, $podeEscrever, (string)($dados['texto'] ?? ''));
    if ($metodo !== 'GET') erro('Método não permitido.', 405);

    $depois   = max(0, (int)($_GET['depois'] ?? 0));
    $completo = $depois === 0 || !empty($_GET['completo']);

    $sqlBase = 'SELECT m.id, m.usuario_id, m.texto, m.criado_em, u.nome, u.avatar_iniciais, u.foto_url
                FROM chat_mensagens m INNER JOIN usuarios u ON u.id = m.usuario_id
                WHERE m.local_id = ? AND m.data_jogo = ? AND m.removida = 0';
    if ($depois === 0) {
        $st = $pdo->prepare("SELECT * FROM ($sqlBase ORDER BY m.id DESC LIMIT 100) t ORDER BY t.id ASC");
        $st->execute([$localId, $data]);
    } else {
        $st = $pdo->prepare("$sqlBase AND m.id > ? ORDER BY m.id ASC LIMIT 100");
        $st->execute([$localId, $data, $depois]);
    }
    $mensagens = array_map('formatarMensagem', $st->fetchAll());

    // Mensagens apagadas pelo admin (para sumirem da tela de quem já está com os recados abertos)
    $stR = $pdo->prepare('SELECT id FROM chat_mensagens WHERE local_id = ? AND data_jogo = ? AND removida = 1');
    $stR->execute([$localId, $data]);
    $resp = [
        'sucesso'   => true,
        'meu_id'    => $usuarioId,
        'mensagens' => $mensagens,
        'removidas' => array_map('intval', array_column($stR->fetchAll(), 'id')),
    ];

    if ($completo) {
        $stP = $pdo->prepare('SELECT u.id, u.nome, u.avatar_iniciais, u.foto_url, SUM(p.qtd_pessoas) AS pessoas, MIN(p.horario) AS horario
                              FROM presencas p INNER JOIN usuarios u ON u.id = p.usuario_id
                              WHERE p.local_id = ? AND p.data_jogo = ?
                              GROUP BY u.id, u.nome, u.avatar_iniciais, u.foto_url ORDER BY horario ASC, u.nome ASC');
        $stP->execute([$localId, $data]);
        $participantes = array_map(function ($p) use ($usuarioId) {
            return [
                'id' => (int)$p['id'], 'nome' => primeiroNome($p['nome']),
                'avatar_iniciais' => $p['avatar_iniciais'], 'foto_url' => $p['foto_url'],
                'pessoas' => (int)$p['pessoas'], 'horario' => $p['horario'] ? substr($p['horario'], 0, 5) : null,
                'eu' => (int)$p['id'] === $usuarioId,
            ];
        }, $stP->fetchAll());
        $resp['sala'] = [
            'local' => ['id' => (int)$local['id'], 'nome' => $local['nome'], 'bairro' => $local['bairro'], 'emoji_capa' => $local['emoji_capa'], 'foto_url' => $local['foto_url']],
            'data' => $data,
            'pode_escrever' => $podeEscrever,
            'participantes' => $participantes,
        ];
    }
    responder($resp);
} catch (PDOException $e) { erro('Erro ao carregar os recados. Tente novamente.', 500); }

/* ───────────────────────────────────────────────────────────── */

function primeiroNome(string $nome): string {
    // Nos recados aparece só o primeiro nome e a inicial do sobrenome (ex.: "Lorenzo S.")
    $p = preg_split('/\s+/', trim($nome));
    return $p[0] . (count($p) > 1 ? ' ' . mb_strtoupper(mb_substr(end($p), 0, 1)) . '.' : '');
}

function formatarMensagem(array $m): array {
    return [
        'id' => (int)$m['id'], 'usuario_id' => (int)$m['usuario_id'], 'texto' => $m['texto'],
        'hora' => substr($m['criado_em'], 11, 5),
        'autor' => ['nome' => primeiroNome($m['nome']), 'avatar_iniciais' => $m['avatar_iniciais'], 'foto_url' => $m['foto_url']],
    ];
}

function filtrarPalavroes(string $t): string {
    $lista = ['porra', 'caralho', 'merda', 'puta', 'puto', 'putaria', 'fdp', 'vsf', 'vtnc', 'pqp', 'tnc', 'buceta', 'boceta',
              'arrombado', 'arrombada', 'cacete', 'foder', 'fuder', 'fodase', 'foda-se', 'fodido', 'fudido', 'viado', 'bicha',
              'cuzão', 'cuzao', 'corno', 'piranha', 'vagabunda', 'vagabundo', 'otário', 'otario', 'retardado', 'macaco', 'krl', 'crl'];
    foreach ($lista as $p) {
        $t = preg_replace_callback('/(?<![\p{L}\p{N}])' . preg_quote($p, '/') . '(?![\p{L}\p{N}])/iu', function ($m) {
            return mb_substr($m[0], 0, 1) . str_repeat('*', max(2, mb_strlen($m[0]) - 1));
        }, $t);
    }
    return $t;
}

function temContato(string $t): bool {
    // Datas (28/09/2026) e horários (19:30, 18h00) não contam como telefone
    $semDatas = preg_replace(['#\b\d{1,2}/\d{1,2}(?:/\d{2,4})?\b#', '/\b\d{1,2}[:h]\d{2}\b/i'], ' ', $t);
    return (bool)(
        preg_match('/(?:\d[\s.\-()]*){8,}/', $semDatas) ||                              // telefone
        preg_match('/[\w.+-]+@[\w-]+\.[\w.]{2,}/u', $t) ||                               // e-mail
        preg_match('/(?:https?:\/\/|www\.)|\b[\w-]+\.(?:com|net|org|br|me|ly|gg|link|app|io)\b/iu', $t) || // links
        preg_match('/(?:^|\s)@[\w.]{3,}/u', $t) ||                                         // @perfil
        preg_match('/\b(?:insta|instagram|whats|whatsapp|zap|wpp|telegram|tiktok|discord|snap)\b/iu', $t) // redes
    );
}

function enviarMensagem(PDO $pdo, int $usuarioId, int $localId, string $data, bool $podeEscrever, string $texto): void {
    if (!$podeEscrever) erro('Este jogo já passou. Os recados agora são só para leitura.', 403);
    $texto = trim(preg_replace("/\n{3,}/", "\n\n", str_replace("\r", '', $texto)));
    if ($texto === '') erro('Escreva uma mensagem.');
    if (mb_strlen($texto) > RECADOS_MAX_CARACTERES) erro('A mensagem pode ter no máximo ' . RECADOS_MAX_CARACTERES . ' caracteres.');
    if (temContato($texto)) erro('Por segurança, não é permitido compartilhar telefone, e-mail, links ou redes sociais nos recados. Combinem tudo por aqui! 😉', 422);

    $st = $pdo->prepare('SELECT COUNT(*) FROM chat_mensagens WHERE usuario_id = ? AND criado_em >= (NOW() - INTERVAL ' . RECADOS_LIMITE_SEGUNDOS . ' SECOND)');
    $st->execute([$usuarioId]);
    if ((int)$st->fetchColumn() >= RECADOS_LIMITE_MENSAGENS) erro('Você está enviando mensagens rápido demais. Espere alguns segundos.', 429);

    $texto = filtrarPalavroes($texto);
    $pdo->prepare('INSERT INTO chat_mensagens (local_id, data_jogo, usuario_id, texto) VALUES (?,?,?,?)')
        ->execute([$localId, $data, $usuarioId, $texto]);
    $id = (int)$pdo->lastInsertId();

    $st = $pdo->prepare('SELECT m.id, m.usuario_id, m.texto, m.criado_em, u.nome, u.avatar_iniciais, u.foto_url
                         FROM chat_mensagens m INNER JOIN usuarios u ON u.id = m.usuario_id WHERE m.id = ?');
    $st->execute([$id]);
    responder(['sucesso' => true, 'mensagem' => formatarMensagem($st->fetch())], 201);
}

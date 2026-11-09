<?php
// Painel admin: recados denunciados.
//   GET  -> lista denúncias pendentes (agrupadas por mensagem)
//   POST { mensagem_id, acao: 'remover' | 'ignorar' }
require_once __DIR__ . '/admin_helpers.php';
exigirAdmin();
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $st = $pdo->query("SELECT m.id AS mensagem_id, m.texto, m.criado_em, m.data_jogo,
                                  u.nome AS autor_nome, u.email AS autor_email,
                                  l.nome AS local_nome,
                                  COUNT(d.id) AS total_denuncias,
                                  GROUP_CONCAT(DISTINCT d.motivo ORDER BY d.motivo SEPARATOR ', ') AS motivos,
                                  MAX(d.criado_em) AS ultima_denuncia
                           FROM chat_denuncias d
                           INNER JOIN chat_mensagens m ON m.id = d.mensagem_id
                           INNER JOIN usuarios u ON u.id = m.usuario_id
                           INNER JOIN locais l ON l.id = m.local_id
                           WHERE d.resolvida = 0
                           GROUP BY m.id, m.texto, m.criado_em, m.data_jogo, u.nome, u.email, l.nome
                           ORDER BY total_denuncias DESC, ultima_denuncia DESC");
        $lista = $st->fetchAll();
        foreach ($lista as &$d) { $d['mensagem_id'] = (int)$d['mensagem_id']; $d['total_denuncias'] = (int)$d['total_denuncias']; }
        responder(['sucesso' => true, 'denuncias' => $lista]);
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $dados = corpoRequisicao();
        $mid = (int)($dados['mensagem_id'] ?? 0);
        $acao = $dados['acao'] ?? '';
        if (!$mid || !in_array($acao, ['remover', 'ignorar'], true)) erro('Dados inválidos.');
        $pdo->beginTransaction();
        if ($acao === 'remover') $pdo->prepare('UPDATE chat_mensagens SET removida = 1 WHERE id = ?')->execute([$mid]);
        $pdo->prepare('UPDATE chat_denuncias SET resolvida = 1 WHERE mensagem_id = ?')->execute([$mid]);
        $pdo->commit();
        responder(['sucesso' => true]);
    }
    erro('Método não permitido.', 405);
} catch (PDOException $e) { erro('Erro: ' . $e->getMessage(), 500); }

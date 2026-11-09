<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';

function responder($dados, int $status = 200): void {
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}
function erro(string $mensagem, int $status = 400): void {
    responder(['sucesso' => false, 'erro' => $mensagem], $status);
}
function corpoRequisicao(): array {
    $json = json_decode(file_get_contents('php://input'), true);
    return is_array($json) ? $json : [];
}
function usuarioLogado(): ?int { return $_SESSION['usuario_id'] ?? null; }
function exigirLogin(): int {
    $id = usuarioLogado();
    if (!$id) erro('Você precisa estar logado.', 401);
    return $id;
}
function gerarIniciais(string $nome): string {
    $partes = preg_split('/\s+/', trim($nome));
    $iniciais = '';
    foreach (array_slice($partes, 0, 2) as $p)
        if ($p !== '') $iniciais .= mb_strtoupper(mb_substr($p, 0, 1));
    return $iniciais !== '' ? $iniciais : '??';
}

/* ── Foto de perfil ─────────────────────────────────────────── */
const PASTA_AVATARS = __DIR__ . '/../uploads/avatars';
const URL_AVATARS   = 'uploads/avatars';

/**
 * Recebe uma imagem como data URL (data:image/jpeg;base64,...), confere se é
 * mesmo uma imagem, recria o arquivo do zero (remove qualquer conteúdo escondido)
 * e salva como JPG com nome aleatório. Devolve o caminho relativo.
 *   $quadrado = true  -> recorta no centro em quadrado de até $maxLado px (fotos de perfil)
 *   $quadrado = false -> mantém a proporção, lado maior com até $maxLado px (fotos de locais)
 */
function salvarImagem(string $dataUrl, string $pasta, string $urlBase, int $maxLado, bool $quadrado, int $qualidade = 85): string {
    if (!preg_match('#^data:image/(jpeg|jpg|png|webp);base64,#', $dataUrl, $m)) erro('Formato de imagem inválido. Use JPG, PNG ou WEBP.');
    $bin = base64_decode(substr($dataUrl, strlen($m[0])), true);
    if ($bin === false || strlen($bin) < 100) erro('Não foi possível ler a imagem.');
    if (strlen($bin) > 6 * 1024 * 1024) erro('A imagem é muito grande (máximo 6 MB).');
    $info = @getimagesizefromstring($bin);
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) erro('O arquivo enviado não é uma imagem válida.');
    if ($info[0] > 8000 || $info[1] > 8000) erro('A imagem tem dimensões grandes demais.');

    if (!is_dir($pasta) && !@mkdir($pasta, 0755, true)) erro('Não foi possível salvar a imagem (pasta de uploads).', 500);
    $nome = bin2hex(random_bytes(12)) . '.jpg';
    $destino = $pasta . '/' . $nome;

    if (function_exists('imagecreatefromstring')) {
        $orig = @imagecreatefromstring($bin);
        if (!$orig) erro('O arquivo enviado não é uma imagem válida.');
        $w = imagesx($orig); $h = imagesy($orig);
        if ($quadrado) {
            $lado = min($w, $h); $nw = $nh = min($maxLado, $lado);
            $sx = (int)(($w - $lado) / 2); $sy = (int)(($h - $lado) / 2); $sw = $sh = $lado;
        } else {
            $esc = min(1, $maxLado / max($w, $h)); $nw = max(1, (int)round($w * $esc)); $nh = max(1, (int)round($h * $esc));
            $sx = $sy = 0; $sw = $w; $sh = $h;
        }
        $nova = imagecreatetruecolor($nw, $nh);
        imagefill($nova, 0, 0, imagecolorallocate($nova, 255, 255, 255)); // fundo branco p/ PNG transparente
        imagecopyresampled($nova, $orig, 0, 0, $sx, $sy, $nw, $nh, $sw, $sh);
        $ok = imagejpeg($nova, $destino, $qualidade);
        imagedestroy($orig); imagedestroy($nova);
        if (!$ok) erro('Não foi possível salvar a imagem.', 500);
    } else {
        if ($info[2] !== IMAGETYPE_JPEG) erro('Envie a imagem em JPG.');
        if (file_put_contents($destino, $bin) === false) erro('Não foi possível salvar a imagem.', 500);
    }
    return $urlBase . '/' . $nome;
}

/** Foto de perfil: quadrada, 256x256. */
function salvarFotoPerfil(string $dataUrl): string {
    return salvarImagem($dataUrl, PASTA_AVATARS, URL_AVATARS, 256, true);
}

/* ── Foto dos locais ── */
const PASTA_LOCAIS = __DIR__ . '/../uploads/locais';
const URL_LOCAIS   = 'uploads/locais';
/** Foto de local: mantém a proporção, lado maior com até 1280 px. */
function salvarFotoLocal(string $dataUrl): string {
    return salvarImagem($dataUrl, PASTA_LOCAIS, URL_LOCAIS, 1280, false, 82);
}
function apagarFotoLocal(?string $caminho): void {
    if (!$caminho || !preg_match('#^uploads/locais/[a-f0-9]{24}\.jpg$#', $caminho)) return;
    $arq = PASTA_LOCAIS . '/' . basename($caminho);
    if (is_file($arq)) @unlink($arq);
}

/** Apaga do servidor uma foto antiga (só se estiver dentro da pasta de avatars). */
function apagarFotoPerfil(?string $caminho): void {
    if (!$caminho || !preg_match('#^uploads/avatars/[a-f0-9]{24}\.jpg$#', $caminho)) return;
    $arq = PASTA_AVATARS . '/' . basename($caminho);
    if (is_file($arq)) @unlink($arq);
}

/* ── Recados do jogo ───────────────────────────────────────────────────── */
function dataValida(string $d): bool {
    $dt = DateTime::createFromFormat('Y-m-d', $d);
    return $dt && $dt->format('Y-m-d') === $d;
}
/** O usuário só entra na sala de um jogo se confirmou presença naquele local e data. */
function usuarioNaSala(PDO $pdo, int $usuarioId, int $localId, string $data): bool {
    $st = $pdo->prepare('SELECT 1 FROM presencas WHERE usuario_id = ? AND local_id = ? AND data_jogo = ? LIMIT 1');
    $st->execute([$usuarioId, $localId, $data]);
    return (bool)$st->fetchColumn();
}

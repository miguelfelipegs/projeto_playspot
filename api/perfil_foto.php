<?php
// Troca (ou remove) a foto de perfil do usuário logado.
require_once __DIR__ . '/helpers.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') erro('Método não permitido.', 405);
$usuarioId = exigirLogin();
$dados = corpoRequisicao();
try {
    $st = $pdo->prepare('SELECT foto_url FROM usuarios WHERE id = ?');
    $st->execute([$usuarioId]);
    $antiga = $st->fetchColumn() ?: null;

    if (!empty($dados['remover'])) {
        $pdo->prepare('UPDATE usuarios SET foto_url = NULL WHERE id = ?')->execute([$usuarioId]);
        apagarFotoPerfil($antiga);
        responder(['sucesso' => true, 'foto_url' => null]);
    }
    $foto = $dados['foto'] ?? '';
    if (!is_string($foto) || $foto === '') erro('Envie uma foto.');
    $nova = salvarFotoPerfil($foto);
    $pdo->prepare('UPDATE usuarios SET foto_url = ? WHERE id = ?')->execute([$nova, $usuarioId]);
    apagarFotoPerfil($antiga);
    responder(['sucesso' => true, 'foto_url' => $nova]);
} catch (PDOException $e) { erro('Erro ao salvar a foto.', 500); }

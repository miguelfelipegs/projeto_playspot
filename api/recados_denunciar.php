<?php
// Denuncia um recado. A denúncia vai para o painel admin.
require_once __DIR__ . '/helpers.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') erro('Método não permitido.', 405);
$usuarioId = exigirLogin();
$dados = corpoRequisicao();
$mensagemId = (int)($dados['mensagem_id'] ?? 0);
$motivos = ['Ofensa ou xingamento', 'Assédio ou ameaça', 'Conteúdo impróprio', 'Spam ou propaganda', 'Pedido de contato pessoal', 'Outro'];
$motivo = in_array($dados['motivo'] ?? '', $motivos, true) ? $dados['motivo'] : 'Outro';
if (!$mensagemId) erro('Mensagem inválida.');
try {
    $st = $pdo->prepare('SELECT local_id, data_jogo, usuario_id FROM chat_mensagens WHERE id = ? AND removida = 0');
    $st->execute([$mensagemId]);
    $m = $st->fetch();
    if (!$m) erro('Mensagem não encontrada.', 404);
    if ((int)$m['usuario_id'] === $usuarioId) erro('Você não pode denunciar a sua própria mensagem.');
    if (!usuarioNaSala($pdo, $usuarioId, (int)$m['local_id'], $m['data_jogo'])) erro('Acesso negado.', 403);
    $pdo->prepare('INSERT IGNORE INTO chat_denuncias (mensagem_id, usuario_id, motivo) VALUES (?,?,?)')
        ->execute([$mensagemId, $usuarioId, $motivo]);
    responder(['sucesso' => true, 'mensagem' => 'Denúncia enviada. Obrigado por ajudar a manter o Play Spot seguro!']);
} catch (PDOException $e) { erro('Erro ao enviar a denúncia.', 500); }

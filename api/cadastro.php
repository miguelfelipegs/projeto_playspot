<?php
require_once __DIR__ . '/helpers.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') erro('Método não permitido.', 405);
$dados   = corpoRequisicao();
$nome    = trim($dados['nome'] ?? '');
$email   = trim($dados['email'] ?? '');
$senha   = $dados['senha'] ?? '';
$bairro  = trim($dados['bairro'] ?? '');
$cidade  = trim($dados['cidade'] ?? 'Contagem, MG');
$esportes = $dados['esportes'] ?? [];
$foto     = $dados['foto'] ?? '';
if ($nome === '' || $email === '' || $senha === '') erro('Nome, e-mail e senha são obrigatórios.');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) erro('E-mail inválido.');
if (strlen($senha) < 6) erro('A senha deve ter pelo menos 6 caracteres.');
try {
    $v = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $v->execute([$email]);
    if ($v->fetch()) erro('Este e-mail já está cadastrado.');
    $hash     = password_hash($senha, PASSWORD_DEFAULT);
    $iniciais = gerarIniciais($nome);
    $fotoUrl  = (is_string($foto) && $foto !== '') ? salvarFotoPerfil($foto) : null;
    $stmt = $pdo->prepare('INSERT INTO usuarios (nome, email, senha_hash, bairro, cidade, avatar_iniciais, foto_url) VALUES (?,?,?,?,?,?,?)');
    try { $stmt->execute([$nome, $email, $hash, $bairro, $cidade, $iniciais, $fotoUrl]); }
    catch (PDOException $e) { apagarFotoPerfil($fotoUrl); throw $e; }
    $uid = (int) $pdo->lastInsertId();
    if (is_array($esportes) && count($esportes) > 0) {
        $stmtE = $pdo->prepare('INSERT INTO usuario_esportes (usuario_id, esporte_id) VALUES (?,?)');
        foreach ($esportes as $eid) $stmtE->execute([$uid, (int)$eid]);
    }
    $esportesInfo = [];
    if (count($esportes) > 0) {
        $ph = implode(',', array_fill(0, count($esportes), '?'));
        $stmtEI = $pdo->prepare("SELECT id, nome, emoji FROM esportes WHERE id IN ($ph)");
        $stmtEI->execute(array_map('intval', $esportes));
        $esportesInfo = $stmtEI->fetchAll();
    }
    $_SESSION['usuario_id']   = $uid;
    $_SESSION['usuario_nome'] = $nome;
    responder(['sucesso' => true, 'usuario' => [
        'id' => $uid, 'nome' => $nome, 'email' => $email,
        'bairro' => $bairro, 'cidade' => $cidade,
        'avatar_iniciais' => $iniciais, 'foto_url' => $fotoUrl, 'esportes' => $esportesInfo,
    ]], 201);
} catch (PDOException $e) { erro('Erro: ' . $e->getMessage(), 500); }

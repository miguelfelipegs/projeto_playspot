<?php
$DB_HOST = 'sql111.infinityfree.com';
$DB_NAME = 'if0_42290113_playspot';
$DB_USER = 'if0_42290113';
$DB_PASS = 'RRGmMqUNQ5aGDND';

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER, $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['erro' => 'Falha na conexão com o banco.', 'detalhe' => $e->getMessage()]);
    exit;
}

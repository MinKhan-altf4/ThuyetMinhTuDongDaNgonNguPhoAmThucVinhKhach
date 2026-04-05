<?php
// check_login.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (empty($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// Kiểm tra xem user có bị xóa không (nằm trong users_deleted)
require_once __DIR__ . '/config.php';

$stmt = $pdo->prepare("SELECT deleted_id FROM users_deleted WHERE user_id = ? LIMIT 1");
$stmt->execute([$_SESSION['user_id']]);
$isDeleted = $stmt->fetch(PDO::FETCH_ASSOC);

if ($isDeleted) {
    // User bị xóa, logout và redirect về login
    session_destroy();
    header('Location: login.php?expired=1');
    exit;
}
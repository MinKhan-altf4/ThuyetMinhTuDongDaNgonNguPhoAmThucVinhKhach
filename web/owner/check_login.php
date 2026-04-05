<?php
// seller/check_login.php — Middleware bảo vệ route

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (empty($_SESSION['seller_id']) || $_SESSION['seller_role'] !== 'seller') {
    header('Location: /seller/login.php');
    exit;
}

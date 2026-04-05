<?php
// config.php
// Chỉnh thông tin kết nối cho phù hợp với máy của bạn

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'food_app');
define('DB_USER', 'root');
define('DB_PASS', '');         // XAMPP mặc định không có mật khẩu
define('DB_CHAR', 'utf8mb4');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHAR,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    // Hiển thị lỗi kết nối rõ ràng thay vì "Undefined variable $pdo"
    die('<div style="font-family:sans-serif;padding:2rem;color:#c00">
            <strong>Lỗi kết nối cơ sở dữ liệu:</strong><br>
            ' . htmlspecialchars($e->getMessage()) . '
         </div>');
}
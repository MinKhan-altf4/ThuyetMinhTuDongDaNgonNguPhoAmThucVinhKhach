<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "food_app"; // Tên database từ file food_app.sql

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Kết nối thất bại: " . $conn->connect_error);
}

// Thiết lập tiếng Việt có dấu
$conn->set_charset("utf8mb4");
?>
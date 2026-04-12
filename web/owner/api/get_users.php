<?php
/**
 * API Get Users - cho trang quản lý POI
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$host     = 'localhost';
$user     = 'root';
$password = '';
$database = 'food_app';

$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'error' => 'Database connection failed']));
}
$conn->set_charset("utf8mb4");

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        $sql = "SELECT user_id, name, email, is_active FROM users ORDER BY name";
        $result = $conn->query($sql);
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = [
                'user_id' => (int)$row['user_id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'is_active' => (int)$row['is_active']
            ];
        }
        
        echo json_encode(['success' => true, 'data' => $users]);
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Action not allowed']);
}

$conn->close();
?>

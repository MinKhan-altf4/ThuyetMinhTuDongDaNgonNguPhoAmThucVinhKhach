<?php
/**
 * API trả về danh sách POI (JSON)
 * File: api.php
 *
 * Cách dùng:
 *   http://localhost/POIApi/api.php
 *   hoặc
 *   http://<IP_may_tinh>/POIApi/api.php (từ điện thoại)
 */

// =====================================================
// CẤU HÌNH KẾT NỐI DATABASE
// =====================================================
// Sửa thông tin này cho đúng với XAMPP của bạn
// Mặc định XAMPP:
//   Host: localhost
//   User: root
//   Password: (để trống)
//   Database: poi_demo
// =====================================================
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'poi_demo';

// =====================================================
// KẾT NỐI DATABASE
// =====================================================
try {
    $conn = new mysqli($host, $user, $password, $database);

    // Kiểm tra lỗi kết nối
    if ($conn->connect_error) {
        throw new Exception("Kết nối database thất bại: " . $conn->connect_error);
    }

    // Thiết lập UTF-8
    $conn->set_charset("utf8");

} catch (Exception $e) {
    // Trả về lỗi JSON
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    exit;
}

// =====================================================
// LẤY DANH SÁCH POI
// =====================================================
try {
    $sql = "SELECT id, name, description, latitude, longitude FROM pois ORDER BY id";
    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Truy vấn thất bại: " . $conn->error);
    }

    $pois = [];

    // Đọc từng dòng kết quả
    while ($row = $result->fetch_assoc()) {
        $pois[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'latitude' => (float)$row['latitude'],
            'longitude' => (float)$row['longitude']
        ];
    }

    // =====================================================
    // TRẢ VỀ JSON
    // =====================================================
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'success' => true,
        'count' => count($pois),
        'data' => $pois
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} finally {
    // Đóng kết nối
    if (isset($conn)) {
        $conn->close();
    }
}
?>

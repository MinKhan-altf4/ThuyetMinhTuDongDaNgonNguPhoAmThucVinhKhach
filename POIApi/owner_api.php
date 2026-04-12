<?php
/**
 * ============================================================
 * OWNER/ADMIN API - QUẢN LÝ POI-USER
 * ============================================================
 * 
 * Endpoints:
 *   POST /owner_api.php?action=add_poi_to_user
 *       → Thêm POI cho user
 *       Params: user_id, restaurant_id, admin_email
 * 
 *   DELETE /owner_api.php?action=remove_poi_from_user
 *       → Xóa POI khỏi user
 *       Params: user_id, restaurant_id
 * 
 *   GET /owner_api.php?action=user_pois&user_id=<id>
 *       → Lấy danh sách POI của user
 * 
 *   GET /owner_api.php?action=available_restaurants
 *       → Lấy danh sách tất cả restaurants có sẵn
 * 
 *   POST /owner_api.php?action=toggle_user_status
 *       → Khóa/mở khóa user
 *       Params: user_id, is_active (1|0)
 */

// =====================================================
// CẤU HÌNH KẾT NỐI
// =====================================================
$host     = 'localhost';
$user     = 'root';
$password = '';
$database = 'food_app';

$conn = null;
try {
    $conn = new mysqli($host, $user, $password, $database);
    if ($conn->connect_error) {
        throw new Exception("Kết nối database thất bại: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    sendJson(false, null, $e->getMessage());
    exit;
}

// =====================================================
// ROUTE
// =====================================================
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Kiểm tra authentication (optional - nếu cần)
// validateAdminToken();

switch ($action) {
    case 'add_poi_to_user':
        if ($method !== 'POST') {
            sendJson(false, null, "Method not allowed");
            exit;
        }
        addPoiToUser($conn);
        break;

    case 'remove_poi_from_user':
        if ($method !== 'POST') {
            sendJson(false, null, "Method not allowed");
            exit;
        }
        removePoiFromUser($conn);
        break;

    case 'user_pois':
        getUserPois($conn);
        break;

    case 'available_restaurants':
        getAvailableRestaurants($conn);
        break;

    case 'toggle_user_status':
        if ($method !== 'POST') {
            sendJson(false, null, "Method not allowed");
            exit;
        }
        toggleUserStatus($conn);
        break;

    default:
        sendJson(false, null, "Action không hợp lệ");
        break;
}

// =====================================================
// ENDPOINT: POST /owner_api.php?action=add_poi_to_user
// =====================================================
function addPoiToUser($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $user_id = (int)($input['user_id'] ?? 0);
        $restaurant_id = (int)($input['restaurant_id'] ?? 0);
        $admin_email = trim($input['admin_email'] ?? '');

        if ($user_id <= 0 || $restaurant_id <= 0) {
            sendJson(false, null, "user_id và restaurant_id phải > 0");
            return;
        }

        // Kiểm tra user tồn tại
        $stmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        if (!$stmt->get_result()->fetch_assoc()) {
            sendJson(false, null, "User không tồn tại");
            return;
        }
        $stmt->close();

        // Kiểm tra restaurant tồn tại
        $stmt = $conn->prepare("SELECT restaurant_id FROM restaurant WHERE restaurant_id = ?");
        $stmt->bind_param("i", $restaurant_id);
        $stmt->execute();
        if (!$stmt->get_result()->fetch_assoc()) {
            sendJson(false, null, "Restaurant không tồn tại");
            return;
        }
        $stmt->close();

        // Thêm vào user_restaurants (INSERT IGNORE để tránh duplicate)
        $sql = "INSERT IGNORE INTO user_restaurants 
                (user_id, restaurant_id, added_by, created_at)
                VALUES (?, ?, ?, NOW())";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iis", $user_id, $restaurant_id, $admin_email);
        
        if (!$stmt->execute()) {
            sendJson(false, null, "Lỗi: " . $stmt->error);
            return;
        }

        $stmt->close();
        sendJson(true, [
            'user_id' => $user_id,
            'restaurant_id' => $restaurant_id,
            'message' => 'Thêm POI thành công'
        ], null, "POI đã được thêm cho user");
    } catch (Exception $e) {
        sendJson(false, null, $e->getMessage());
    }
}

// =====================================================
// ENDPOINT: POST /owner_api.php?action=remove_poi_from_user
// =====================================================
function removePoiFromUser($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $user_id = (int)($input['user_id'] ?? 0);
        $restaurant_id = (int)($input['restaurant_id'] ?? 0);

        if ($user_id <= 0 || $restaurant_id <= 0) {
            sendJson(false, null, "user_id và restaurant_id phải > 0");
            return;
        }

        $sql = "DELETE FROM user_restaurants 
                WHERE user_id = ? AND restaurant_id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $user_id, $restaurant_id);
        
        if (!$stmt->execute()) {
            sendJson(false, null, "Lỗi: " . $stmt->error);
            return;
        }

        if ($stmt->affected_rows == 0) {
            sendJson(false, null, "Không tìm thấy POI liên kết này");
            return;
        }

        $stmt->close();
        sendJson(true, [
            'user_id' => $user_id,
            'restaurant_id' => $restaurant_id,
            'message' => 'Xóa POI thành công'
        ], null, "POI đã được xóa khỏi user");
    } catch (Exception $e) {
        sendJson(false, null, $e->getMessage());
    }
}

// =====================================================
// ENDPOINT: GET /owner_api.php?action=user_pois&user_id=<id>
// =====================================================
function getUserPois($conn) {
    $user_id = (int)($_GET['user_id'] ?? 0);

    if ($user_id <= 0) {
        sendJson(false, null, "user_id không hợp lệ");
        return;
    }

    // Lấy user info
    $stmt = $conn->prepare("SELECT user_id, name, email, is_active FROM users WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $userRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$userRow) {
        sendJson(false, null, "User không tồn tại");
        return;
    }

    // Lấy danh sách POI của user
    $sql = "SELECT 
                ur.id as link_id,
                r.restaurant_id,
                r.name,
                r.description,
                r.lat,
                r.lng,
                r.address,
                r.rating,
                r.status,
                ur.created_at
            FROM user_restaurants ur
            JOIN restaurant r ON r.restaurant_id = ur.restaurant_id
            WHERE ur.user_id = ?
            ORDER BY r.name";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $pois = [];
    while ($row = $result->fetch_assoc()) {
        $pois[] = [
            'link_id'        => (int)$row['link_id'],
            'restaurant_id'  => (int)$row['restaurant_id'],
            'name'           => $row['name'],
            'description'    => $row['description'],
            'latitude'       => (float)$row['lat'],
            'longitude'      => (float)$row['lng'],
            'address'        => $row['address'],
            'rating'         => (float)$row['rating'],
            'status'         => $row['status'],
            'added_at'       => $row['created_at'],
        ];
    }

    $stmt->close();

    sendJson(true, [
        'user' => [
            'user_id'   => (int)$userRow['user_id'],
            'name'      => $userRow['name'],
            'email'     => $userRow['email'],
            'is_active' => (int)$userRow['is_active'],
        ],
        'pois' => $pois,
        'total' => count($pois)
    ], null, "Danh sách POI của user");
}

// =====================================================
// ENDPOINT: GET /owner_api.php?action=available_restaurants
// =====================================================
function getAvailableRestaurants($conn) {
    $sql = "SELECT 
                restaurant_id,
                name,
                description,
                lat,
                lng,
                address,
                rating,
                status
            FROM restaurant
            WHERE status = 'open'
            ORDER BY name";
    
    $result = $conn->query($sql);
    if (!$result) {
        sendJson(false, null, "Lỗi: " . $conn->error);
        return;
    }

    $restaurants = [];
    while ($row = $result->fetch_assoc()) {
        $restaurants[] = [
            'restaurant_id' => (int)$row['restaurant_id'],
            'name'          => $row['name'],
            'description'   => $row['description'],
            'latitude'      => (float)$row['lat'],
            'longitude'     => (float)$row['lng'],
            'address'       => $row['address'],
            'rating'        => (float)$row['rating'],
            'status'        => $row['status'],
        ];
    }

    sendJson(true, $restaurants, null, "Danh sách restaurants có sẵn");
}

// =====================================================
// ENDPOINT: POST /owner_api.php?action=toggle_user_status
// =====================================================
function toggleUserStatus($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $user_id = (int)($input['user_id'] ?? 0);
        $is_active = (int)($input['is_active'] ?? 1);

        if ($user_id <= 0) {
            sendJson(false, null, "user_id không hợp lệ");
            return;
        }

        if ($is_active !== 0 && $is_active !== 1) {
            sendJson(false, null, "is_active phải là 0 (khóa) hoặc 1 (mở khóa)");
            return;
        }

        // Cập nhật user status
        $sql = "UPDATE users SET is_active = ? WHERE user_id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $is_active, $user_id);
        
        if (!$stmt->execute()) {
            sendJson(false, null, "Lỗi: " . $stmt->error);
            return;
        }

        if ($stmt->affected_rows == 0) {
            sendJson(false, null, "User không tồn tại");
            return;
        }

        $stmt->close();
        
        $status = $is_active ? 'mở khóa' : 'khóa';
        sendJson(true, [
            'user_id' => $user_id,
            'is_active' => $is_active,
            'message' => "User đã được $status"
        ], null, "Cập nhật trạng thái user thành công");
    } catch (Exception $e) {
        sendJson(false, null, $e->getMessage());
    }
}

// =====================================================
// HELPER: Trả JSON
// =====================================================
function sendJson($success, $data = null, $error = null, $message = null) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    $out = ['success' => $success];
    if ($data   !== null) $out['data']    = $data;
    if ($error  !== null) $out['error']   = $error;
    if ($message !== null) $out['message'] = $message;
    echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// =====================================================
// DỌN DẶP
// =====================================================
if (isset($conn)) {
    $conn->close();
}
?>

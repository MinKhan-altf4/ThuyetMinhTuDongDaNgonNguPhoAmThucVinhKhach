<?php
/**
 * ============================================================
 * FOOD APP API - MULTI-LANGUAGE + OFFLINE AUDIO SUPPORT
 * ============================================================
 *
 * Database: food_app (thay vì poi_demo)
 *
 * Endpoints:
 *   GET /api.php
 *       → Danh sách tất cả restaurant (mặc định, backward compatible)
 *
 *   GET /api.php?action=restaurants
 *       → Danh sách restaurant với audio đa ngôn ngữ
 *
 *   GET /api.php?action=search&q=<keyword>
 *       → Tìm kiếm autocomplete theo tên
 *
 *   GET /api.php?action=audio&restaurant_id=<id>&lang=<vi|en|zh|jp>
 *       → Lấy audio_url cho restaurant + ngôn ngữ
 *
 *   GET /api.php?action=dishes&restaurant_id=<id>
 *       → Danh sách món ăn của restaurant
 */

// =====================================================
// CẤU HÌNH KẾT NỐI
// =====================================================
$host     = 'switchyard.proxy.rlwy.net';
$port     = 50891;
$user     = 'root';
$password = 'ZAYAgpUFnumRoVDwXnaUMIwRlwpjefuy';
$database = 'railway';

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Set timeout
set_time_limit(30);
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conn = null;
try {
    $conn = new mysqli($host, $user, $password, $database, $port);
    if ($conn->connect_error) {
        throw new Exception("Kết nối database thất bại: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
    // Tối ưu kết nối
    $conn->query("SET SESSION sql_mode='STRICT_TRANS_TABLES'");
} catch (Exception $e) {
    sendJson(false, null, $e->getMessage());
    exit;
}

// =====================================================
// ROUTE
// =====================================================
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'GET') {
    sendJson(false, null, "Method not allowed");
    exit;
}

switch ($action) {
    case 'restaurants':
        getRestaurants($conn);
        break;
    case 'search':
        searchRestaurants($conn);
        break;
    case 'audio':
        getAudio($conn);
        break;
    case 'dishes':
        getDishes($conn);
        break;
    default:
        // backward-compatible: trả danh sách restaurant đơn giản
        getLegacyPOIs($conn);
        break;
}

// =====================================================
// ENDPOINT: /api.php (legacy, backward compatible)
// =====================================================
function getLegacyPOIs($conn) {
    // Chỉ lấy POI của user có is_active = 1
    $sql = "SELECT DISTINCT
                r.restaurant_id  AS id,
                r.name,
                r.description,
                r.lat            AS latitude,
                r.lng            AS longitude,
                r.address,
                r.open_hour,
                r.close_hour,
                r.rating,
                r.phone,
                COALESCE(a_vi.audio_url, a_en.audio_url) AS audio_url
            FROM restaurant r
            LEFT JOIN user_restaurants ur ON ur.restaurant_id = r.restaurant_id
            LEFT JOIN users u ON u.user_id = ur.user_id AND u.is_active = 1
            LEFT JOIN audio a_vi  ON a_vi.restaurant_id = r.restaurant_id  AND a_vi.language_id = 1 AND a_vi.is_active = 1
            LEFT JOIN audio a_en ON a_en.restaurant_id = r.restaurant_id AND a_en.language_id = 2 AND a_en.is_active = 1
            WHERE r.status = 'open'
               AND (ur.id IS NOT NULL AND u.is_active = 1 OR ur.id IS NULL)
            ORDER BY r.restaurant_id
            LIMIT 100";

    $result = $conn->query($sql);
    if (!$result) {
        sendJson(false, null, "Lỗi truy vấn: " . $conn->error);
        return;
    }

    $pois = [];
    while ($row = $result->fetch_assoc()) {
        $pois[] = [
            'id'          => (int)$row['id'],
            'name'        => $row['name'],
            'description' => $row['description'],
            'latitude'    => (float)$row['latitude'],
            'longitude'   => (float)$row['longitude'],
            'address'     => $row['address'],
            'open_hour'   => $row['open_hour'],
            'close_hour'  => $row['close_hour'],
            'rating'      => (float)$row['rating'],
            'phone'       => $row['phone'],
            'audio_url'   => $row['audio_url'],
        ];
    }

    sendJson(true, $pois, null, "Danh sách POI (legacy, chỉ active user)");
}

// =====================================================
// ENDPOINT: /api.php?action=restaurants
// =====================================================
function getRestaurants($conn) {
    $langId = (int)($_GET['lang_id'] ?? 1);

    // Tối ưu: Lấy restaurants từ user_restaurants (chỉ hiện POI của user active)
    // JOIN với users để kiểm tra is_active
    $sql = "SELECT DISTINCT
                r.restaurant_id   AS id,
                r.name,
                r.description,
                r.lat,
                r.lng,
                r.address,
                r.open_hour,
                r.close_hour,
                r.rating,
                r.phone,
                u.name as owner_name,
                (SELECT image_url FROM restaurant_image WHERE restaurant_id = r.restaurant_id AND is_primary = 1 LIMIT 1) AS image_url,
                GROUP_CONCAT(
                    CONCAT(l.language_code, ':', a.audio_url, '|', COALESCE(a.duration, 0), '|', COALESCE(a.version, 0))
                    SEPARATOR '||'
                ) AS audio_data
            FROM restaurant r
            LEFT JOIN user_restaurants ur ON ur.restaurant_id = r.restaurant_id
            LEFT JOIN users u ON u.user_id = ur.user_id AND u.is_active = 1
            LEFT JOIN audio a ON a.restaurant_id = r.restaurant_id AND a.is_active = 1
            LEFT JOIN languages l ON l.language_id = a.language_id
            WHERE r.status = 'open' 
               AND (ur.id IS NOT NULL AND u.is_active = 1 OR ur.id IS NULL)
            GROUP BY r.restaurant_id
            ORDER BY r.rating DESC, r.name";

    $result = $conn->query($sql);
    if (!$result) {
        sendJson(false, null, "Lỗi: " . $conn->error);
        return;
    }

    $restaurants = [];
    while ($row = $result->fetch_assoc()) {
        $id = (int)$row['id'];
        
        // Parse audio data từ GROUP_CONCAT
        $audio = [];
        if (!empty($row['audio_data'])) {
            $audioItems = explode('||', $row['audio_data']);
            foreach ($audioItems as $item) {
                $parts = explode(':', $item, 2);
                if (count($parts) === 2) {
                    $langCode = $parts[0];
                    $audioInfo = explode('|', $parts[1]);
                    if (count($audioInfo) === 3) {
                        $audio[$langCode] = [
                            'url' => $audioInfo[0],
                            'duration' => (int)$audioInfo[1],
                            'version' => (int)$audioInfo[2],
                        ];
                    }
                }
            }
        }

        $restaurants[] = [
            'id'          => $id,
            'name'        => $row['name'],
            'description' => $row['description'],
            'latitude'    => (float)$row['lat'],
            'longitude'   => (float)$row['lng'],
            'address'     => $row['address'],
            'open_hour'   => $row['open_hour'],
            'close_hour'  => $row['close_hour'],
            'rating'      => (float)$row['rating'],
            'phone'       => $row['phone'],
            'owner_name'  => $row['owner_name'],
            'image_url'   => $row['image_url'],
            'audio'       => $audio,
        ];
    }

    sendJson(true, $restaurants, null, "Danh sách restaurant đa ngôn ngữ (chỉ user active)");
}

// =====================================================
// ENDPOINT: /api.php?action=search&q=<keyword>
// =====================================================
function searchRestaurants($conn) {
    $q = trim($_GET['q'] ?? '');
    $limit = min((int)($_GET['limit'] ?? 10), 20);

    if (mb_strlen($q) < 1) {
        sendJson(false, null, "Từ khóa quá ngắn");
        return;
    }

    // Ưu tiên kết quả gần nhất nếu có tọa độ
    $lat = isset($_GET['lat']) ? (float)$_GET['lat'] : null;
    $lng = isset($_GET['lng']) ? (float)$_GET['lng'] : null;

    $like = '%' . $conn->escape_string($q) . '%';

    $sql = "SELECT
                r.restaurant_id AS id,
                r.name,
                r.description,
                r.lat,
                r.lng,
                r.address,
                r.rating,
                (SELECT image_url FROM restaurant_image WHERE restaurant_id = r.restaurant_id AND is_primary = 1 LIMIT 1) AS image_url
            FROM restaurant r
            WHERE r.name LIKE ?
               OR r.description LIKE ?
               OR r.address LIKE ?
            ORDER BY r.rating DESC, r.name
            LIMIT ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        sendJson(false, null, "Lỗi prepare: " . $conn->error);
        return;
    }
    $stmt->bind_param("sssi", $like, $like, $like, $limit);
    if (!$stmt->execute()) {
        sendJson(false, null, "Lỗi execute: " . $stmt->error);
        return;
    }
    $result = $stmt->get_result();

    $suggestions = [];
    while ($row = $result->fetch_assoc()) {
        $dist = null;
        if ($lat !== null && $lng !== null) {
            $dist = haversineDistance($lat, $lng, (float)$row['lat'], (float)$row['lng']);
        }

        $suggestions[] = [
            'id'          => (int)$row['id'],
            'name'        => $row['name'],
            'description' => mb_strlen($row['description']) > 80 ? mb_substr($row['description'], 0, 80) . '…' : $row['description'],
            'latitude'    => (float)$row['lat'],
            'longitude'   => (float)$row['lng'],
            'address'     => $row['address'],
            'rating'      => (float)$row['rating'],
            'distance'    => $dist !== null ? round($dist) : null,
            'image_url'   => $row['image_url'],
        ];
    }

    // Sắp xếp theo khoảng cách nếu có
    if ($lat !== null && $lng !== null && count($suggestions) > 0) {
        usort($suggestions, fn($a, $b) => ($a['distance'] ?? 99999) <=> ($b['distance'] ?? 99999));
    }

    $stmt->close();
    sendJson(true, $suggestions, null, "Kết quả tìm kiếm cho: $q");
}

// =====================================================
// ENDPOINT: /api.php?action=audio&restaurant_id=<id>&lang=<vi|en|zh|jp>
// =====================================================
function getAudio($conn) {
    $id   = (int)($_GET['restaurant_id'] ?? 0);
    $lang = $_GET['lang'] ?? 'vi';

    if ($id <= 0) {
        sendJson(false, null, "restaurant_id không hợp lệ");
        return;
    }

    $langMap = ['vi' => 1, 'en' => 2, 'zh' => 3, 'jp' => 4];
    $langId = $langMap[$lang] ?? 1;

    $sql = "SELECT audio_url, duration, version, last_updated
            FROM audio
            WHERE restaurant_id = ? AND language_id = ? AND is_active = 1
            LIMIT 1";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        sendJson(false, null, "Lỗi prepare: " . $conn->error);
        return;
    }
    
    $stmt->bind_param("ii", $id, $langId);
    if (!$stmt->execute()) {
        sendJson(false, null, "Lỗi execute: " . $stmt->error);
        return;
    }
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        sendJson(true, [
            'restaurant_id' => $id,
            'language'      => $lang,
            'audio_url'     => $row['audio_url'],
            'duration'      => (int)$row['duration'],
            'version'       => (int)$row['version'],
            'last_updated'  => $row['last_updated'],
        ]);
    } else {
        sendJson(false, null, "Không tìm thấy audio cho ngôn ngữ: $lang");
    }

    $stmt->close();
}

// =====================================================
// ENDPOINT: /api.php?action=dishes&restaurant_id=<id>
// =====================================================
function getDishes($conn) {
    $id = (int)($_GET['restaurant_id'] ?? 0);

    if ($id <= 0) {
        sendJson(false, null, "restaurant_id không hợp lệ");
        return;
    }

    $sql = "SELECT dish_id, name, description, price, image_url, is_active
            FROM dish
            WHERE restaurant_id = ? AND is_active = 1
            ORDER BY dish_id";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        sendJson(false, null, "Lỗi prepare: " . $conn->error);
        return;
    }
    
    $stmt->bind_param("i", $id);
    if (!$stmt->execute()) {
        sendJson(false, null, "Lỗi execute: " . $stmt->error);
        return;
    }
    $result = $stmt->get_result();

    $dishes = [];
    while ($row = $result->fetch_assoc()) {
        $dishes[] = [
            'dish_id'      => (int)$row['dish_id'],
            'restaurant_id' => $id,
            'name'        => $row['name'],
            'description' => $row['description'],
            'price'       => (float)$row['price'],
            'image_url'   => $row['image_url'],
            'is_active'   => (int)$row['is_active'],
        ];
    }

    $stmt->close();
    sendJson(true, $dishes, null, "Danh sách món ăn");
}

// =====================================================
// HELPER: Audio đa ngôn ngữ cho 1 restaurant
// =====================================================
function getAudioForRestaurant($conn, $restaurantId) {
    $sql = "SELECT
                l.language_code,
                a.audio_url,
                a.duration,
                a.version
            FROM audio a
            JOIN languages l ON l.language_id = a.language_id
            WHERE a.restaurant_id = ? AND a.is_active = 1
            ORDER BY a.language_id";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $restaurantId);
    $stmt->execute();
    $result = $stmt->get_result();

    $audio = [];
    while ($row = $result->fetch_assoc()) {
        $audio[$row['language_code']] = [
            'url'      => $row['audio_url'],
            'duration' => (int)$row['duration'],
            'version'  => (int)$row['version'],
        ];
    }

    $stmt->close();
    return $audio;
}

// =====================================================
// HELPER: Khoảng cách Haversine ( mét )
// =====================================================
function haversineDistance($lat1, $lon1, $lat2, $lon2) {
    $R = 6371000; // bán kính trái đất (m)
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) * sin($dLat / 2)
       + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
       * sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $R * $c;
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
// DỌN DẸP
// =====================================================
if (isset($conn)) {
    $conn->close();
}
?>

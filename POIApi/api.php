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

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

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
$path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';

if (strpos($path, '/api/app-opens') !== false) {
    handleAppOpens($conn, $method, $path);
    exit;
}

if (strpos($path, '/api/online-sessions') !== false) {
    handleOnlineSessions($conn, $method, $path);
    exit;
}

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
function handleAppOpens($conn, $method, $path) {
    ensureAppOpensTable($conn);

    if ($method === 'POST' && preg_match('#/api/app-opens/?$#', $path)) {
        $body = readJsonBody();
        $deviceId = trim($body['device_id'] ?? '');
        if ($deviceId === '') {
            sendRawJson(['error' => 'Thieu device_id'], 400);
            return;
        }

        $stmt = $conn->prepare(
            "INSERT INTO app_opens (device_id, device_type, app_version, language_code, opened_at)
             VALUES (?, ?, ?, ?, NOW())"
        );
        $deviceType = $body['device_type'] ?? null;
        $appVersion = $body['app_version'] ?? null;
        $languageCode = $body['language_code'] ?? null;
        $stmt->bind_param("ssss", $deviceId, $deviceType, $appVersion, $languageCode);
        $stmt->execute();
        $stmt->close();

        sendRawJson(['success' => true]);
        return;
    }

    if ($method === 'GET' && preg_match('#/api/app-opens/stats/?$#', $path)) {
        $result = $conn->query("
            SELECT
              COUNT(*) AS total_opens,
              COUNT(DISTINCT device_id) AS unique_devices,
              MAX(opened_at) AS last_open,
              SUM(CASE WHEN device_type LIKE '%Android%' THEN 1 ELSE 0 END) AS android_count,
              SUM(CASE WHEN device_type LIKE '%iOS%' OR device_type LIKE '%iPhone%' OR device_type LIKE '%iPad%' THEN 1 ELSE 0 END) AS ios_count,
              SUM(CASE WHEN device_type LIKE '%Windows%' THEN 1 ELSE 0 END) AS windows_count
            FROM app_opens
        ");
        $row = $result->fetch_assoc() ?: [];
        sendRawJson([
            'total_opens' => (int)($row['total_opens'] ?? 0),
            'unique_devices' => (int)($row['unique_devices'] ?? 0),
            'last_open' => $row['last_open'] ?? null,
            'android_count' => (int)($row['android_count'] ?? 0),
            'ios_count' => (int)($row['ios_count'] ?? 0),
            'windows_count' => (int)($row['windows_count'] ?? 0),
        ]);
        return;
    }

    if ($method === 'DELETE' && preg_match('#/api/app-opens/?$#', $path)) {
        $conn->query("DELETE FROM app_opens");
        sendRawJson(['success' => true]);
        return;
    }

    sendRawJson(['error' => 'Not found'], 404);
}

function handleOnlineSessions($conn, $method, $path) {
    ensureOnlineSessionTable($conn);

    if ($method === 'POST' && preg_match('#/api/online-sessions/start/?$#', $path)) {
        $body = readJsonBody();
        $sessionId = trim($body['session_id'] ?? '');
        $deviceId = trim($body['device_id'] ?? '');
        if ($sessionId === '' || $deviceId === '') {
            sendRawJson(['error' => 'Thieu session_id hoac device_id'], 400);
            return;
        }

        $stmt = $conn->prepare(
            "INSERT INTO app_online_sessions
                (session_id, device_id, device_type, app_version, language_code, started_at, last_seen, ended_at, is_active)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NULL, 1)
             ON DUPLICATE KEY UPDATE
                device_id = VALUES(device_id),
                device_type = VALUES(device_type),
                app_version = VALUES(app_version),
                language_code = VALUES(language_code),
                last_seen = NOW(),
                ended_at = NULL,
                is_active = 1"
        );
        $deviceType = $body['device_type'] ?? null;
        $appVersion = $body['app_version'] ?? null;
        $languageCode = $body['language_code'] ?? null;
        $stmt->bind_param("sssss", $sessionId, $deviceId, $deviceType, $appVersion, $languageCode);
        $stmt->execute();
        $stmt->close();

        sendRawJson(['success' => true]);
        return;
    }

    if ($method === 'POST' && preg_match('#/api/online-sessions/heartbeat/?$#', $path)) {
        updateOnlineSessionHeartbeat($conn, readJsonBody());
        sendRawJson(['success' => true]);
        return;
    }

    if ($method === 'POST' && preg_match('#/api/online-sessions/end/?$#', $path)) {
        $body = readJsonBody();
        $sessionId = trim($body['session_id'] ?? '');
        $deviceId = trim($body['device_id'] ?? '');
        if ($sessionId === '' || $deviceId === '') {
            sendRawJson(['error' => 'Thieu session_id hoac device_id'], 400);
            return;
        }

        $stmt = $conn->prepare(
            "UPDATE app_online_sessions
             SET is_active = 0, ended_at = NOW(), last_seen = NOW()
             WHERE session_id = ? AND device_id = ?"
        );
        $stmt->bind_param("ss", $sessionId, $deviceId);
        $stmt->execute();
        $stmt->close();

        sendRawJson(['success' => true]);
        return;
    }

    if ($method === 'GET' && preg_match('#/api/online-sessions/stats/?$#', $path)) {
        expireStaleOnlineSessions($conn);
        $result = $conn->query("
            SELECT
              COUNT(*) AS online_count,
              COUNT(DISTINCT device_id) AS unique_online_devices,
              MAX(last_seen) AS last_seen,
              SUM(CASE WHEN device_type LIKE '%Android%' THEN 1 ELSE 0 END) AS android_online,
              SUM(CASE WHEN device_type LIKE '%iOS%' OR device_type LIKE '%iPhone%' OR device_type LIKE '%iPad%' THEN 1 ELSE 0 END) AS ios_online,
              SUM(CASE WHEN device_type LIKE '%Windows%' THEN 1 ELSE 0 END) AS windows_online
            FROM app_online_sessions
            WHERE is_active = 1
              AND last_seen >= DATE_SUB(NOW(), INTERVAL 90 SECOND)
        ");
        $row = $result->fetch_assoc() ?: [];
        sendRawJson([
            'online_count' => (int)($row['online_count'] ?? 0),
            'unique_online_devices' => (int)($row['unique_online_devices'] ?? 0),
            'last_seen' => $row['last_seen'] ?? null,
            'android_online' => (int)($row['android_online'] ?? 0),
            'ios_online' => (int)($row['ios_online'] ?? 0),
            'windows_online' => (int)($row['windows_online'] ?? 0),
            'stale_after_seconds' => 90,
        ]);
        return;
    }

    sendRawJson(['error' => 'Not found'], 404);
}

function updateOnlineSessionHeartbeat($conn, $body) {
    $sessionId = trim($body['session_id'] ?? '');
    $deviceId = trim($body['device_id'] ?? '');
    if ($sessionId === '' || $deviceId === '') {
        sendRawJson(['error' => 'Thieu session_id hoac device_id'], 400);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE app_online_sessions
         SET last_seen = NOW(), is_active = 1, ended_at = NULL
         WHERE session_id = ? AND device_id = ?"
    );
    $stmt->bind_param("ss", $sessionId, $deviceId);
    $stmt->execute();
    $stmt->close();
}

function ensureAppOpensTable($conn) {
    $conn->query("
        CREATE TABLE IF NOT EXISTS app_opens (
          open_id INT AUTO_INCREMENT PRIMARY KEY,
          device_id VARCHAR(128) NOT NULL,
          device_type VARCHAR(255) NULL,
          app_version VARCHAR(50) NULL,
          language_code VARCHAR(20) NULL,
          opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_app_opens_device (device_id),
          INDEX idx_app_opens_opened_at (opened_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

function ensureOnlineSessionTable($conn) {
    $conn->query("
        CREATE TABLE IF NOT EXISTS app_online_sessions (
          session_id VARCHAR(64) NOT NULL PRIMARY KEY,
          device_id VARCHAR(128) NOT NULL,
          device_type VARCHAR(255) NULL,
          app_version VARCHAR(50) NULL,
          language_code VARCHAR(20) NULL,
          started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          ended_at DATETIME NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          INDEX idx_online_active_last_seen (is_active, last_seen),
          INDEX idx_online_device (device_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

function expireStaleOnlineSessions($conn) {
    $conn->query("
        UPDATE app_online_sessions
        SET is_active = 0, ended_at = COALESCE(ended_at, last_seen)
        WHERE is_active = 1
          AND last_seen < DATE_SUB(NOW(), INTERVAL 90 SECOND)
    ");
}

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

function sendRawJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

function readJsonBody() {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

// =====================================================
// DỌN DẸP
// =====================================================
if (isset($conn)) {
    $conn->close();
}
// =====================================================
// BẢNG active_sessions (chạy 1 lần trên MySQL)
// =====================================================
// CREATE TABLE active_sessions (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   device_id VARCHAR(255) UNIQUE NOT NULL,
//   last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// =====================================================
// ENDPOINT: session/start, session/heartbeat, session/end
// =====================================================
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api.php', '', $path);

if ($path === '/session/start' || $_GET['action'] === 'session_start') {
    $input = json_decode(file_get_contents('php://input'), true);
    $device_id = $input['device_id'] ?? '';
    if ($device_id) {
        $stmt = $conn->prepare("INSERT INTO active_sessions (device_id) VALUES (?) ON DUPLICATE KEY UPDATE last_seen = NOW()");
        $stmt->bind_param("s", $device_id);
        $stmt->execute();
        sendJson(true, ['message' => 'Session started']);
    }
}

if ($_GET['action'] === 'session_heartbeat') {
    $input = json_decode(file_get_contents('php://input'), true);
    $device_id = $input['device_id'] ?? '';
    if ($device_id) {
        $stmt = $conn->prepare("INSERT INTO active_sessions (device_id) VALUES (?) ON DUPLICATE KEY UPDATE last_seen = NOW()");
        $stmt->bind_param("s", $device_id);
        $stmt->execute();
        sendJson(true, ['message' => 'Heartbeat ok']);
    }
}

if ($_GET['action'] === 'session_end') {
    $input = json_decode(file_get_contents('php://input'), true);
    $device_id = $input['device_id'] ?? '';
    if ($device_id) {
        $stmt = $conn->prepare("DELETE FROM active_sessions WHERE device_id = ?");
        $stmt->bind_param("s", $device_id);
        $stmt->execute();
        sendJson(true, ['message' => 'Session ended']);
    }
}

if ($_GET['action'] === 'online_count') {
    // Xóa session quá 60 giây không heartbeat
    $conn->query("DELETE FROM active_sessions WHERE last_seen < NOW() - INTERVAL 60 SECOND");
    $result = $conn->query("SELECT COUNT(*) as count FROM active_sessions");
    $row = $result->fetch_assoc();
    sendJson(true, ['online' => (int)$row['count']]);
}
?>

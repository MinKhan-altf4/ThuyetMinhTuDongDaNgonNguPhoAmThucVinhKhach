<?php
/**
 * API Endpoint: GET /api.php?action=dishes&restaurant_id={id}
 * 
 * Mục đích: Lấy danh sách món ăn của 1 nhà hàng
 * Database: SELECT name, description, price FROM dish WHERE restaurant_id = ? AND is_active = 1
 */

require_once 'config.php';

// ─────────────────────────────────────────
// Xử lý action=dishes
// ─────────────────────────────────────────

if (isset($_GET['action']) && $_GET['action'] === 'dishes') {
    
    // Lấy restaurant_id từ query string
    $restaurant_id = isset($_GET['restaurant_id']) ? (int)$_GET['restaurant_id'] : 0;
    
    if ($restaurant_id <= 0) {
        sendJson(false, [], "Thiếu hoặc sai restaurant_id");
        exit;
    }
    
    try {
        $db = new PDO($DSN, $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        
        // SQL: Lấy tất cả món ăn active
        $stmt = $db->prepare(
            "SELECT dish_id, restaurant_id, name, description, price, image_url, is_active
             FROM dish
             WHERE restaurant_id = ? AND is_active = 1
             ORDER BY dish_id ASC"
        );
        $stmt->execute([$restaurant_id]);
        $dishes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log
        error_log("[API-DISHES] GET /api.php?action=dishes&restaurant_id=$restaurant_id → " . count($dishes) . " món");
        
        // Response
        sendJson(true, $dishes, null);
        
    } catch (PDOException $e) {
        error_log("[API-DISHES] ❌ DB Error: " . $e->getMessage());
        sendJson(false, [], "Database error: " . $e->getMessage());
    } catch (Exception $e) {
        error_log("[API-DISHES] ❌ Exception: " . $e->getMessage());
        sendJson(false, [], "Server error: " . $e->getMessage());
    }
    
    exit;
}

/**
 * Gửi response JSON với format chuẩn.
 * {
 *   "success": true|false,
 *   "data": [...],
 *   "error": "..." (nếu có lỗi)
 * }
 */
function sendJson($success, $data, $error = null) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => $success,
        'data'    => $data,
        'error'   => $error
    ], JSON_UNESCAPED_UNICODE);
}
?>

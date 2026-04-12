-- ============================================================
-- MIGRATION: Thêm PRIMARY KEY và AUTO_INCREMENT cho restaurant
-- Ngày: April 12, 2026
-- ============================================================

-- 1. Thêm PRIMARY KEY nếu chưa có
ALTER TABLE `restaurant`
ADD PRIMARY KEY IF NOT EXISTS (`restaurant_id`);

-- 2. Thêm AUTO_INCREMENT cho restaurant_id
ALTER TABLE `restaurant`
MODIFY `restaurant_id` int(11) NOT NULL AUTO_INCREMENT;

-- 3. Thêm timestamp columns để track thay đổi
ALTER TABLE `restaurant`
ADD COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo gian hàng' AFTER `status`,
ADD COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật' AFTER `created_at`;

-- 4. Thêm index cho các trường tìm kiếm
ALTER TABLE `restaurant`
ADD INDEX idx_name (name),
ADD INDEX idx_status (status),
ADD INDEX idx_created_at (created_at);

-- 5. Kiểm tra user_restaurants table (nhiều-nhiều giữa user và restaurant)
-- Nếu chưa có, tạo mới
CREATE TABLE IF NOT EXISTS `user_restaurants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `added_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `added_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY unique_user_restaurant (user_id, restaurant_id),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Kiểm tra xem migration thành công
-- ============================================================
-- Sau khi chạy migration này, kiểm tra:
-- DESCRIBE restaurant;
-- SHOW CREATE TABLE restaurant\G
-- 
-- Nên thấy:
-- - restaurant_id: int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY
-- - created_at: timestamp
-- - updated_at: timestamp
-- - Các index trên name, status, created_at

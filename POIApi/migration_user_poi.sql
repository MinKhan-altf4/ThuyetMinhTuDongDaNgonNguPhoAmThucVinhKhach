-- ============================================
-- MIGRATION: Liên kết POI-User
-- Tạo ngày: 2026-04-12
-- ============================================

-- 1. Thêm cột is_active vào bảng users (để khóa/mở khóa user)
ALTER TABLE `users` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `created_at`;
ALTER TABLE `users` ADD KEY `idx_is_active` (`is_active`);

-- 2. Tạo bảng user_restaurants (many-to-many liên kết user - restaurant)
CREATE TABLE `user_restaurants` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `added_by` varchar(255) DEFAULT NULL COMMENT 'Email của admin/owner đã thêm',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  UNIQUE KEY `unique_user_restaurant` (`user_id`, `restaurant_id`),
  CONSTRAINT `fk_user_restaurants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_restaurants_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Migrate dữ liệu cũ: Chuyển restaurant_id từ users sang user_restaurants
-- (Giữ lại restaurant_id cũ trong users để backward compatible, nhưng sẽ ưu tiên dùng user_restaurants)
INSERT INTO `user_restaurants` (`user_id`, `restaurant_id`, `added_by`, `created_at`)
SELECT `user_id`, `restaurant_id`, 'migration', NOW()
FROM `users`
WHERE `restaurant_id` IS NOT NULL;

-- 4. Câu lệnh test: Xem user nào có POI nào
-- SELECT u.user_id, u.name, u.is_active, GROUP_CONCAT(r.name SEPARATOR ', ') as restaurants
-- FROM users u
-- LEFT JOIN user_restaurants ur ON ur.user_id = u.user_id
-- LEFT JOIN restaurant r ON r.restaurant_id = ur.restaurant_id
-- GROUP BY u.user_id;

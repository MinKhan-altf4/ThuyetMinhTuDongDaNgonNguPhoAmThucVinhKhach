-- ============================================================
-- DATABASE MIGRATION: Restaurant Management
-- Chuẩn bị database để hoạt động với code mới
-- ============================================================

-- ======================================
-- 1. SỬA BẢNG restaurant
-- ======================================

-- Bước 1: Thêm AUTO_INCREMENT
ALTER TABLE `restaurant` 
MODIFY `restaurant_id` int(11) NOT NULL AUTO_INCREMENT;

-- Bước 2: Thêm indexes để tối ưu query search
ALTER TABLE `restaurant`
ADD INDEX IF NOT EXISTS `idx_name` (`name`),
ADD INDEX IF NOT EXISTS `idx_status` (`status`),
ADD INDEX IF NOT EXISTS `idx_created_at` (`created_at`);

-- ======================================
-- 2. KIỂM TRA CẤU TRÚC BẢNG users
-- ======================================
-- Đảm bảo bảng users có PRIMARY KEY
ALTER TABLE `users` 
ADD PRIMARY KEY IF NOT EXISTS (`user_id`);

-- ======================================
-- 3. TẠOBẢNG user_restaurants (nếu chưa có)
-- ======================================
-- Xóa Foreign Key constraints cũ nếu có
ALTER TABLE `user_restaurants` DROP FOREIGN KEY IF EXISTS `fk_user_restaurants_user`;
ALTER TABLE `user_restaurants` DROP FOREIGN KEY IF EXISTS `fk_user_restaurants_restaurant`;

-- Xóa bảng cũ nếu có
DROP TABLE IF EXISTS `user_restaurants`;

-- Tạo bảng mới
CREATE TABLE `user_restaurants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `added_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_restaurant` (`user_id`, `restaurant_id`),
  KEY `fk_user` (`user_id`),
  KEY `fk_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_user_restaurants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_restaurants_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- DONE: Chạy xong các lệnh trên là OK
-- ======================================

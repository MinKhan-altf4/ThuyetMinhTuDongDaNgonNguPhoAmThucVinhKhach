-- Migration: Create customer_visited table for analytics
-- Bảng theo dõi lượt xem và lượt nghe của khách hàng

CREATE TABLE IF NOT EXISTS `customer_visited` (
  `visit_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `visit_count` int(11) DEFAULT 1 COMMENT 'Số lần xem POI',
  `audio_listen_count` int(11) DEFAULT 0 COMMENT 'Số lần nghe audio',
  `last_visited` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Lần truy cập gần nhất',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo bản ghi',
  PRIMARY KEY (`visit_id`),
  UNIQUE KEY `unique_customer_restaurant` (`customer_id`, `restaurant_id`),
  KEY `idx_restaurant_id` (`restaurant_id`),
  KEY `idx_last_visited` (`last_visited`),
  KEY `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS `idx_visits_restaurant` ON `customer_visited` (`restaurant_id`);
CREATE INDEX IF NOT EXISTS `idx_visits_customer` ON `customer_visited` (`customer_id`);

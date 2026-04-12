-- Bảng ghi lại lượt truy cập của khách hàng
CREATE TABLE IF NOT EXISTS customer_visited (
  visit_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  visit_count INT DEFAULT 1,
  audio_listen_count INT DEFAULT 0,
  last_visited DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_customer_restaurant (customer_id, restaurant_id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE,
  INDEX idx_restaurant (restaurant_id),
  INDEX idx_customer (customer_id),
  INDEX idx_last_visited (last_visited)
);

-- Nếu đã tồn tại, chỉ thêm cột nếu thiếu
ALTER TABLE customer_visited ADD COLUMN IF NOT EXISTS visit_count INT DEFAULT 1;
ALTER TABLE customer_visited ADD COLUMN IF NOT EXISTS audio_listen_count INT DEFAULT 0;
ALTER TABLE customer_visited ADD COLUMN IF NOT EXISTS last_visited DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- =====================================================
-- SQL tạo Database POI cho XAMPP
-- Chạy file này trong phpMyAdmin
-- =====================================================

CREATE DATABASE IF NOT EXISTS poi_demo;
USE poi_demo;

-- =====================================================
-- Bảng POI - Lưu trữ địa điểm thuyết minh
-- =====================================================
CREATE TABLE IF NOT EXISTS pois (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Dữ liệu mẫu - 3 địa điểm tại TP.HCM
-- =====================================================
INSERT INTO pois (name, description, latitude, longitude) VALUES
('Nhà thờ Đức Bà', 'Nhà thờ Đức Bà là một nhà thờ Công giáo nằm trong khu vực quy hoạch của Tòa Đô chính Thành phố Hồ Chí Minh, ngay trung tâm thành phố. Đây là một trong những công trình kiến trúc nổi bật của Thành phố Hồ Chí Minh.', 10.7798, 106.6980),
('Dinh Độc Lập', 'Dinh Độc Lập là trụ sở của Tổng thống Chính phủ Việt Nam Cộng hòa trước năm 1975. Dinh được xây dựng trên một diện tích 12 héc ta, ngay trung tâm thành phố Hồ Chí Minh.', 10.7731, 106.6955),
('Bưu điện Trung tâm TP.HCM', 'Bưu điện Trung tâm Thành phố Hồ Chí Minh là một công trình kiến trúc Pháp nằm tại số 2, đường Công xã Paris, Quận 1. Đây là một trong những bưu điện lớn nhất của Việt Nam.', 10.7800, 106.6995);

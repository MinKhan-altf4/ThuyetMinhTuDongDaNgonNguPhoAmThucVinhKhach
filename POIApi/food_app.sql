-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th4 05, 2026 lúc 10:15 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `food_app`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `audio`
--

CREATE TABLE `audio` (
  `audio_id` int(11) NOT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `language_id` int(11) DEFAULT NULL,
  `audio_url` varchar(255) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `version` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `audio`
--

INSERT INTO `audio` (`audio_id`, `restaurant_id`, `language_id`, `audio_url`, `duration`, `version`, `is_active`, `last_updated`) VALUES
(1, 1, 1, 'audio/vi/poi_1.mp3', 38, 1, 1, '2026-04-05 15:55:47'),
(2, 1, 2, 'audio/en/poi_1.mp3', 35, 1, 1, '2026-04-05 15:55:47'),
(3, 1, 3, 'audio/zh/poi_1.mp3', 40, 1, 1, '2026-04-05 15:55:47'),
(4, 1, 4, 'audio/jp/poi_1.mp3', 42, 1, 1, '2026-04-05 15:55:47'),
(5, 1, 5, 'audio/kr/poi_1.mp3', 39, 1, 1, '2026-04-05 15:55:47'),
(6, 2, 1, 'audio/vi/poi_2.mp3', 45, 1, 1, '2026-04-05 15:55:47'),
(7, 2, 2, 'audio/en/poi_2.mp3', 42, 1, 1, '2026-04-05 15:55:47'),
(8, 2, 3, 'audio/zh/poi_2.mp3', 48, 1, 1, '2026-04-05 15:55:47'),
(9, 2, 4, 'audio/jp/poi_2.mp3', 50, 1, 1, '2026-04-05 15:55:47'),
(10, 2, 5, 'audio/kr/poi_2.mp3', 46, 1, 1, '2026-04-05 15:55:47'),
(11, 3, 1, 'audio/vi/poi_3.mp3', 42, 1, 1, '2026-04-05 15:55:47'),
(12, 3, 2, 'audio/en/poi_3.mp3', 39, 1, 1, '2026-04-05 15:55:47'),
(13, 3, 3, 'audio/zh/poi_3.mp3', 45, 1, 1, '2026-04-05 15:55:47'),
(14, 3, 4, 'audio/jp/poi_3.mp3', 47, 1, 1, '2026-04-05 15:55:47'),
(15, 3, 5, 'audio/kr/poi_3.mp3', 43, 1, 1, '2026-04-05 15:55:47'),
(16, 4, 1, 'audio/vi/poi_4.mp3', 48, 1, 1, '2026-04-05 15:55:47'),
(17, 4, 2, 'audio/en/poi_4.mp3', 44, 1, 1, '2026-04-05 15:55:47'),
(18, 4, 3, 'audio/zh/poi_4.mp3', 52, 1, 1, '2026-04-05 15:55:47'),
(19, 4, 4, 'audio/jp/poi_4.mp3', 54, 1, 1, '2026-04-05 15:55:47'),
(20, 4, 5, 'audio/kr/poi_4.mp3', 49, 1, 1, '2026-04-05 15:55:47'),
(21, 5, 1, 'audio/vi/poi_5.mp3', 35, 1, 1, '2026-04-05 15:55:47'),
(22, 5, 2, 'audio/en/poi_5.mp3', 32, 1, 1, '2026-04-05 15:55:47'),
(23, 5, 3, 'audio/zh/poi_5.mp3', 38, 1, 1, '2026-04-05 15:55:47'),
(24, 5, 4, 'audio/jp/poi_5.mp3', 40, 1, 1, '2026-04-05 15:55:47'),
(25, 5, 5, 'audio/kr/poi_5.mp3', 36, 1, 1, '2026-04-05 15:55:47'),
(26, 6, 1, 'audio/vi/poi_6.mp3', 40, 1, 1, '2026-04-05 15:55:47'),
(27, 6, 2, 'audio/en/poi_6.mp3', 37, 1, 1, '2026-04-05 15:55:47'),
(28, 6, 3, 'audio/zh/poi_6.mp3', 43, 1, 1, '2026-04-05 15:55:47'),
(29, 6, 4, 'audio/jp/poi_6.mp3', 45, 1, 1, '2026-04-05 15:55:47'),
(30, 6, 5, 'audio/kr/poi_6.mp3', 41, 1, 1, '2026-04-05 15:55:47'),
(31, 7, 1, 'audio/vi/poi_7.mp3', 44, 1, 1, '2026-04-05 15:55:47'),
(32, 7, 2, 'audio/en/poi_7.mp3', 41, 1, 1, '2026-04-05 15:55:47'),
(33, 7, 3, 'audio/zh/poi_7.mp3', 47, 1, 1, '2026-04-05 15:55:47'),
(34, 7, 4, 'audio/jp/poi_7.mp3', 49, 1, 1, '2026-04-05 15:55:47'),
(35, 7, 5, 'audio/kr/poi_7.mp3', 45, 1, 1, '2026-04-05 15:55:47'),
(36, 8, 1, 'audio/vi/poi_8.mp3', 36, 1, 1, '2026-04-05 15:55:47'),
(37, 8, 2, 'audio/en/poi_8.mp3', 33, 1, 1, '2026-04-05 15:55:47'),
(38, 8, 3, 'audio/zh/poi_8.mp3', 39, 1, 1, '2026-04-05 15:55:47'),
(39, 8, 4, 'audio/jp/poi_8.mp3', 41, 1, 1, '2026-04-05 15:55:47'),
(40, 8, 5, 'audio/kr/poi_8.mp3', 37, 1, 1, '2026-04-05 15:55:47'),
(41, 9, 1, 'audio/vi/poi_9.mp3', 38, 1, 1, '2026-04-05 15:55:47'),
(42, 9, 2, 'audio/en/poi_9.mp3', 35, 1, 1, '2026-04-05 15:55:47'),
(43, 9, 3, 'audio/zh/poi_9.mp3', 41, 1, 1, '2026-04-05 15:55:47'),
(44, 9, 4, 'audio/jp/poi_9.mp3', 43, 1, 1, '2026-04-05 15:55:47'),
(45, 9, 5, 'audio/kr/poi_9.mp3', 39, 1, 1, '2026-04-05 15:55:47'),
(46, 10, 1, 'audio/vi/poi_10.mp3', 50, 1, 1, '2026-04-05 15:55:47'),
(47, 10, 2, 'audio/en/poi_10.mp3', 46, 1, 1, '2026-04-05 15:55:47'),
(48, 10, 3, 'audio/zh/poi_10.mp3', 54, 1, 1, '2026-04-05 15:55:47'),
(49, 10, 4, 'audio/jp/poi_10.mp3', 56, 1, 1, '2026-04-05 15:55:47'),
(50, 10, 5, 'audio/kr/poi_10.mp3', 51, 1, 1, '2026-04-05 15:55:47'),
(51, 11, 1, 'audio/vi/poi_11.mp3', 40, 1, 1, '2026-04-05 15:55:47'),
(52, 11, 2, 'audio/en/poi_11.mp3', 37, 1, 1, '2026-04-05 15:55:47'),
(53, 11, 3, 'audio/zh/poi_11.mp3', 43, 1, 1, '2026-04-05 15:55:47'),
(54, 11, 4, 'audio/jp/poi_11.mp3', 45, 1, 1, '2026-04-05 15:55:47'),
(55, 11, 5, 'audio/kr/poi_11.mp3', 41, 1, 1, '2026-04-05 15:55:47'),
(56, 12, 1, 'audio/vi/poi_12.mp3', 42, 1, 1, '2026-04-05 15:55:47'),
(57, 12, 2, 'audio/en/poi_12.mp3', 39, 1, 1, '2026-04-05 15:55:47'),
(58, 12, 3, 'audio/zh/poi_12.mp3', 45, 1, 1, '2026-04-05 15:55:47'),
(59, 12, 4, 'audio/jp/poi_12.mp3', 47, 1, 1, '2026-04-05 15:55:47'),
(60, 12, 5, 'audio/kr/poi_12.mp3', 43, 1, 1, '2026-04-05 15:55:47'),
(61, 13, 1, 'audio/vi/poi_13.mp3', 30, 1, 1, '2026-04-05 15:55:47'),
(62, 13, 2, 'audio/en/poi_13.mp3', 27, 1, 1, '2026-04-05 15:55:47'),
(63, 13, 3, 'audio/zh/poi_13.mp3', 33, 1, 1, '2026-04-05 15:55:47'),
(64, 13, 4, 'audio/jp/poi_13.mp3', 35, 1, 1, '2026-04-05 15:55:47'),
(65, 13, 5, 'audio/kr/poi_13.mp3', 31, 1, 1, '2026-04-05 15:55:47'),
(66, 14, 1, 'audio/vi/poi_14.mp3', 32, 1, 1, '2026-04-05 15:55:47'),
(67, 14, 2, 'audio/en/poi_14.mp3', 29, 1, 1, '2026-04-05 15:55:47'),
(68, 14, 3, 'audio/zh/poi_14.mp3', 35, 1, 1, '2026-04-05 15:55:47'),
(69, 14, 4, 'audio/jp/poi_14.mp3', 37, 1, 1, '2026-04-05 15:55:47'),
(70, 14, 5, 'audio/kr/poi_14.mp3', 33, 1, 1, '2026-04-05 15:55:47'),
(71, 15, 1, 'audio/vi/poi_15.mp3', 44, 1, 1, '2026-04-05 15:55:47'),
(72, 15, 2, 'audio/en/poi_15.mp3', 41, 1, 1, '2026-04-05 15:55:47'),
(73, 15, 3, 'audio/zh/poi_15.mp3', 47, 1, 1, '2026-04-05 15:55:47'),
(74, 15, 4, 'audio/jp/poi_15.mp3', 49, 1, 1, '2026-04-05 15:55:47'),
(75, 15, 5, 'audio/kr/poi_15.mp3', 45, 1, 1, '2026-04-05 15:55:47');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_visits`
--

CREATE TABLE `customer_visits` (
  `visit_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `visited_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IPv4 hoặc IPv6',
  `device_type` varchar(50) DEFAULT NULL COMMENT 'mobile / tablet / desktop',
  `language_code` varchar(10) DEFAULT NULL COMMENT 'Ngôn ngữ khách đang dùng (vi/en/zh/jp/kr)',
  `session_id` varchar(128) DEFAULT NULL COMMENT 'Session để nhận biết cùng 1 khách'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customer_visits`
--

INSERT INTO `customer_visits` (`visit_id`, `restaurant_id`, `visited_at`, `ip_address`, `device_type`, `language_code`, `session_id`) VALUES
(10, 1, '2026-04-05 03:00:00', '192.168.1.10', 'mobile', 'vi', 'sess_001'),
(11, 1, '2026-04-05 03:05:00', '192.168.1.11', 'desktop', 'en', 'sess_002'),
(12, 2, '2026-04-05 03:10:00', '192.168.1.12', 'mobile', 'vi', 'sess_003'),
(13, 3, '2026-04-05 03:15:00', '192.168.1.13', 'tablet', 'zh', 'sess_004'),
(14, 4, '2026-04-05 03:20:00', '192.168.1.14', 'mobile', 'vi', 'sess_005'),
(15, 6, '2026-04-05 04:00:00', '113.161.x.x', 'mobile', 'vi', 'sess_006'),
(16, 6, '2026-04-05 04:02:00', '113.161.x.y', 'mobile', 'vi', 'sess_007'),
(17, 9, '2026-04-05 05:00:00', '27.72.x.x', 'desktop', 'kr', 'sess_008'),
(18, 14, '2026-04-05 11:30:00', '14.226.x.z', 'mobile', 'vi', 'sess_009'),
(19, 15, '2026-04-05 12:00:00', '1.54.x.x', 'mobile', 'jp', 'sess_010');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `dish`
--

CREATE TABLE `dish` (
  `dish_id` int(11) NOT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `dish`
--

INSERT INTO `dish` (`dish_id`, `restaurant_id`, `name`, `description`, `price`, `image_url`, `is_active`) VALUES
(1, 1, 'Gà xé phay', 'Gà ta xé sợi nhỏ, trộn hành ngò, đậu phộng rang, nước mắm chua ngọt', 35000.00, 'https://example.com/img/ga-xe.jpg', 1),
(2, 1, 'Cá kho tộ', 'Cá lóc kho tộ với nước mắm, đường, tiêu, ớt, mỡ hành', 55000.00, 'https://example.com/img/ca-kho.jpg', 1),
(3, 1, 'Rau muống xào tỏi', 'Rau muống xanh giòn, xào tỏi bẹ, mắm mặn', 25000.00, 'https://example.com/img/rau-muong-xao.jpg', 1),
(4, 2, 'Bún mọc đặc biệt', 'Bún tươi + mọc viên + giò heo + trứng + hành phi', 40000.00, 'https://example.com/img/bun-moc-db.jpg', 1),
(5, 2, 'Bún mọc chả', 'Bún + mọc viên + chả bông + nước dùng ngọt thanh', 35000.00, 'https://example.com/img/bun-moc-cha.jpg', 1),
(6, 2, 'Bún mọc giò', 'Bún + giò heo + mọc + nước dùng xương 6 giờ', 38000.00, 'https://example.com/img/bun-moc-gio.jpg', 1),
(7, 3, 'Cháo lòng đặc biệt', 'Cháo trắng + lòng heo + dồi + nước mỡ hành', 30000.00, 'https://example.com/img/chao-long-db.jpg', 1),
(8, 3, 'Cháo lòng thường', 'Cháo + lòng + nước dùng ngọt thanh', 25000.00, 'https://example.com/img/chao-long.jpg', 1),
(9, 3, 'Cháo lòng + bánh da heo', 'Combo cháo lòng kèm bánh da heo giòn dai', 38000.00, 'https://example.com/img/chao-long-banhda.jpg', 1),
(10, 4, 'Bánh canh cua đặc biệt', 'Sợi bánh canh to + cua đồng + chả + trứng + hành phi', 45000.00, 'https://example.com/img/banh-canh-cua-db.jpg', 1),
(11, 4, 'Bánh canh cua xương', 'Bánh canh + cua + xương heo nấu nước dùng', 40000.00, 'https://example.com/img/banh-canh-cua-xuong.jpg', 1),
(12, 4, 'Bánh canh giò heo', 'Bánh canh + giò heo + nước dùng đậm vị', 35000.00, 'https://example.com/img/banh-canh-gio.jpg', 1),
(13, 5, 'Cơm tấm sườn đặc biệt', 'Sườn nướng than + bì + chả bông + trứng chiên', 55000.00, 'https://example.com/img/com-tam-suon-db.jpg', 1),
(14, 5, 'Cơm tấm sườn thường', 'Sườn nướng + cơm tấm + nước mắm', 45000.00, 'https://example.com/img/com-tam-suon.jpg', 1),
(15, 5, 'Cơm tấm cá kho', 'Cá kho tộ + cơm tấm + đồ chua', 48000.00, 'https://example.com/img/com-tam-ca-kho.jpg', 1),
(16, 6, 'Mì cay level 1-2', 'Mì Cay Dong Nai + topping thịt bò + tôm + trứng', 50000.00, 'https://example.com/img/mi-cay-12.jpg', 1),
(17, 6, 'Mì cay level 3-4', 'Mì Cay Sa Tế + topping đầy đủ + mực', 65000.00, 'https://example.com/img/mi-cay-34.jpg', 1),
(18, 6, 'Mì cay level 5 (bà đầm)', 'Mì Cay 7 Màu + full topping + xúc xích', 80000.00, 'https://example.com/img/mi-cay-5.jpg', 1),
(19, 7, 'Bánh mì bít tết phô mai', 'Bánh mì + beefsteak Mỹ + phô mai + rau thơm + sốt', 55000.00, 'https://example.com/img/banh-mi-bit-tet-phomai.jpg', 1),
(20, 7, 'Bánh mì bít tết thường', 'Bánh mì + beefsteak + pate + rau thơm', 45000.00, 'https://example.com/img/banh-mi-bit-tet.jpg', 1),
(21, 7, 'Bánh mì bít tết đặc biệt', 'Bánh mì + 2 beefsteak + trứng + phô mai + xúc xích', 75000.00, 'https://example.com/img/banh-mi-bit-tet-db.jpg', 1),
(22, 8, 'Gỏi cuốn tôm thịt (3 cuốn)', 'Bánh tráng + tôm luộc + thịt heo luộc + rau thơm', 25000.00, 'https://example.com/img/goi-cuon-tom-thit.jpg', 1),
(23, 8, 'Gỏi cuốn đặc biệt (5 cuốn)', 'Gỏi cuốn đầy đủ + chả giò + đồ chua', 40000.00, 'https://example.com/img/goi-cuon-db.jpg', 1),
(24, 8, 'Chả giò chiên giòn', 'Chả giò tự làm chiên vàng giòn rụm', 30000.00, 'https://example.com/img/cha-gio.jpg', 1),
(25, 9, 'Cà phê sữa đá', 'Cà phê Phin rang xay pha sữa đặc, uống đá', 22000.00, 'https://example.com/img/ca-phe-sua-da.jpg', 1),
(26, 9, 'Cà phê trứng Hà Nội', 'Cà phê đen đánh với lòng đỏ trứng gà', 35000.00, 'https://example.com/img/ca-phe-trung.jpg', 1),
(27, 9, 'Sinh tố bơ Sài Gòn', 'Bơ sáp béo ngậy xay với sữa đặc và đá', 28000.00, 'https://example.com/img/sinh-to-bo.jpg', 1),
(28, 10, 'Lẩu cá kèo (cho 2 người)', 'Cá kèo tươi + nước me + rau + bún', 120000.00, 'https://example.com/img/lau-ca-keo-2.jpg', 1),
(29, 10, 'Lẩu cá kèo (cho 4 người)', 'Lẩu lớn + đầy topping + 4 bát cơm', 220000.00, 'https://example.com/img/lau-ca-keo-4.jpg', 1),
(30, 10, 'Cá kèo chiên giòn', 'Cá kèo tươi lăn bột chiên giòn rụm', 45000.00, 'https://example.com/img/ca-keo-chien.jpg', 1),
(31, 11, 'Bánh pía đậu xanh', 'Bánh pía nhân đậu xanh, vỏ bánh mềm xốp (4 cái)', 20000.00, 'https://example.com/img/banh-pia-dau-xanh.jpg', 1),
(32, 11, 'Bánh pía sầu riêng', 'Bánh pía nhân sầu riêng thơm nồng (4 cái)', 28000.00, 'https://example.com/img/banh-pia-sau-rieng.jpg', 1),
(33, 11, 'Bánh pía trứng muối', 'Bánh pía nhân trứng muối, lớp vỏ vàng giòn (4 cái)', 25000.00, 'https://example.com/img/banh-pia-trung-muoi.jpg', 1),
(34, 12, 'Hủ tiếu khô Sa Đéc', 'Sợi hủ tiếu khô + nước sốt huyết sauce + topping', 40000.00, 'https://example.com/img/hu-tieu-kho.jpg', 1),
(35, 12, 'Hủ tiếu nước Sa Đéc', 'Hủ tiếu + nước dùng ngọt đậm + tôm mực', 42000.00, 'https://example.com/img/hu-tieu-nuoc.jpg', 1),
(36, 12, 'Mì hoành thánh', 'Mì vàng + hoành thánh chiên giòn + nước dùng', 38000.00, 'https://example.com/img/mi-hoanh-thanh.jpg', 1),
(37, 13, 'Trứng chiên phô mai (1 đĩa)', 'Trứng gà + phô mai mozzarella + bột chiên giòn', 25000.00, 'https://example.com/img/trung-chien-phomai.jpg', 1),
(38, 13, 'Trứng chiên phô mai + xúc xích', 'Combo trứng + phô mai + xúc xích Đức', 35000.00, 'https://example.com/img/trung-chien-phomai-xuc-xich.jpg', 1),
(39, 13, 'Khoai tây chiên phô mai', 'Khoai tây lắc phô mai giòn rụm', 20000.00, 'https://example.com/img/khoai-tay-chien-phomai.jpg', 1),
(40, 14, 'Nước mía dừa đá', 'Mía ép + nước dừa tươi + đá', 18000.00, 'https://example.com/img/nuoc-mia-dua.jpg', 1),
(41, 14, 'Nước mía dừa trân châu', 'Combo đầy đủ + trân châu jelly', 25000.00, 'https://example.com/img/nuoc-mia-dua-tran-chau.jpg', 1),
(42, 14, 'Nước dừa cam ép', 'Dừa tươi + cam vắt ép', 22000.00, 'https://example.com/img/dua-cam-ep.jpg', 1),
(43, 15, 'Bún bò Huế đặc biệt', 'Giò heo + sả băm + măng chua + bún tươi', 50000.00, 'https://example.com/img/bun-bo-hue-db.jpg', 1),
(44, 15, 'Bún bò Huế chả cua', 'Bún + chả cua + thịt bò + măng', 48000.00, 'https://example.com/img/bun-bo-hue-cha-cua.jpg', 1),
(45, 15, 'Bún bò Huế mì', 'Kết hợp bún và mì với nước dùng đỏ au', 52000.00, 'https://example.com/img/bun-bo-hue-mi.jpg', 1),
(46, 1, 'QuanLyThuVien', 'ádadssđá', 20000.00, '', 1),
(47, 1, 'MinKhan', 'ádasdadsa', 15000.00, 'http://localhost/ThuyetMinhTuDongDaNgonNguPhoAmThucVinhKhach/web/owner/default-food.png', 1),
(48, 1, 'Chủ Ốc Phát', 'adsda', 12000.00, '', 1),
(49, 1, 'GhiChu', 'ádasda', 15000.00, '', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `languages`
--

CREATE TABLE `languages` (
  `language_id` int(11) NOT NULL,
  `language_code` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `languages`
--

INSERT INTO `languages` (`language_id`, `language_code`) VALUES
(2, 'en'),
(4, 'jp'),
(5, 'kr'),
(1, 'vi'),
(3, 'zh');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `restaurant`
--

CREATE TABLE `restaurant` (
  `restaurant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `open_hour` varchar(50) DEFAULT NULL,
  `close_hour` varchar(50) DEFAULT NULL,
  `rating` float DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `restaurant`
--

INSERT INTO `restaurant` (`restaurant_id`, `name`, `description`, `lat`, `lng`, `phone`, `address`, `open_hour`, `close_hour`, `rating`) VALUES
(1, 'Ốc Phát - Ốc Ngon Quận 4', 'Ốc Phát là quán ốc nổi tiếng tại đường Vĩnh Khánh, Quận 4. Quán nổi bật với các món ốc tươi sống được chế biến ngay tại bàn. Đặc biệt là ốc hấp sả thơm lừng, ốc mỡ hành giòn bùi, và ốc len xào dừa béo ngậy. Không gian quán rộng rãi, thoáng mát, phù hợp cho buổi họp mặt bạn bè cuối ngày.', 10.761955, 106.702091, '0901 234 567', '1 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '15:00', '23:30', 4.4),
(2, 'Quán Ốc Thảo Quận 4', 'Quán Ốc Thảo là điểm đến quen thuộc của tín đồ ẩm thực đường phố Sài Gòn. Thực đơn phong phú với hơn 15 loại ốc tươi mỗi ngày. Ốc hấp gừng thơm nồng, ốc xào củ chuối giòn sần, ốc nướng muối ớt đậm đà. Quán mở cửa từ chiều đến khuya, là địa chỉ lý tưởng cho những ai yêu thích hương vị mặn mà của ẩm thực ốc.', 10.761681, 106.702362, '0902 345 678', '2 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '15:00', '23:59', 4.3),
(3, 'Quán Ốc Vũ', 'Quán Ốc Vũ nằm trên tuyến đường Vĩnh Khánh sầm uất, chuyên phục vụ các món ốc tươi sống với hơn 20 loại khác nhau. Từ ốc hương rang me chua ngọt, đến ốc tỏi chiên giòn, hay ốc xào rau muống đậm đà. Vị ốc tươi ngon, nêm nếm vừa miệng, mang đậm hương vị ẩm thực Sài Gòn đậm chất miền Nam.', 10.761394, 106.702695, '0903 456 789', '3 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '15:00', '23:30', 4.5),
(4, 'Ốc Loan', 'Ốc Loan là quán ốc bình dân được lòng thực khách Sài Gòn bởi hương vị ốc tươi ngon và giá cả phải chăng. Quán có các món ốc hấp, ốc xào, ốc nướng với topping đa dạng. Ốc mỡ hành ở đây được khách hàng đặc biệt yêu thích bởi lớp mỡ hành thơm phức, ốc dai giòn sần sật. Không gian quán mát mẻ, phục vụ đến khuya.', 10.761225, 106.702629, '0904 567 890', '4 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '15:00', '23:30', 4.2),
(5, 'Ốc Hồng Nhung', 'Ốc Hồng Nhung là quán ốc nhỏ xinh trên đường Vĩnh Khánh, Quận 4. Quán nổi tiếng với các món ốc tươi được chế biến đa dạng: hấp, xào, nướng, hấp gừng. Ốc mỡ hành thơm lừng, ốc len xào dừa béo ngậy, ốc hấp sả cay nồng. Vị ốc tươi, chế biến cẩn thận, mang đến trải nghiệm ẩm thực ốc đường phố đích thực cho thực khách.', 10.761225, 106.702629, '0905 678 901', '5 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '15:00', '23:30', 4.3),
(6, 'Lẩu nướng Vĩnh Khánh', 'Lẩu nướng Vĩnh Khánh là điểm đến lý tưởng cho những ai đam mê buffet lẩu nướng. Quán cung cấp hơn 50 loại nguyên liệu tươi sống mỗi ngày, từ thịt bò Mỹ, hải sản đến rau củ tươi xanh. Không gian rộng rãi, bếp nướng than hoa rực rỡ, nồi lẩu sôi sùng sục. Phù hợp cho nhóm bạn và gia đình muốn tận hưởng bữa ăn thả ga.', 10.760939, 106.703049, '0906 789 012', '6 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '10:00', '23:00', 4.6),
(7, 'Bún Thịt Nướng Cô Nga', 'Bún Thịt Nướng Cô Nga là quán bún thịt nướng nổi tiếng tại Vĩnh Khánh, Quận 4. Thịt heo nướng than hoa thơm lừng, bì giòn sần, nước mắm pha chuẩn vị miền Nam. Ăn kèm rau sống tươi xanh và đồ chua dưa hấu thanh mát. Quán nhỏ nhưng luôn đông khách, phục vụ bữa sáng và bữa trưa với giá cả hợp lý.', 10.760789, 106.706805, '0907 890 123', '7 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '06:00', '14:00', 4.5),
(8, 'Nhân Vip Coffee', 'Nhân Vip Coffee là quán cà phê hiện đại nằm trên đường Vĩnh Khánh, Quận 4. Không gian quán được thiết kế trẻ trung, thoáng mát, phù hợp để họp nhóm hay làm việc. Đồ uống đa dạng từ cà phê truyền thống Sài Gòn đến các loại trà và sinh tố hiện đại. Cà phê sữa đá đặc sánh, trà đá mát lạnh, phục vụ từ sáng sớm đến tối muộn.', 10.760672, 106.704456, '0908 901 234', '8 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '07:00', '22:30', 4.1),
(9, 'RONG Buffet', 'RONG Buffet là điểm đến buffet hấp dẫn tại Vĩnh Khánh, Quận 4. Thực đơn buffet phong phú với hơn 30 món từ hải sản tươi sống đến thịt nướng, rau xanh và đồ chiên giòn. Đặc biệt có các món ốc hấp, ốc nướng và lẩu hải sản. Không gian quán rộng rãi, phục vụ cả ngày. Combo buffet cho 2 đến 4 người với giá cực kỳ hợp lý.', 10.760717, 106.704603, '0909 012 345', '9 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '10:00', '22:00', 4.4),
(10, 'Link Coffee & Tea', 'Link Coffee & Tea là quán trà sữa và cà phê mang phong cách trẻ trung tại Vĩnh Khánh, Quận 4. Thực đơn đa dạng với trà sữa các loại, cà phê, đá xay và nước ép hoa quả. Không gian quán được trang trí xinh xắn, là điểm hẹn lý tưởng cho giới trẻ. Phục vụ từ sáng sớm đến tối muộn, thích hợp cho buổi họp nhóm hay thư giãn cuối ngày.', 10.760889, 106.704928, '0910 123 456', '10 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '07:00', '22:30', 4),
(11, 'Ốc Đào 2', 'Ốc Đào 2 là quán ốc chuyên nghiệp tại Vĩnh Khánh, Quận 4, được nhiều thực khách yêu thích. Ốc đào hấp sả thơm nồng, ốc hương rang me chua ngọt đậm đà, ốc len xào dừa béo ngậy. Nguyên liệu ốc tươi được chọn kỹ lưỡng mỗi ngày. Không gian mát mẻ, giá cả phải chăng, phục vụ từ chiều đến khuya.', 10.761171, 106.704948, '0911 234 567', '11 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '15:00', '23:30', 4.6),
(12, 'Quán ăn A Hiền', 'Quán ăn A Hiền là quán bình dân tọa lạc trên đường Vĩnh Khánh, Quận 4. Quán phục vụ các món ăn đa dạng từ cơm tấm, bún thịt nướng đến mì xào. Thực đơn thay đổi theo ngày với các món nóng hổi vừa ra lò. Giá cả bình dân, phần ăn no nê, phục vụ từ sáng sớm đến tối muộn. Là địa điểm quen thuộc của dân văn phòng và cư dân khu vực.', 10.761209, 106.705168, '0912 345 678', '12 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '06:00', '21:00', 4.2),
(13, 'Ớt Xiêm Quán', 'Ớt Xiêm Quán là điểm đến cho những ai đam mê vị cay tại Vĩnh Khánh, Quận 4. Chuyên các món ăn cay đặc trưng miền Nam: bún mắm cay nồng, mì cay từ 1 đến 5 sao, lẩu tokbaytomyum chua cay. Độ cay có thể điều chỉnh từ nhẹ đến cực cay. Không gian quán rộng rãi, phục vụ đến khuya, phù hợp cho nhóm bạn thích thử thách độ cay.', 10.761159, 106.705698, '0913 456 789', '13 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '09:00', '23:00', 4.5),
(14, 'Lẩu gà lá é Con Gà Trống', 'Lẩu gà lá é Con Gà Trống là quán chuyên lẩu gà nổi tiếng tại Vĩnh Khánh, Quận 4. Lẩu gà lá é thơm ngon với nước dùng ngọt thanh từ xương gà hầm nhiều giờ, thịt gà mềm ngọt, rau muống, nấm và mì. Đây là món ăn giải nhiệt tuyệt vời trong tiết trời oi ả Sài Gòn. Ngoài ra còn có gà nướng than hoa thơm lừng và gà xào sả ớt đậm đà.', 10.760856, 106.706721, '0914 567 890', '14 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '10:00', '22:00', 4.7),
(15, 'Quán ốc Bụi', 'Quán ốc Bụi là quán ốc bình dân nằm trên đường Vĩnh Khánh, Quận 4. Quán nổi tiếng với các món ốc đa dạng: ốc hấp, ốc nướng, ốc mỡ hành, ốc hấp sả. Vị ốc tươi ngon, chế biến nhanh, giá cả rất phải chăng. Không gian ngoài trời mát mẻ, phù hợp cho những buổi tụ họp bạn bè nhâm nhi ly bia mát lạnh cùng đĩa ốc thơm lừng.', 10.760601, 106.703934, '0915 678 901', '15 Đ. Vĩnh Khánh, Phường 8, Quận 4, TP.HCM, Việt Nam', '15:00', '23:30', 4.3);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `restaurant_image`
--

CREATE TABLE `restaurant_image` (
  `image_id` int(11) NOT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `restaurant_image`
--

INSERT INTO `restaurant_image` (`image_id`, `restaurant_id`, `image_url`, `is_primary`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800', 1),
(2, 2, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 1),
(3, 3, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', 1),
(4, 4, 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=800', 1),
(5, 5, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 1),
(6, 6, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800', 1),
(7, 7, 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800', 1),
(8, 8, 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800', 1),
(9, 9, 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800', 1),
(10, 10, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800', 1),
(11, 11, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800', 1),
(12, 12, 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=800', 1),
(13, 13, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', 1),
(14, 14, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', 1),
(15, 15, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `phone`, `restaurant_id`, `password_hash`, `created_at`) VALUES
(1, 'Chủ Ốc Phát', 'owner1@food.vn', '0901 234 570', 1, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(2, 'Chủ Quán Ốc Thảo', 'owner2@food.vn', '0902 345 678', 2, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(3, 'Chủ Quán Ốc Vũ', 'owner3@food.vn', '0903 456 789', 3, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(4, 'Chủ Ốc Loan', 'owner4@food.vn', '0904 567 890', 4, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(5, 'Chủ Ốc Hồng Nhung', 'owner5@food.vn', '0905 678 901', 5, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(6, 'Chủ Lẩu nướng Vĩnh Khánh', 'owner6@food.vn', '0906 789 012', 6, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(7, 'Chủ Bún Thịt Nướng Cô Nga', 'owner7@food.vn', '0907 890 123', 7, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(8, 'Chủ Nhân Vip Coffee', 'owner8@food.vn', '0908 901 234', 8, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(9, 'Chủ RONG Buffet', 'owner9@food.vn', '0909 012 345', 9, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(10, 'Chủ Link Coffee & Tea', 'owner10@food.vn', '0910 123 456', 10, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(11, 'Chủ Ốc Đào 2', 'owner11@food.vn', '0911 234 567', 11, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(12, 'Chủ Quán ăn A Hiền', 'owner12@food.vn', '0912 345 678', 12, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(13, 'Chủ Ớt Xiêm Quán', 'owner13@food.vn', '0913 456 789', 13, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(14, 'Chủ Lẩu gà lá é Con Gà Trống', 'owner14@food.vn', '0914 567 890', 14, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46'),
(15, 'Chủ Quán ốc Bụi', 'owner15@food.vn', '0915 678 901', 15, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 15:57:46');

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `v_visit_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_visit_stats` (
`restaurant_id` int(11)
,`restaurant_name` varchar(255)
,`total_visits` bigint(21)
,`unique_visitors` bigint(21)
,`active_days` bigint(21)
,`last_visit` timestamp
,`mobile_visits` decimal(23,0)
,`desktop_visits` decimal(23,0)
);

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_visit_stats`
--
DROP TABLE IF EXISTS `v_visit_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_visit_stats`  AS SELECT `r`.`restaurant_id` AS `restaurant_id`, `r`.`name` AS `restaurant_name`, count(`cv`.`visit_id`) AS `total_visits`, count(distinct `cv`.`session_id`) AS `unique_visitors`, count(distinct cast(`cv`.`visited_at` as date)) AS `active_days`, max(`cv`.`visited_at`) AS `last_visit`, sum(`cv`.`device_type` = 'mobile') AS `mobile_visits`, sum(`cv`.`device_type` = 'desktop') AS `desktop_visits` FROM (`restaurant` `r` left join `customer_visits` `cv` on(`r`.`restaurant_id` = `cv`.`restaurant_id`)) GROUP BY `r`.`restaurant_id`, `r`.`name` ;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `audio`
--
ALTER TABLE `audio`
  ADD PRIMARY KEY (`audio_id`),
  ADD KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `language_id` (`language_id`);

--
-- Chỉ mục cho bảng `customer_visits`
--
ALTER TABLE `customer_visits`
  ADD PRIMARY KEY (`visit_id`),
  ADD KEY `idx_visits_restaurant` (`restaurant_id`),
  ADD KEY `idx_visits_time` (`visited_at`);

--
-- Chỉ mục cho bảng `dish`
--
ALTER TABLE `dish`
  ADD PRIMARY KEY (`dish_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Chỉ mục cho bảng `languages`
--
ALTER TABLE `languages`
  ADD PRIMARY KEY (`language_id`),
  ADD UNIQUE KEY `language_code` (`language_code`);

--
-- Chỉ mục cho bảng `restaurant`
--
ALTER TABLE `restaurant`
  ADD PRIMARY KEY (`restaurant_id`),
  ADD KEY `idx_restaurant_location` (`lat`,`lng`);

--
-- Chỉ mục cho bảng `restaurant_image`
--
ALTER TABLE `restaurant_image`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uq_users_restaurant` (`restaurant_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `audio`
--
ALTER TABLE `audio`
  MODIFY `audio_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT cho bảng `customer_visits`
--
ALTER TABLE `customer_visits`
  MODIFY `visit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT cho bảng `dish`
--
ALTER TABLE `dish`
  MODIFY `dish_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT cho bảng `languages`
--
ALTER TABLE `languages`
  MODIFY `language_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `restaurant`
--
ALTER TABLE `restaurant`
  MODIFY `restaurant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT cho bảng `restaurant_image`
--
ALTER TABLE `restaurant_image`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `audio`
--
ALTER TABLE `audio`
  ADD CONSTRAINT `audio_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audio_ibfk_2` FOREIGN KEY (`language_id`) REFERENCES `languages` (`language_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `customer_visits`
--
ALTER TABLE `customer_visits`
  ADD CONSTRAINT `fk_visits_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `dish`
--
ALTER TABLE `dish`
  ADD CONSTRAINT `dish_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `restaurant_image`
--
ALTER TABLE `restaurant_image`
  ADD CONSTRAINT `restaurant_image_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

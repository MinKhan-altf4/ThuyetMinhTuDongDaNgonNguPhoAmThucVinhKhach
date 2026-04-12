# 🍽️ Hệ Thống Quản Lý POI-User

## 📋 Tổng Quan

Hệ thống mới cho phép liên kết POI (restaurant) với từng user. Khi khóa user, tất cả POI của user đó sẽ ẩn khỏi app.

---

## 🗄️ Cơ Sở Dữ Liệu

### 1. Bảng `users` - Thêm cột `is_active`
```sql
ALTER TABLE `users` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;
```
- **is_active = 1**: User hoạt động (POI hiển thị)
- **is_active = 0**: User bị khóa (POI ẩn)

### 2. Bảng `user_restaurants` - Many-to-Many
```sql
CREATE TABLE `user_restaurants` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `added_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  UNIQUE KEY `unique_user_restaurant` (`user_id`, `restaurant_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`) ON DELETE CASCADE
);
```

### Migration từ cũ sang mới
Dữ liệu cũ trong `users.restaurant_id` đã được chuyển sang bảng `user_restaurants` tự động.

---

## 🌐 API Endpoints

### Owner/Admin API: `/POIApi/owner_api.php`

#### 1️⃣ **Thêm POI cho User**
```http
POST /POIApi/owner_api.php?action=add_poi_to_user
Content-Type: application/json

{
  "user_id": 1,
  "restaurant_id": 5,
  "admin_email": "admin@system.local"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "restaurant_id": 5,
    "message": "Thêm POI thành công"
  }
}
```

#### 2️⃣ **Xóa POI khỏi User**
```http
POST /POIApi/owner_api.php?action=remove_poi_from_user
Content-Type: application/json

{
  "user_id": 1,
  "restaurant_id": 5
}
```

#### 3️⃣ **Lấy danh sách POI của User**
```http
GET /POIApi/owner_api.php?action=user_pois&user_id=1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "name": "Chủ Ốc Phát",
      "email": "owner1@food.vn",
      "is_active": 1
    },
    "pois": [
      {
        "link_id": 1,
        "restaurant_id": 1,
        "name": "Ốc Phát",
        "address": "1 Đ. Vĩnh Khánh",
        "rating": 4.4,
        "status": "open",
        "added_at": "2026-04-12 10:30:00"
      }
    ],
    "total": 1
  }
}
```

#### 4️⃣ **Lấy danh sách POI có sẵn**
```http
GET /POIApi/owner_api.php?action=available_restaurants
```

#### 5️⃣ **Khóa/Mở khóa User**
```http
POST /POIApi/owner_api.php?action=toggle_user_status
Content-Type: application/json

{
  "user_id": 1,
  "is_active": 0      // 0 = khóa, 1 = mở khóa
}
```

---

## 🖥️ Giao Diện Web Admin

### Trang Quản Lý POI
đường dẫn: `http://localhost/web/owner/add_poi.html`

**Tính năng:**
- ✅ Chọn user từ dropdown
- ✅ Hiển thị thông tin user (email, trạng thái active/locked)
- ✅ Chọn POI từ danh sách có sẵn
- ✅ Thêm POI cho user (khi thêm thành công sẽ hiển thị)
- ✅ Xem danh sách POI của user
- ✅ Xóa POI khỏi user
- ✅ Khóa/Mở khóa user

---

## 📱 API Công Khai (Public)

### Mobile App API: `/POIApi/api.php`

#### Lấy danh sách POI (chỉ active user)
```http
GET /POIApi/api.php
GET /POIApi/api.php?action=restaurants
```

**Thay đổi:**
- Chỉ trả POI của user có `is_active = 1`
- Nếu user bị khóa, POI sẽ ẩn khỏi kết quả

---

## 🔄 Luồng Hoạt Động

```
Admin thêm POI cho User
    ↓
POST /owner_api.php?action=add_poi_to_user
    ↓
Insert vào bảng user_restaurants
    ↓
Frontend hiển thị thành công ✅
    ↓
App request POI
    ↓
GET /api.php (lọc chỉ user is_active=1)
    ↓
Nếu user bị khóa → POI ẩn
Nếu user active → POI hiển thị
```

---

## 🎯 Tính Năng Chính

### ✅ Liên kết POI với User
- 1 user có thể sở hữu nhiều POI
- 1 POI có thể được thêm cho nhiều user (nhưng không trùng lặp)

### 🔒 Khóa User
```sql
UPDATE users SET is_active = 0 WHERE user_id = 1;
```
→ Tất cả POI của user này sẽ ẩn khỏi app

### 🔓 Mở Khóa User
```sql
UPDATE users SET is_active = 1 WHERE user_id = 1;
```
→ POI của user sẽ hiển thị lại

### 📊 Kiểm Tra POI của User
```sql
SELECT u.user_id, u.name, u.is_active, r.name as restaurant_name
FROM users u
LEFT JOIN user_restaurants ur ON ur.user_id = u.user_id
LEFT JOIN restaurant r ON r.restaurant_id = ur.restaurant_id
WHERE u.user_id = 1;
```

---

## 📋 SQL Queries Hữu Ích

### Xem toàn bộ user-POI mapping
```sql
SELECT 
    u.user_id,
    u.name,
    u.is_active,
    GROUP_CONCAT(r.name SEPARATOR ', ') as restaurants,
    COUNT(ur.id) as total_pois
FROM users u
LEFT JOIN user_restaurants ur ON ur.user_id = u.user_id
LEFT JOIN restaurant r ON r.restaurant_id = ur.restaurant_id
GROUP BY u.user_id
ORDER BY u.name;
```

### Xem POI nào chưa được gán cho ai
```sql
SELECT r.restaurant_id, r.name
FROM restaurant r
LEFT JOIN user_restaurants ur ON ur.restaurant_id = r.restaurant_id
WHERE ur.id IS NULL
ORDER BY r.name;
```

### Xem user nào không có POI
```sql
SELECT u.user_id, u.name, u.email
FROM users u
LEFT JOIN user_restaurants ur ON ur.user_id = u.user_id
WHERE ur.id IS NULL;
```

---

## 🐛 Debug

### Kiểm tra bảng user_restaurants có dữ liệu không
```sql
SELECT * FROM user_restaurants LIMIT 10;
```

### Kiểm tra user status
```sql
SELECT user_id, name, email, is_active FROM users;
```

### Test API
```bash
# Lấy POI của user 1
curl "http://localhost/POIApi/owner_api.php?action=user_pois&user_id=1"

# Lấy danh sách restaurants
curl "http://localhost/POIApi/owner_api.php?action=available_restaurants"
```

---

## 📞 Support

Nếu có vấn đề:
1. Kiểm tra log MySQL: `D:\xampp\mysql\data\error.log`
2. Kiểm tra Apache log: `D:\xampp\apache\logs\error.log`
3. Kiểm tra response API: Mở browser DevTools (F12) → Network tab


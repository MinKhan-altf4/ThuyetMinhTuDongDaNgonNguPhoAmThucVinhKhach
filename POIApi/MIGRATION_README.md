# 📋 Hướng dẫn Chạy Migration cho Restaurant Management

## 🔧 Vấn đề hiện tại
Bảng `restaurant` thiếu:
- ❌ PRIMARY KEY
- ❌ AUTO_INCREMENT
- ❌ Timestamp tracking (created_at, updated_at)
- ❌ Indexes để tối ưu query

## ✅ Giải pháp

### **Option 1: Chạy qua phpMyAdmin (Dễ nhất)**

1. Mở **phpMyAdmin** → http://localhost/phpmyadmin
2. Chọn database `food_app`
3. Click tab **SQL**
4. Copy nội dung file `migration_restaurant_pk.sql`
5. Paste vào query editor
6. Click **Execute** (nút ▶)

### **Option 2: Chạy qua MySQL CLI**

```bash
cd D:\xampp\mysql\bin

# Chạy migration
mysql -u root -p food_app < "D:\xampp\htdocs\ThuyetMinhTuDongDaNgonNguPhoAmThucVinhKhach\POIApi\migration_restaurant_pk.sql"

# Hoặc:
mysql -u root

USE food_app;
SOURCE D:\xampp\htdocs\ThuyetMinhTuDongDaNgonNguPhoAmThucVinhKhach\POIApi\migration_restaurant_pk.sql
```

### **Option 3: Chạy qua PHP Command (Từ web server)**

Tạo file `run_migration.php` trong thư mục POIApi:

```php
<?php
$conn = new mysqli('localhost', 'root', '', 'food_app');
$sql = file_get_contents('migration_restaurant_pk.sql');
$statements = array_filter(explode(';', $sql));

foreach ($statements as $statement) {
    $statement = trim($statement);
    if (!empty($statement) && !preg_match('/^--/', $statement)) {
        if (!$conn->query($statement)) {
            echo "Error: " . $conn->error . "\n";
        }
    }
}

echo "Migration thành công!\n";
?>
```

Sau đó truy cập: http://localhost/ThuyetMinhTuDongDaNgonNguPhoAmThucVinhKhach/POIApi/run_migration.php

---

## 📋 Những thay đổi sẽ được áp dụng

### 1️⃣ **PRIMARY KEY & AUTO_INCREMENT**
```sql
ALTER TABLE restaurant ADD PRIMARY KEY (restaurant_id);
ALTER TABLE restaurant MODIFY restaurant_id int(11) NOT NULL AUTO_INCREMENT;
```
→ `restaurant_id` tự động tăng khi thêm record mới

### 2️⃣ **Timestamp Tracking**
- `created_at` - Ghi lại khi tạo gian hàng
- `updated_at` - Tự động cập nhật mỗi khi sửa

### 3️⃣ **Indexes để tối ưu**
- Index trên `name` → Tìm kiếm nhanh
- Index trên `status` → Filter theo trạng thái
- Index trên `created_at` → Sort theo ngày

### 4️⃣ **Bảng user_restaurants**
- Nếu chưa tồn tại, sẽ tạo bảng kết nối user-restaurant
- Hỗ trợ quan hệ nhiều-nhiều (một user có nhiều restaurants)
- Có foreign keys ràng buộc dữ liệu

---

## ✨ Kết quả sau migration

✅ INSERT/UPDATE/DELETE restaurant hoạt động bình thường  
✅ Tự động generate restaurant_id mới  
✅ Theo dõi thời gian tạo/sửa  
✅ Query nhanh hơn với indexes  
✅ Dữ liệu toàn vẹn với foreign keys  

---

## 🧪 Kiểm tra sau chạy migration

```sql
-- Xem cấu trúc bảng
DESCRIBE restaurant;

-- Hoặc xem chi tiết
SHOW CREATE TABLE restaurant\G

-- Kiểm tra data có còn không
SELECT COUNT(*) FROM restaurant;

-- Test INSERT mới
INSERT INTO restaurant (name, address, status) VALUES ('Test Restaurant', 'Test Address', 'open');
SELECT LAST_INSERT_ID();  -- Should return ID > 15
```

---

## 🚨 Chú ý
- Không mất dữ liệu hiện tại (15 restaurants)
- Nếu lỗi "PRIMARY KEY already exists", bỏ qua (đã có)
- Nếu lỗi tính compatibility, liên hệ admin

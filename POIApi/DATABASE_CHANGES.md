# 📊 Danh sách thay đổi Database cần thiết

## 🎯 Mục tiêu
Chuẩn bị database XAMPP để hoạt động với **Restaurant Management System** vừa tạo.

---

## 📋 Những gì cần thêm

### **Bảng: `restaurant`**

#### ✅ Cần thêm:
| Lệnh | Mục đích |
|------|---------|
| `PRIMARY KEY (restaurant_id)` | Khóa chính để đảm bảo tính duy nhất |
| `AUTO_INCREMENT` | Tự động tạo ID khi thêm record mới |
| `created_at timestamp` | Ghi lại khi nào tạo gian hàng |
| `updated_at timestamp` | Ghi lại khi nào sửa gian hàng |
| `INDEX (name)` | Tối ưu tìm kiếm theo tên |
| `INDEX (status)` | Tối ưu lọc theo trạng thái |
| `INDEX (created_at)` | Tối ưu sắp xếp theo ngày |

#### ❌ Không cần thêm/xóa:
- Các cột hiện tại vẫn giữ nguyên
- Dữ liệu 15 nhà hàng không bị mất

---

### **Bảng: `users`**

#### ✅ Cần kiểm tra:
| Yêu cầu | Kiểm tra |
|--------|---------|
| `PRIMARY KEY (user_id)` | Phải có |
| `FOREIGN KEY → restaurant` | Nên kết nối đến `restaurant(restaurant_id)` |

---

### **Bảng mới: `user_restaurants`** (Tạo nếu chưa có)

#### 📝 Cấu trúc:
```sql
CREATE TABLE user_restaurants (
  id                  INT(11) PRIMARY KEY AUTO_INCREMENT,
  user_id            INT(11) NOT NULL,
  restaurant_id      INT(11) NOT NULL,
  added_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, restaurant_id),  -- Một user không quản lý cùng restaurant 2 lần
  FOREIGN KEY(user_id) → users(user_id),
  FOREIGN KEY(restaurant_id) → restaurant(restaurant_id)
)
```

#### 🎯 Mục đích:
- Kết nối nhiều-nhiều giữa user và restaurant
- Một user có thể quản lý nhiều restaurant
- Một restaurant có thể có nhiều user quản lý

---

## 🚀 Cách thực hiện

### **Bước 1: Mở phpMyAdmin**
1. Truy cập: http://localhost/phpmyadmin
2. Chọn database `food_app`
3. Click tab **SQL**

### **Bước 2: Copy toàn bộ nội dung file**
```
📁 D:\xampp\htdocs\ThuyetMinhTuDongDaNgonNguPhoAmThucVinhKhach\POIApi\final_migration.sql
```

### **Bước 3: Paste vào phpMyAdmin**
```sql
-- Copy toàn bộ lệnh từ final_migration.sql vào đây
ALTER TABLE restaurant ADD PRIMARY KEY (restaurant_id);
ALTER TABLE restaurant MODIFY restaurant_id int(11) NOT NULL AUTO_INCREMENT;
-- ... (và các lệnh khác)
```

### **Bước 4: Nhấn Execute (nút ▶)**

✅ Xong! Database sẵn sàng

---

## ✨ Sau khi migration hoàn tất

### Kiểm tra thành công:
```sql
-- 1. Xem cấu trúc restaurant
DESCRIBE restaurant;

-- Kết quả mong đợi:
-- restaurant_id  | int(11)     | NO  | PRI | NULL    | auto_increment |
-- ... các cột khác ...
-- created_at     | timestamp   | NO  |     | CURRENT | 
-- updated_at     | timestamp   | NO  |     | CURRENT |

-- 2. Đếm nhà hàng
SELECT COUNT(*) FROM restaurant;
-- Kết quả: 15 (không mất data)

-- 3. Test thêm mới
INSERT INTO restaurant (name, address, status) VALUES ('Test', 'Test Address', 'open');
-- Kiểm tra: restaurant_id tự động tăng lên 16

-- 4. Kiểm tra user_restaurants
SELECT * FROM user_restaurants LIMIT 1;
-- Nếu trả về 0 rows = OK
```

---

## 🎯 Kết quả cuối cùng

| Tính năng | Trạng thái |
|-----------|-----------|
| ✅ Thêm gian hàng mới | Hoạt động |
| ✅ Sửa thông tin gian hàng | Hoạt động |
| ✅ Xóa gian hàng | Hoạt động |
| ✅ Tìm kiếm nhanh | Hoạt động |
| ✅ Lọc theo trạng thái | Hoạt động |
| ✅ Theo dõi thời gian tạo/sửa | Hoạt động |
| ✅ Dữ liệu toàn vẹn | Hoạt động |

---

## 📝 Tóm tắt

**Cần thêm vào database:**
1. PRIMARY KEY + AUTO_INCREMENT cho `restaurant`
2. Timestamp columns (`created_at`, `updated_at`)
3. Indexes (`name`, `status`, `created_at`)
4. Tạo bảng `user_restaurants` (nếu chưa)
5. Foreign Keys ràng buộc dữ liệu

**File SQL sẵn sàng:** `final_migration.sql`

**Thời gian:** ~1 phút  
**Rủi ro:** Không có (không mất data)

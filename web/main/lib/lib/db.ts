import mysql from 'mysql2/promise';

// Cấu hình kết nối khớp với XAMPP và file database.sql của bạn
export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Mặc định của XAMPP là root
  password: '',      // Mặc định của XAMPP là để trống
  database: 'food_app', // Tên DB bạn đã tạo trong phpMyAdmin
  port: 3306,        // Cổng bạn đã xử lý ở bước trước
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
import mysql from 'mysql2/promise';

// 1. Cấu hình các thông số kết nối
// Lưu ý: Trong thực tế nên dùng process.env để bảo mật
const dbConfig = {
  host: 'localhost',        // Địa chỉ server MySQL (thường là localhost)
  user: 'root',             // Tên người dùng MySQL (mặc định là root)
  password: '151225',             // Mật khẩu MySQL của bạn (để trống nếu dùng XAMPP mặc định)
  database: 'food_app',     // Tên database khớp với file database.sql đã chạy
  port: 3306,               // Cổng mặc định của MySQL
  waitForConnections: true,
  connectionLimit: 10,      // Số lượng kết nối tối đa trong hàng chờ
  queueLimit: 0,
};

// 2. Tạo một Pool kết nối
// Pool giúp tái sử dụng các kết nối đã có, tăng hiệu suất cho ứng dụng
export const pool = mysql.createPool(dbConfig);

// 3. Hàm tiện ích để thực thi các câu lệnh truy vấn (Query)
// Giúp bạn gọi nhanh ở các file API mà không cần lặp lại code
export async function executeQuery({ query, values }: { query: string; values?: any[] }) {
  try {
    const [results] = await pool.execute(query, values);
    return results;
  } catch (error: any) {
    console.error('Database Error:', error.message);
    throw new Error(error.message);
  }
}
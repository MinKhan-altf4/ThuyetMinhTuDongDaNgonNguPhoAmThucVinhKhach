import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
app.use(cors()); // Cho phép cổng 8080 gọi vào đây

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Để trống nếu dùng XAMPP mặc định
  database: 'food_app',
  port: 3306,
});

app.get('/api/stats', async (req, res) => {
  try {
    const [users] = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'admin'");
    const [restaurants] = await pool.query("SELECT COUNT(*) as total FROM restaurant");
    const [dishes] = await pool.query("SELECT COUNT(*) as total FROM dish");
    const [customers] = await pool.query("SELECT COUNT(*) as total FROM customers");
    res.json({
      stats: {
        owners: users[0].total,
        stores: restaurants[0].total,
        dishes: dishes[0].total,
        customers: customers[0].total,
        ordersToday: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Backend đang chạy tại http://localhost:3000'));
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express();
app.use(cors());
app.use(express.json()); // Để đọc body JSON từ frontend

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'food_app',
  port: 3306,
});

// ============================================================
// GET /api/stats
// ============================================================
app.get('/api/stats', async (req, res) => {
  try {
    const [users]       = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'admin'");
    const [restaurants] = await pool.query("SELECT COUNT(*) as total FROM restaurant");
    const [dishes]      = await pool.query("SELECT COUNT(*) as total FROM dish WHERE is_active = 1");

    res.json({
      stats: {
        owners:      users[0].total,
        stores:      restaurants[0].total,
        dishes:      dishes[0].total,
        ordersToday: 0
      },
      chartData: [
        { name: 'T2', revenue: 12 },
        { name: 'T3', revenue: 18 },
        { name: 'T4', revenue: 15 },
        { name: 'T5', revenue: 22 },
        { name: 'T6', revenue: 30 },
        { name: 'T7', revenue: 28 },
        { name: 'CN', revenue: 20 },
      ],
      activities: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/users — Lấy danh sách (chỉ role = admin)
// ============================================================
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, name, role, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/users — Thêm quản trị viên mới
// Body: { name, password }
// ============================================================
app.post('/api/users', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Thiếu tên hoặc mật khẩu' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, password_hash, role) VALUES (?, ?, 'admin')",
      [name, password_hash]
    );
    res.json({ user_id: result.insertId, name, role: 'admin' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DELETE /api/users/:id — Xóa người dùng
// ============================================================
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE user_id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Backend đang chạy tại http://localhost:3000'));

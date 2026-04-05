import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { UAParser } from 'ua-parser-js'; // SỬA LỖI IMPORT

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'food_app',
  port: 3306,
});

// ============================================================
// GET /api/stats — Dữ liệu tổng quan cho Dashboard
// ============================================================
app.get('/api/stats', async (req, res) => {
  try {
    const [users] = await pool.query("SELECT COUNT(*) as total FROM users");
    const [restaurants] = await pool.query("SELECT COUNT(*) as total FROM restaurant");
    const [dishes] = await pool.query("SELECT COUNT(*) as total FROM dish WHERE is_active = 1");

    res.json({
      stats: {
        owners: users[0].total,
        stores: restaurants[0].total,
        dishes: dishes[0].total,
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
// GET /api/users — Danh sách users cho trang StallOwners
// ============================================================
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, name, email, phone, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/users — Thêm user mới
// ============================================================
app.post('/api/users', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Thiếu tên hoặc mật khẩu' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, password_hash, email, phone) VALUES (?, ?, ?, ?)",
      [name, password_hash, email || null, phone || null]
    );
    res.json({ user_id: result.insertId, name, email, phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DELETE /api/users/:id — Xóa user
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

// ============================================================
// POST /api/visit — Ghi lượt truy cập
// ============================================================
app.post('/api/visit', async (req, res) => {
  const { restaurant_id, language_code, session_id } = req.body;

  if (!restaurant_id) {
    return res.status(400).json({ error: 'Thiếu restaurant_id' });
  }

  const ua = new UAParser(req.headers['user-agent']);
  const deviceType = ua.getDevice().type || 'desktop';
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
          || req.socket.remoteAddress
          || null;

  try {
    await pool.query(
      `INSERT INTO customer_visits
         (restaurant_id, ip_address, device_type, language_code, session_id)
       VALUES (?, ?, ?, ?, ?)`,
      [restaurant_id, ip, deviceType, language_code || null, session_id || null]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/visit/stats — Thống kê lượt truy cập
// ============================================================
app.get('/api/visit/stats', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM v_visit_stats ORDER BY total_visits DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/visit/stats/:restaurant_id — Thống kê 1 nhà hàng
// ============================================================
app.get('/api/visit/stats/:restaurant_id', async (req, res) => {
  const { restaurant_id } = req.params;
  try {
    const [[summary]] = await pool.query(
      "SELECT * FROM v_visit_stats WHERE restaurant_id = ?",
      [restaurant_id]
    );

    const [byDay] = await pool.query(
      `SELECT DATE(visited_at) AS date, COUNT(*) AS visits
       FROM customer_visits
       WHERE restaurant_id = ?
         AND visited_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(visited_at)
       ORDER BY date ASC`,
      [restaurant_id]
    );

    const [byLanguage] = await pool.query(
      `SELECT language_code, COUNT(*) AS visits
       FROM customer_visits
       WHERE restaurant_id = ?
       GROUP BY language_code
       ORDER BY visits DESC`,
      [restaurant_id]
    );

    res.json({ summary, byDay, byLanguage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ============================================================
// API UPLOAD HÌNH ẢNH (cần cài multer)
// ============================================================
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình upload hình ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// POST /api/owner/register - Đăng ký chủ gian hàng (có ảnh)
// ============================================================
app.post('/api/owner/register', upload.fields([
  { name: 'restaurant_image', maxCount: 1 },
  { name: 'avatar', maxCount: 1 }
]), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      // Thông tin user
      name, email, phone, password,
      // Thông tin nhà hàng
      restaurant_name, description, address, lat, lng,
      phone_restaurant, open_hour, close_hour
    } = req.body;
    
    // Validate
    if (!name || !password || !restaurant_name) {
      throw new Error('Thiếu thông tin bắt buộc');
    }
    
    // 1. Thêm nhà hàng
    const [restaurantResult] = await connection.query(
      `INSERT INTO restaurant (name, description, address, lat, lng, phone, open_hour, close_hour, rating) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [restaurant_name, description || null, address || null, lat || null, lng || null, 
       phone_restaurant || null, open_hour || null, close_hour || null]
    );
    
    const restaurant_id = restaurantResult.insertId;
    
    // 2. Lưu ảnh nhà hàng
    if (req.files['restaurant_image']) {
      const imageFile = req.files['restaurant_image'][0];
      const imageUrl = `/uploads/${imageFile.filename}`;
      await connection.query(
        `INSERT INTO restaurant_image (restaurant_id, image_url, is_primary) VALUES (?, ?, 1)`,
        [restaurant_id, imageUrl]
      );
    }
    
    // 3. Thêm user (chủ nhà hàng)
    const password_hash = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, phone, restaurant_id, password_hash) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email || null, phone || null, restaurant_id, password_hash]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      user_id: userResult.insertId,
      restaurant_id: restaurant_id,
      message: 'Đăng ký chủ gian hàng thành công!'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ============================================================
// PUT /api/owner/:id - Cập nhật chủ gian hàng (có ảnh)
// ============================================================
app.put('/api/owner/:id', upload.fields([
  { name: 'restaurant_image', maxCount: 1 },
  { name: 'avatar', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      name, email, phone,
      restaurant_name, description, address, lat, lng,
      phone_restaurant, open_hour, close_hour
    } = req.body;
    
    // 1. Lấy restaurant_id của user
    const [users] = await connection.query(
      "SELECT restaurant_id FROM users WHERE user_id = ?",
      [id]
    );
    
    if (users.length === 0) {
      throw new Error('Không tìm thấy user');
    }
    
    const restaurant_id = users[0].restaurant_id;
    
    // 2. Cập nhật nhà hàng
    if (restaurant_id) {
      await connection.query(
        `UPDATE restaurant SET 
          name = ?, description = ?, address = ?, lat = ?, lng = ?, 
          phone = ?, open_hour = ?, close_hour = ?
         WHERE restaurant_id = ?`,
        [restaurant_name, description, address, lat, lng, 
         phone_restaurant, open_hour, close_hour, restaurant_id]
      );
      
      // 3. Cập nhật ảnh nhà hàng (nếu có)
      if (req.files['restaurant_image']) {
        // Xóa ảnh cũ (tùy chọn)
        await connection.query(
          "DELETE FROM restaurant_image WHERE restaurant_id = ?",
          [restaurant_id]
        );
        
        const imageFile = req.files['restaurant_image'][0];
        const imageUrl = `/uploads/${imageFile.filename}`;
        await connection.query(
          `INSERT INTO restaurant_image (restaurant_id, image_url, is_primary) VALUES (?, ?, 1)`,
          [restaurant_id, imageUrl]
        );
      }
    }
    
    // 4. Cập nhật user
    await connection.query(
      `UPDATE users SET name = ?, email = ?, phone = ? WHERE user_id = ?`,
      [name, email || null, phone || null, id]
    );
    
    await connection.commit();
    res.json({ success: true, message: 'Cập nhật thành công!' });
    
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ============================================================
// GET /api/owner/:id - Lấy chi tiết chủ gian hàng
// ============================================================
app.get('/api/owner/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [users] = await pool.query(
      `SELECT u.*, r.*, 
        (SELECT image_url FROM restaurant_image WHERE restaurant_id = r.restaurant_id AND is_primary = 1 LIMIT 1) as restaurant_image
       FROM users u
       LEFT JOIN restaurant r ON u.restaurant_id = r.restaurant_id
       WHERE u.user_id = ?`,
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy' });
    }
    
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.listen(3000, () => console.log('Backend đang chạy tại http://localhost:3000'));
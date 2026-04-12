import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { UAParser } from 'ua-parser-js';

const app = express();
app.use(cors());
app.use(express.json());

// ── Database ────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: 'localhost', user: 'root', password: '',
  database: 'food_app', port: 3306,
});

// ── Upload ──────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    /jpeg|jpg|png|gif/.test(path.extname(file.originalname).toLowerCase()) && /jpeg|jpg|png|gif/.test(file.mimetype)
      ? cb(null, true) : cb(new Error('Chỉ chấp nhận file ảnh!'));
  },
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
});
app.use('/uploads', express.static(uploadDir));

// ── Helper ──────────────────────────────────────────────────────
// Transaction helper: tự động commit/rollback/release
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── Stats ───────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ total: owners }]] = await pool.query("SELECT COUNT(*) as total FROM users");
    const [[{ total: stores }]] = await pool.query("SELECT COUNT(*) as total FROM restaurant");
    const [[{ total: dishes }]] = await pool.query("SELECT COUNT(*) as total FROM dish WHERE is_active = 1");
    const [topRestaurants] = await pool.query(`
      SELECT r.name, r.rating, COUNT(d.dish_id) as dish_count
      FROM restaurant r
      LEFT JOIN dish d ON d.restaurant_id = r.restaurant_id AND d.is_active = 1
      GROUP BY r.restaurant_id, r.name, r.rating
      ORDER BY r.rating DESC LIMIT 5
    `);
    const [activities] = await pool.query(`
      SELECT name, restaurant_id, NOW() as created_at
      FROM restaurant ORDER BY restaurant_id DESC LIMIT 5
    `);
    res.json({ stats: { owners, stores, dishes, ordersToday: 0 }, topRestaurants, activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Users ───────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.user_id, u.name, u.email, u.phone, u.restaurant_id, u.created_at,
             r.name AS restaurant_name
      FROM users u
      LEFT JOIN restaurant r ON u.restaurant_id = r.restaurant_id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/deleted', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ud.deleted_id, ud.user_id, ud.name, ud.email, ud.phone,
             r.name as restaurant_name, ud.created_at, ud.deleted_at, ud.deleted_by
      FROM users_deleted ud
      LEFT JOIN restaurant r ON ud.restaurant_id = r.restaurant_id
      ORDER BY ud.deleted_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, phone, password, restaurant_id } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Thiếu tên hoặc mật khẩu' });
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, password_hash, email, phone, restaurant_id) VALUES (?, ?, ?, ?, ?)",
      [name, password_hash, email || null, phone || null, restaurant_id || null]
    );
    res.json({ user_id: result.insertId, name, email, phone, restaurant_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { name, email, phone, restaurant_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên' });
  try {
    const [result] = await pool.query(
      "UPDATE users SET name=?, email=?, phone=?, restaurant_id=? WHERE user_id=?",
      [name, email || null, phone || null, restaurant_id || null, req.params.id]
    );
    res.json({ success: true, message: 'Cập nhật thông tin thành công', affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete: backup → xóa
app.delete('/api/users/:id', async (req, res) => {
  try {
    await withTransaction(async (conn) => {
      const [[user]] = await conn.query("SELECT * FROM users WHERE user_id=?", [req.params.id]);
      if (!user) throw Object.assign(new Error('Không tìm thấy user'), { status: 404 });

      await conn.query(
        `INSERT INTO users_deleted (user_id, name, password_hash, email, phone, restaurant_id, created_at, deleted_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'admin')`,
        [user.user_id, user.name, user.password_hash, user.email || null,
         user.phone || null, user.restaurant_id || null, user.created_at]
      );
      await conn.query("DELETE FROM users WHERE user_id=?", [req.params.id]);
    });
    res.json({ success: true, message: 'Đã khóa tài khoản và backup dữ liệu' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Khôi phục từ backup
app.post('/api/users/restore/:id', async (req, res) => {
  try {
    await withTransaction(async (conn) => {
      const [[ud]] = await conn.query("SELECT * FROM users_deleted WHERE deleted_id=?", [req.params.id]);
      if (!ud) throw Object.assign(new Error('Không tìm thấy trong backup'), { status: 404 });

      await conn.query(
        `INSERT INTO users (user_id, name, password_hash, email, phone, restaurant_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ud.user_id, ud.name, ud.password_hash, ud.email, ud.phone, ud.restaurant_id, ud.created_at]
      );
      await conn.query("DELETE FROM users_deleted WHERE deleted_id=?", [req.params.id]);
    });
    res.json({ success: true, message: 'Khôi phục user thành công' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Restaurants ─────────────────────────────────────────────────
// Trả về owner_locked = true nếu chủ đang bị khóa (có trong users_deleted)
app.get('/api/restaurants', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*,
             COALESCE(u.name, ud.name) AS owner_name,
             (ud.user_id IS NOT NULL)  AS owner_locked,
             (SELECT COUNT(*) FROM dish d WHERE d.restaurant_id = r.restaurant_id) AS dish_count
      FROM restaurant r
      LEFT JOIN users         u  ON u.restaurant_id  = r.restaurant_id
      LEFT JOIN users_deleted ud ON ud.restaurant_id = r.restaurant_id AND u.user_id IS NULL
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Owner CRUD (có ảnh) ─────────────────────────────────────────
const ownerUpload = upload.fields([{ name: 'restaurant_image', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]);

app.post('/api/owner/register', ownerUpload, async (req, res) => {
  try {
    const { name, email, phone, password, restaurant_name, description,
            address, lat, lng, phone_restaurant, open_hour, close_hour } = req.body;
    if (!name || !password || !restaurant_name) throw new Error('Thiếu thông tin bắt buộc');

    const result = await withTransaction(async (conn) => {
      const [rRes] = await conn.query(
        `INSERT INTO restaurant (name, description, address, lat, lng, phone, open_hour, close_hour, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [restaurant_name, description || null, address || null, lat || null,
         lng || null, phone_restaurant || null, open_hour || null, close_hour || null]
      );
      const restaurant_id = rRes.insertId;

      if (req.files['restaurant_image']) {
        const url = `/uploads/${req.files['restaurant_image'][0].filename}`;
        await conn.query(
          "INSERT INTO restaurant_image (restaurant_id, image_url, is_primary) VALUES (?, ?, 1)",
          [restaurant_id, url]
        );
      }

      const password_hash = await bcrypt.hash(password, 10);
      const [uRes] = await conn.query(
        "INSERT INTO users (name, email, phone, restaurant_id, password_hash) VALUES (?, ?, ?, ?, ?)",
        [name, email || null, phone || null, restaurant_id, password_hash]
      );
      return { user_id: uRes.insertId, restaurant_id };
    });

    res.json({ success: true, ...result, message: 'Đăng ký chủ gian hàng thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/owner/:id', ownerUpload, async (req, res) => {
  try {
    await withTransaction(async (conn) => {
      const { name, email, phone, restaurant_name, description,
              address, lat, lng, phone_restaurant, open_hour, close_hour } = req.body;

      const [[user]] = await conn.query("SELECT restaurant_id FROM users WHERE user_id=?", [req.params.id]);
      if (!user) throw new Error('Không tìm thấy user');

      if (user.restaurant_id) {
        await conn.query(
          `UPDATE restaurant SET name=?, description=?, address=?, lat=?, lng=?, phone=?, open_hour=?, close_hour=?
           WHERE restaurant_id=?`,
          [restaurant_name, description, address, lat, lng, phone_restaurant, open_hour, close_hour, user.restaurant_id]
        );
        if (req.files['restaurant_image']) {
          await conn.query("DELETE FROM restaurant_image WHERE restaurant_id=?", [user.restaurant_id]);
          const url = `/uploads/${req.files['restaurant_image'][0].filename}`;
          await conn.query(
            "INSERT INTO restaurant_image (restaurant_id, image_url, is_primary) VALUES (?, ?, 1)",
            [user.restaurant_id, url]
          );
        }
      }
      await conn.query("UPDATE users SET name=?, email=?, phone=? WHERE user_id=?",
        [name, email || null, phone || null, req.params.id]);
    });
    res.json({ success: true, message: 'Cập nhật thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/owner/:id', async (req, res) => {
  try {
    const [[user]] = await pool.query(`
      SELECT u.*, r.*,
        (SELECT image_url FROM restaurant_image WHERE restaurant_id = r.restaurant_id AND is_primary = 1 LIMIT 1) AS restaurant_image
      FROM users u
      LEFT JOIN restaurant r ON u.restaurant_id = r.restaurant_id
      WHERE u.user_id = ?
    `, [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Visits ───────────────────────────────────────────────────────
app.post('/api/visit', async (req, res) => {
  const { restaurant_id, language_code, session_id } = req.body;
  if (!restaurant_id) return res.status(400).json({ error: 'Thiếu restaurant_id' });

  const ua = new UAParser(req.headers['user-agent']);
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || null;

  try {
    await pool.query(
      "INSERT INTO customer_visits (restaurant_id, ip_address, device_type, language_code, session_id) VALUES (?, ?, ?, ?, ?)",
      [restaurant_id, ip, ua.getDevice().type || 'desktop', language_code || null, session_id || null]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/visit/stats', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM v_visit_stats ORDER BY total_visits DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/visit/stats/:restaurant_id', async (req, res) => {
  const { restaurant_id } = req.params;
  try {
    const [[summary]] = await pool.query("SELECT * FROM v_visit_stats WHERE restaurant_id=?", [restaurant_id]);
    const [byDay] = await pool.query(`
      SELECT DATE(visited_at) AS date, COUNT(*) AS visits
      FROM customer_visits
      WHERE restaurant_id=? AND visited_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(visited_at) ORDER BY date ASC
    `, [restaurant_id]);
    const [byLanguage] = await pool.query(`
      SELECT language_code, COUNT(*) AS visits
      FROM customer_visits WHERE restaurant_id=?
      GROUP BY language_code ORDER BY visits DESC
    `, [restaurant_id]);

    res.json({ summary, byDay, byLanguage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────
app.listen(3000, () => console.log('Backend đang chạy tại http://localhost:3000'));
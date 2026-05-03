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
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    /\.up\.railway\.app$/, // cho phép tất cả subdomain Railway
  ]
}));
app.use(express.json());

// ── Database ────────────────────────────────────────────────────
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
};

const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
});

// ── Upload ──────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistDir = path.join(__dirname, 'dist');
const frontendIndexPath = path.join(frontendDistDir, 'index.html');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const offlineAudioRootCandidates = [
  path.join(__dirname, '..', '..', 'POIApp', 'Resources', 'Raw', 'audio'),
  path.join(__dirname, '..', 'Raw', 'audio'),
  path.join(__dirname, 'audio'), // fallback: ./audio/ cạnh server.js
];
// Dùng thư mục đầu tiên tồn tại, fallback về ./audio/
const offlineAudioRoot = offlineAudioRootCandidates.find((dir) => fs.existsSync(dir))
  ?? path.join(__dirname, 'audio');

// Tự tạo thư mục + các subdir ngôn ngữ để /offline-audio luôn hoạt động
if (!fs.existsSync(offlineAudioRoot)) {
  fs.mkdirSync(offlineAudioRoot, { recursive: true });
}
for (const lang of ['vi', 'en', 'zh', 'jp', 'kr']) {
  const langDir = path.join(offlineAudioRoot, lang);
  if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });
}
console.log(`[Audio] offlineAudioRoot = ${offlineAudioRoot}`);

const supportedAudioLanguages = ['vi', 'en', 'zh', 'jp', 'kr'];

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

const audioUpload = multer({
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    /mp3|wav|m4a|ogg/.test(path.extname(file.originalname).toLowerCase()) && /audio/.test(file.mimetype)
      ? cb(null, true) : cb(new Error('Chỉ chấp nhận file audio!'));
  },
  storage: multer.memoryStorage(),
});

app.use('/uploads', express.static(uploadDir));
// Luôn mount /offline-audio - thư mục đã được tạo tự động ở trên
app.use('/offline-audio', express.static(offlineAudioRoot));
if (fs.existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir));
}

app.get('/api/health', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    res.json({
      ok: true,
      database: 'connected',
      port: Number(process.env.PORT) || 3000,
      dbHost: dbConfig.host || null,
      dbName: dbConfig.database || null,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      database: 'disconnected',
      error: err.message,
      port: Number(process.env.PORT) || 3000,
      dbHost: dbConfig.host || null,
      dbName: dbConfig.database || null,
    });
  }
});

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

function normalizeLanguageCode(languageCode) {
  return String(languageCode || '').trim().toLowerCase();
}

function sanitizeAudioFileName(fileName) {
  return path.basename(String(fileName || '').trim());
}

function getOfflineAudioPath(languageCode, fileName) {
  return path.join(offlineAudioRoot, normalizeLanguageCode(languageCode), sanitizeAudioFileName(fileName));
}

function getOfflineAudioPathFromUrl(audioUrl) {
  const normalized = String(audioUrl || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length < 3 || parts[0] !== 'audio') return null;
  return getOfflineAudioPath(parts[1], parts.slice(2).join('/'));
}

async function deletePhysicalAudioIfUnused(audioUrl) {
  const audioPath = getOfflineAudioPathFromUrl(audioUrl);
  if (!audioPath || !fs.existsSync(audioPath)) return;

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM audio WHERE audio_url = ?', [audioUrl]);
  if (Number(total) === 0) {
    fs.unlinkSync(audioPath);
  }
}

function listOfflineAudioFilesByLanguage() {
  const result = {};

  for (const languageCode of supportedAudioLanguages) {
    const languageDir = path.join(offlineAudioRoot, languageCode);
    result[languageCode] = fs.existsSync(languageDir)
      ? fs.readdirSync(languageDir)
          .filter((fileName) => fileName.toLowerCase().endsWith('.mp3'))
          .sort((a, b) => a.localeCompare(b))
      : [];
  }

  return result;
}

function toOfflineAudioUrl(languageCode, fileName) {
  return `/offline-audio/${normalizeLanguageCode(languageCode)}/${encodeURIComponent(sanitizeAudioFileName(fileName))}`;
}

async function ensureOnlineSessionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_online_sessions (
      session_id VARCHAR(64) NOT NULL PRIMARY KEY,
      device_id VARCHAR(128) NOT NULL,
      device_type VARCHAR(255) NULL,
      app_version VARCHAR(50) NULL,
      language_code VARCHAR(20) NULL,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      INDEX idx_online_active_last_seen (is_active, last_seen),
      INDEX idx_online_device (device_id)
    )
  `);
}

// ── Stats ───────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ total: owners }]] = await pool.query("SELECT COUNT(*) as total FROM users");
    const [[{ total: stores }]] = await pool.query("SELECT COUNT(*) as total FROM restaurant");
    const [[{ total: dishes }]] = await pool.query("SELECT COUNT(*) as total FROM dish WHERE is_active = 1");
    const [[{ total: totalVisits }]] = await pool.query(`
      SELECT COALESCE(SUM(visit_count), 0) as total
      FROM customer_visited
    `);
    const [topRestaurants] = await pool.query(`
      SELECT
        r.name,
        r.rating,
        COALESCE(dish_stats.dish_count, 0) AS dish_count,
        COALESCE(visit_stats.total_views, 0) AS total_views
      FROM restaurant r
      LEFT JOIN (
        SELECT restaurant_id, COUNT(*) AS dish_count
        FROM dish
        WHERE is_active = 1
        GROUP BY restaurant_id
      ) AS dish_stats ON dish_stats.restaurant_id = r.restaurant_id
      LEFT JOIN (
        SELECT restaurant_id, SUM(visit_count) AS total_views
        FROM customer_visited
        GROUP BY restaurant_id
      ) AS visit_stats ON visit_stats.restaurant_id = r.restaurant_id
      ORDER BY total_views DESC, r.rating DESC, r.name ASC
      LIMIT 5
    `);
    const [activities] = await pool.query(`
      SELECT name, restaurant_id, NOW() as created_at
      FROM restaurant ORDER BY restaurant_id DESC LIMIT 5
    `);
    const [heatmapData] = await pool.query(`
      SELECT
        r.name,
        CAST(r.lat AS DECIMAL(10, 8)) as lat,
        CAST(r.lng AS DECIMAL(11, 8)) as lng,
        GREATEST(COALESCE(SUM(cv.visit_count), 0), 1) as weight
      FROM restaurant r
      LEFT JOIN customer_visited cv ON cv.restaurant_id = r.restaurant_id
      WHERE r.lat IS NOT NULL
        AND r.lng IS NOT NULL
        AND r.lat <> ''
        AND r.lng <> ''
      GROUP BY r.restaurant_id, r.name, r.lat, r.lng
      HAVING lat IS NOT NULL AND lng IS NOT NULL
      ORDER BY weight DESC, r.name ASC
    `);
    res.json({
      stats: { owners, stores, dishes, totalVisits },
      topRestaurants,
      activities,
      heatmapData,
    });
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

      // Khóa gian hàng nếu user có restaurant_id
      if (user.restaurant_id) {
        await conn.query(
          "UPDATE restaurant SET status='closed' WHERE restaurant_id=?",
          [user.restaurant_id]
        );
      }

      await conn.query(
        `INSERT INTO users_deleted (user_id, name, password_hash, email, phone, restaurant_id, created_at, deleted_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'admin')`,
        [user.user_id, user.name, user.password_hash, user.email || null,
         user.phone || null, user.restaurant_id || null, user.created_at]
      );
      await conn.query("DELETE FROM users WHERE user_id=?", [req.params.id]);
    });
    res.json({ success: true, message: 'Đã khóa tài khoản và gian hàng' });
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

      // Mở khóa gian hàng nếu user có restaurant_id
      if (ud.restaurant_id) {
        await conn.query(
          "UPDATE restaurant SET status='open' WHERE restaurant_id=?",
          [ud.restaurant_id]
        );
      }

      await conn.query(
        `INSERT INTO users (user_id, name, password_hash, email, phone, restaurant_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ud.user_id, ud.name, ud.password_hash, ud.email, ud.phone, ud.restaurant_id, ud.created_at]
      );
      await conn.query("DELETE FROM users_deleted WHERE deleted_id=?", [req.params.id]);
    });
    res.json({ success: true, message: 'Khôi phục user và gian hàng thành công' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Xóa vĩnh viễn user và toàn bộ dữ liệu liên quan
app.delete('/api/users/permanent/:id', async (req, res) => {
  try {
    await withTransaction(async (conn) => {
      const [[ud]] = await conn.query("SELECT * FROM users_deleted WHERE deleted_id=?", [req.params.id]);
      if (!ud) throw Object.assign(new Error('Không tìm thấy user trong danh sách ngưng hoạt động'), { status: 404 });

      if (ud.restaurant_id) {
        await conn.query("DELETE FROM customer_visits WHERE restaurant_id=?", [ud.restaurant_id]);
        await conn.query("DELETE FROM customer_visited WHERE restaurant_id=?", [ud.restaurant_id]);
        await conn.query("DELETE FROM restaurant_image WHERE restaurant_id=?", [ud.restaurant_id]);
        await conn.query("DELETE FROM dish WHERE restaurant_id=?", [ud.restaurant_id]);
        await conn.query("DELETE FROM restaurant WHERE restaurant_id=?", [ud.restaurant_id]);
      }

      await conn.query("DELETE FROM users_deleted WHERE deleted_id=?", [req.params.id]);
    });

    res.json({ success: true, message: 'Đã xóa vĩnh viễn user và toàn bộ dữ liệu liên quan' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Restaurants ─────────────────────────────────────────────────
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

app.post('/api/restaurants', upload.single('image'), async (req, res) => {
  try {
    const { name, description, address, phone, lat, lng, open_hour, close_hour, status, rating } = req.body;
    if (!name || !address) return res.status(400).json({ error: 'Thiếu tên hoặc địa chỉ' });

    const result = await withTransaction(async (conn) => {
      const [rRes] = await conn.query(
        `INSERT INTO restaurant (name, description, address, phone, lat, lng, open_hour, close_hour, status, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description || null, address, phone || null, lat || null, lng || null,
         open_hour || null, close_hour || null, status || 'open', parseFloat(rating) || 0]
      );
      
      if (req.file) {
        const imageUrl = `/uploads/${req.file.filename}`;
        await conn.query(
          "INSERT INTO restaurant_image (restaurant_id, image_url, is_primary) VALUES (?, ?, 1)",
          [rRes.insertId, imageUrl]
        );
      }
      
      return { restaurant_id: rRes.insertId };
    });

    res.json({ success: true, data: result, message: 'Thêm gian hàng thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/restaurants/:id', (req, res, next) => {
  // Nếu là JSON request (từ Stalls.tsx) thì bỏ qua multer để req.body hoạt động đúng
  if (req.is('application/json')) return next();
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    const { name, description, address, phone, lat, lng, open_hour, close_hour, status, rating } = req.body;
    if (!name || !address) return res.status(400).json({ error: 'Thiếu tên hoặc địa chỉ' });

    const latVal = lat !== undefined ? (lat === '' || lat === null ? null : parseFloat(lat)) : undefined;
    const lngVal = lng !== undefined ? (lng === '' || lng === null ? null : parseFloat(lng)) : undefined;

    await withTransaction(async (conn) => {
      if (latVal !== undefined) {
        await conn.query(
          `UPDATE restaurant SET name=?, description=?, address=?, phone=?, lat=?, lng=?,
           open_hour=?, close_hour=?, status=?, rating=? WHERE restaurant_id=?`,
          [name, description || null, address, phone || null,
           latVal, lngVal,
           open_hour || null, close_hour || null, status || 'open',
           parseFloat(rating) || 0, req.params.id]
        );
      } else {
        await conn.query(
          `UPDATE restaurant SET name=?, description=?, address=?, phone=?,
           open_hour=?, close_hour=?, status=?, rating=? WHERE restaurant_id=?`,
          [name, description || null, address, phone || null,
           open_hour || null, close_hour || null, status || 'open',
           parseFloat(rating) || 0, req.params.id]
        );
      }

      if (req.file) {
        await conn.query("DELETE FROM restaurant_image WHERE restaurant_id=?", [req.params.id]);
        const imageUrl = `/uploads/${req.file.filename}`;
        await conn.query(
          "INSERT INTO restaurant_image (restaurant_id, image_url, is_primary) VALUES (?, ?, 1)",
          [req.params.id, imageUrl]
        );
      }
    });

    res.json({ success: true, message: 'Cập nhật gian hàng thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/restaurants/:id', async (req, res) => {
  try {
    const [[restaurant]] = await pool.query("SELECT * FROM restaurant WHERE restaurant_id=?", [req.params.id]);
    if (!restaurant) return res.status(404).json({ error: 'Không tìm thấy gian hàng' });

    const [[userLinked]] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE restaurant_id=?", [req.params.id]
    );
    if (userLinked.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa gian hàng đang được quản lý bởi chủ gian hàng' });
    }

    await withTransaction(async (conn) => {
      await conn.query("DELETE FROM restaurant_image WHERE restaurant_id=?", [req.params.id]);
      await conn.query("DELETE FROM restaurant WHERE restaurant_id=?", [req.params.id]);
    });

    res.json({ success: true, message: 'Xóa gian hàng thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Audio ───────────────────────────────────────────────────────
app.get('/api/audio/catalog', async (req, res) => {
  try {
    const [restaurants] = await pool.query(`
      SELECT restaurant_id, name
      FROM restaurant
      ORDER BY name ASC
    `);
    const [languages] = await pool.query(`
      SELECT language_id, language_code
      FROM languages
      ORDER BY language_code ASC
    `);

    res.json({
      restaurants,
      languages,
      filesByLanguage: listOfflineAudioFilesByLanguage(),
      offlineAudioRoot,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/audio', async (req, res) => {
  try {
    const where = [];
    const params = [];

    if (req.query.restaurant_id) {
      where.push('a.restaurant_id = ?');
      params.push(req.query.restaurant_id);
    }

    if (req.query.language_code) {
      where.push('l.language_code = ?');
      params.push(normalizeLanguageCode(req.query.language_code));
    }

    if (req.query.is_active === '1' || req.query.is_active === '0') {
      where.push('a.is_active = ?');
      params.push(Number(req.query.is_active));
    }

    const [rows] = await pool.query(`
      SELECT
        a.audio_id,
        a.restaurant_id,
        r.name AS restaurant_name,
        a.language_id,
        l.language_code,
        a.audio_url,
        a.duration,
        a.version,
        a.is_active,
        a.last_updated
      FROM audio a
      JOIN restaurant r ON r.restaurant_id = a.restaurant_id
      JOIN languages l ON l.language_id = a.language_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY r.name ASC, l.language_code ASC, a.version DESC, a.audio_id DESC
    `, params);

    const audios = rows.map((audio) => {
      const fileName = path.basename(String(audio.audio_url || '').replace(/\\/g, '/'));
      const physicalPath = getOfflineAudioPath(audio.language_code, fileName);
      const fileExists = fs.existsSync(physicalPath);
      console.log(`[Audio] id=${audio.audio_id} url="${audio.audio_url}" file="${fileName}" exists=${fileExists} path="${physicalPath}"`);
      return {
        ...audio,
        audio_url: audio.audio_url,
        file_name: fileName,
        file_exists: fileExists,
        preview_url: fileExists ? toOfflineAudioUrl(audio.language_code, fileName) : null,
      };
    });

    res.json(audios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audio', async (req, res) => {
  const { restaurant_id, language_code, file_name, duration, is_active = 1 } = req.body;
  const languageCode = normalizeLanguageCode(language_code);
  const fileName = sanitizeAudioFileName(file_name);

  if (!restaurant_id || !languageCode || !fileName) {
    return res.status(400).json({ error: 'Thieu restaurant_id, language_code hoac file_name' });
  }

  if (!supportedAudioLanguages.includes(languageCode)) {
    return res.status(400).json({ error: 'Ngon ngu audio khong hop le' });
  }

  if (!fs.existsSync(getOfflineAudioPath(languageCode, fileName))) {
    return res.status(400).json({ error: 'File audio khong ton tai trong thu muc offline' });
  }

  try {
    const [[restaurant]] = await pool.query(
      'SELECT restaurant_id FROM restaurant WHERE restaurant_id = ?',
      [restaurant_id]
    );
    if (!restaurant) {
      return res.status(404).json({ error: 'Khong tim thay gian hang' });
    }

    const [[language]] = await pool.query(
      'SELECT language_id FROM languages WHERE language_code = ?',
      [languageCode]
    );
    if (!language) {
      return res.status(404).json({ error: 'Khong tim thay ngon ngu' });
    }

    const [[{ total: activeCount }]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM audio
      WHERE restaurant_id = ? AND language_id = ? AND is_active = 1
    `, [restaurant_id, language.language_id]);

    if (Number(is_active) === 1 && activeCount >= 3) {
      return res.status(400).json({ error: 'Moi quan chi duoc toi da 3 file active cho moi ngon ngu' });
    }

    const [[{ next_version }]] = await pool.query(`
      SELECT COALESCE(MAX(version), 0) + 1 AS next_version
      FROM audio
      WHERE restaurant_id = ? AND language_id = ?
    `, [restaurant_id, language.language_id]);

    const audioUrl = `audio/${languageCode}/${fileName}`;
    const [result] = await pool.query(`
      INSERT INTO audio (restaurant_id, language_id, audio_url, duration, version, is_active, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      restaurant_id,
      language.language_id,
      audioUrl,
      Number.isFinite(Number(duration)) ? Number(duration) : null,
      next_version,
      Number(is_active) ? 1 : 0,
    ]);

    res.json({ success: true, audio_id: result.insertId, file_name: fileName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audio/upload', audioUpload.single('audio'), async (req, res) => {
  const languageCode = normalizeLanguageCode(req.body.language_code);
  const restaurantId = Number(req.body.restaurant_id);
  const duration = req.body.duration;

  if (!restaurantId || !languageCode || !req.file) {
    return res.status(400).json({ error: 'Thieu restaurant_id, language_code hoac file audio' });
  }

  if (!supportedAudioLanguages.includes(languageCode)) {
    return res.status(400).json({ error: 'Ngon ngu audio khong hop le' });
  }

  try {
    const [[restaurant]] = await pool.query(
      'SELECT restaurant_id FROM restaurant WHERE restaurant_id = ?',
      [restaurantId]
    );
    if (!restaurant) {
      return res.status(404).json({ error: 'Khong tim thay gian hang' });
    }

    const [[language]] = await pool.query(
      'SELECT language_id FROM languages WHERE language_code = ?',
      [languageCode]
    );
    if (!language) {
      return res.status(404).json({ error: 'Khong tim thay ngon ngu' });
    }

    const [[{ total: activeCount }]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM audio
      WHERE restaurant_id = ? AND language_id = ? AND is_active = 1
    `, [restaurantId, language.language_id]);

    if (activeCount >= 3) {
      return res.status(400).json({ error: 'Moi quan chi duoc toi da 3 file active cho moi ngon ngu' });
    }

    const languageDir = path.join(offlineAudioRoot, languageCode);
    if (!fs.existsSync(languageDir)) {
      fs.mkdirSync(languageDir, { recursive: true });
    }

    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'audio';
    const storedFileName = `${restaurantId}-${Date.now()}-${baseName}.mp3`;
    const fullPath = path.join(languageDir, storedFileName);
    fs.writeFileSync(fullPath, req.file.buffer);

    const [[{ next_version }]] = await pool.query(`
      SELECT COALESCE(MAX(version), 0) + 1 AS next_version
      FROM audio
      WHERE restaurant_id = ? AND language_id = ?
    `, [restaurantId, language.language_id]);

    const audioUrl = `audio/${languageCode}/${storedFileName}`;
    const [result] = await pool.query(`
      INSERT INTO audio (restaurant_id, language_id, audio_url, duration, version, is_active, last_updated)
      VALUES (?, ?, ?, ?, ?, 1, NOW())
    `, [
      restaurantId,
      language.language_id,
      audioUrl,
      Number.isFinite(Number(duration)) ? Number(duration) : null,
      next_version,
    ]);

    res.json({ success: true, audio_id: result.insertId, file_name: storedFileName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/audio/:id', async (req, res) => {
  try {
    const [[audio]] = await pool.query('SELECT audio_id, audio_url FROM audio WHERE audio_id = ?', [req.params.id]);
    if (!audio) {
      return res.status(404).json({ error: 'Khong tim thay audio' });
    }

    await pool.query('DELETE FROM audio WHERE audio_id = ?', [req.params.id]);
    await deletePhysicalAudioIfUnused(audio.audio_url);
    res.json({ success: true });
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

// ── Customer Visits / Analytics ──────────────────────────────────
app.post('/api/customer-visits', async (req, res) => {
  try {
    const { customer_id, restaurant_id, listen_count = 0 } = req.body;

    console.log(`[Analytics] POST /api/customer-visits →`, { customer_id, restaurant_id, listen_count });

    if (!customer_id || !restaurant_id) {
      return res.status(400).json({ error: 'Thiếu customer_id hoặc restaurant_id' });
    }

    await pool.query(`
      INSERT INTO customer_visited (customer_id, restaurant_id, visit_count, audio_listen_count)
      VALUES (?, ?, 1, ?)
      ON DUPLICATE KEY UPDATE
        visit_count        = visit_count + 1,
        audio_listen_count = audio_listen_count + VALUES(audio_listen_count),
        last_visited       = NOW()
    `, [customer_id, restaurant_id, listen_count]);

    console.log(`[Analytics] ✓ Saved: customer=${customer_id}, restaurant=${restaurant_id}, listen=${listen_count}`);
    res.json({ success: true, message: 'Ghi lại lượt truy cập thành công' });
  } catch (err) {
    console.error('[Analytics] ✗ POST /api/customer-visits error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurants/:id/visits', async (req, res) => {
  try {
    const [[restaurantCheck]] = await pool.query('SELECT restaurant_id FROM restaurant WHERE restaurant_id = ?', [req.params.id]);
    if (!restaurantCheck) return res.status(404).json({ error: 'Không tìm thấy restaurant' });

    const [visits] = await pool.query(`
      SELECT cv.visit_id, cv.customer_id, cv.visit_count, cv.audio_listen_count, cv.last_visited, cv.created_at
      FROM customer_visited cv
      WHERE cv.restaurant_id = ?
      ORDER BY cv.last_visited DESC
    `, [req.params.id]);

    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurants/:id/visits/stats', async (req, res) => {
  try {
    const restaurantId = req.params.id;
    console.log(`[Analytics] GET /api/restaurants/${restaurantId}/visits/stats`);

    const [restaurants] = await pool.query(
      'SELECT restaurant_id FROM restaurant WHERE restaurant_id = ?',
      [restaurantId]
    );
    if (!restaurants || restaurants.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy restaurant' });
    }

    const [rows] = await pool.query(`
      SELECT
        COALESCE(COUNT(DISTINCT customer_id), 0) AS total_visitors,
        COALESCE(SUM(visit_count), 0)            AS total_visits,
        COALESCE(SUM(audio_listen_count), 0)     AS total_listens,
        MAX(last_visited)                        AS last_visit_time
      FROM customer_visited
      WHERE restaurant_id = ?
    `, [restaurantId]);

    const stats = rows[0] || { total_visitors: 0, total_visits: 0, total_listens: 0, last_visit_time: null };
    console.log(`[Analytics] Stats for restaurant ${restaurantId}:`, stats);
    res.json(stats);
  } catch (err) {
    console.error('[Analytics] ✗ GET visits/stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/overview', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM v_poi_analytics ORDER BY total_views DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Xóa lịch sử ─────────────────────────────────────────────────
app.delete('/api/restaurants/:id/visits', async (req, res) => {
  try {
    const { id } = req.params;
    const [[restaurant]] = await pool.query(
      'SELECT restaurant_id FROM restaurant WHERE restaurant_id = ?', [id]
    );
    if (!restaurant) return res.status(404).json({ error: 'Không tìm thấy gian hàng' });

    const [result] = await pool.query(
      'DELETE FROM customer_visited WHERE restaurant_id = ?', [id]
    );
    console.log(`[Analytics] Đã xóa ${result.affectedRows} bản ghi truy cập của restaurant ${id}`);
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    console.error('[Analytics] ✗ DELETE visits error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/app-opens', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM app_opens');
    console.log(`[AppOpen] Đã xóa ${result.affectedRows} bản ghi mở app`);
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    console.error('[AppOpen] ✗ DELETE app-opens error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Ghi nhận lượt mở app (POST /api/app-opens) ──────────────────
app.post('/api/app-opens', async (req, res) => {
  try {
    const { device_id, device_type, app_version, language_code } = req.body;
    if (!device_id) {
      return res.status(400).json({ error: 'Thiếu device_id' });
    }

    await pool.query(
      `INSERT INTO app_opens (device_id, device_type, app_version, language_code, opened_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [device_id, device_type || null, app_version || null, language_code || null]
    );

    console.log(`[AppOpen] Ghi nhận mở app: device=${device_id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[AppOpen] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// ── Thống kê mở App (Phục vụ Dashboard và Analytics) ─────────────
app.get('/api/app-opens/stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_opens,
        COUNT(DISTINCT device_id) AS unique_devices,
        MAX(opened_at) AS last_open,
        SUM(CASE WHEN device_type LIKE '%Android%' THEN 1 ELSE 0 END) AS android_count,
        SUM(CASE WHEN device_type LIKE '%iOS%' OR device_type LIKE '%iPhone%' OR device_type LIKE '%iPad%' THEN 1 ELSE 0 END) AS ios_count,
        SUM(CASE WHEN device_type LIKE '%Windows%' THEN 1 ELSE 0 END) AS windows_count
      FROM app_opens
    `);

    const stats = rows[0];
    res.json({
      total_opens: stats.total_opens || 0,
      unique_devices: stats.unique_devices || 0,
      last_open: stats.last_open || null,
      android_count: Number(stats.android_count || 0),
      ios_count: Number(stats.ios_count || 0),
      windows_count: Number(stats.windows_count || 0),
    });
  } catch (err) {
    console.error('[AppOpen] GET stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Real-time online sessions ────────────────────────────────────
app.post('/api/online-sessions/start', async (req, res) => {
  try {
    await ensureOnlineSessionTable();
    const { session_id, device_id, device_type, app_version, language_code } = req.body;
    if (!session_id || !device_id) {
      return res.status(400).json({ error: 'Thieu session_id hoac device_id' });
    }

    await pool.query(`
      INSERT INTO app_online_sessions
        (session_id, device_id, device_type, app_version, language_code, started_at, last_seen, ended_at, is_active)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NULL, 1)
      ON DUPLICATE KEY UPDATE
        device_id = VALUES(device_id),
        device_type = VALUES(device_type),
        app_version = VALUES(app_version),
        language_code = VALUES(language_code),
        last_seen = NOW(),
        ended_at = NULL,
        is_active = 1
    `, [session_id, device_id, device_type || null, app_version || null, language_code || null]);

    res.json({ success: true });
  } catch (err) {
    console.error('[Online] start error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/online-sessions/heartbeat', async (req, res) => {
  try {
    await ensureOnlineSessionTable();
    const { session_id, device_id } = req.body;
    if (!session_id || !device_id) {
      return res.status(400).json({ error: 'Thieu session_id hoac device_id' });
    }

    await pool.query(`
      UPDATE app_online_sessions
      SET last_seen = NOW(), is_active = 1, ended_at = NULL
      WHERE session_id = ? AND device_id = ?
    `, [session_id, device_id]);

    res.json({ success: true });
  } catch (err) {
    console.error('[Online] heartbeat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/online-sessions/end', async (req, res) => {
  try {
    await ensureOnlineSessionTable();
    const { session_id, device_id } = req.body;
    if (!session_id || !device_id) {
      return res.status(400).json({ error: 'Thieu session_id hoac device_id' });
    }

    await pool.query(`
      UPDATE app_online_sessions
      SET is_active = 0, ended_at = NOW(), last_seen = NOW()
      WHERE session_id = ? AND device_id = ?
    `, [session_id, device_id]);

    res.json({ success: true });
  } catch (err) {
    console.error('[Online] end error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/online-sessions/stats', async (req, res) => {
  try {
    await ensureOnlineSessionTable();

    await pool.query(`
      UPDATE app_online_sessions
      SET is_active = 0, ended_at = COALESCE(ended_at, last_seen)
      WHERE is_active = 1 AND last_seen < DATE_SUB(NOW(), INTERVAL 90 SECOND)
    `);

    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS online_count,
        COUNT(DISTINCT device_id) AS unique_online_devices,
        MAX(last_seen) AS last_seen,
        SUM(CASE WHEN device_type LIKE '%Android%' THEN 1 ELSE 0 END) AS android_online,
        SUM(CASE WHEN device_type LIKE '%iOS%' OR device_type LIKE '%iPhone%' OR device_type LIKE '%iPad%' THEN 1 ELSE 0 END) AS ios_online,
        SUM(CASE WHEN device_type LIKE '%Windows%' THEN 1 ELSE 0 END) AS windows_online
      FROM app_online_sessions
      WHERE is_active = 1
        AND last_seen >= DATE_SUB(NOW(), INTERVAL 90 SECOND)
    `);

    const stats = rows[0] || {};
    res.json({
      online_count: Number(stats.online_count || 0),
      unique_online_devices: Number(stats.unique_online_devices || 0),
      last_seen: stats.last_seen || null,
      android_online: Number(stats.android_online || 0),
      ios_online: Number(stats.ios_online || 0),
      windows_online: Number(stats.windows_online || 0),
      stale_after_seconds: 90,
    });
  } catch (err) {
    console.error('[Online] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Xóa TOÀN BỘ lượt truy cập POI (Tất cả gian hàng) ─────────────
app.delete('/api/visits/all', async (req, res) => {
  try {
    // Xóa bảng chi tiết (nếu có)
    await pool.query('DELETE FROM customer_visits'); 
    // Xóa bảng tổng hợp
    const [result] = await pool.query('DELETE FROM customer_visited'); 
    
    console.log(`[Analytics] Đã xóa toàn bộ ${result.affectedRows} bản ghi truy cập POI toàn hệ thống`);
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    console.error('[Analytics] ✗ DELETE all visits error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (!fs.existsSync(frontendIndexPath)) {
    return res.status(503).send('Frontend build not found. Run "npm run build" before starting the server.');
  }
  return res.sendFile(frontendIndexPath);
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, async () => {
  console.log(`[Server] Backend listening on port ${port}`);
  console.log(`[Server] DB host=${dbConfig.host || 'missing'} db=${dbConfig.database || 'missing'} user=${dbConfig.user || 'missing'} port=${dbConfig.port}`);

  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    await ensureOnlineSessionTable();
    console.log('[Server] Database connected successfully');
  } catch (err) {
    console.error('[Server] Database connection failed:', err.message);
  }
});

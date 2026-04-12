# 🐛 Analytics Debugging Guide

## ✅ Common Issue Fixed

**Problem:** Analytics page không hiển thị thống kê (Không xem được stats)

**Root Cause:** Test data đã insert với `restaurant_id` không hợp lệ (1, 5) nhưng restaurant table chỉ có IDs: 7, 22, 19, 18, 14, ...

**Solution:** ✅ Đã fix - test data giờ dùng `restaurant_id` **7, 22, 19** (những ID thực tế trong database)

---

## 🧪 Current Test Data

```sql
Customer Visit Stats:
- Restaurant 7:     3 khách,  16 lần truy cập,  10 lần nghe
- Restaurant 22:    2 khách,   6 lần truy cập,   5 lần nghe
- Restaurant 19:    1 khách,   6 lần truy cập,   3 lần nghe
```

---

## 📋 Debugging Checklist

### ✅ Backend (Node.js)
- [ ] Server chạy trên port 3000
- [ ] `/api/restaurants` endpoint trả về danh sách quán
- [ ] `/api/restaurants/:id/visits/stats` trả về stats object

**Test:**
```bash
# Check if server is running
curl http://localhost:3000/api/restaurants 

# Get stats for restaurant 7
curl http://localhost:3000/api/restaurants/7/visits/stats
```

**Expected Response:**
```json
{
  "total_visitors": 3,
  "total_visits": 16,
  "total_listens": 10,
  "last_visit_time": "2024-04-12T..."
}
```

---

### ✅ Database (MySQL)
- [ ] `customer_visited` table tồn tại
- [ ] Có dữ liệu test trong bảng
- [ ] Foreign key/constraints không bị lỗi

**Test:**
```sql
-- Check table exists
SHOW TABLES LIKE 'customer_visited';

-- Check data
SELECT * FROM customer_visited;

-- Check stats for restaurant 7
SELECT 
  COUNT(DISTINCT customer_id) AS total_visitors,
  SUM(visit_count) AS total_visits,
  SUM(audio_listen_count) AS total_listens,
  MAX(last_visited) AS last_visit_time
FROM customer_visited
WHERE restaurant_id = 7;
```

---

### ✅ Frontend (React)
- [ ] Analytics.tsx component loads
- [ ] Console không có errors
- [ ] Restaurants dropdown hiển thị quán

**Debug Steps:**

1. **Open DevTools (F12)** → Console tab
2. **Check for errors** (should show logs like `[Analytics] Fetched restaurants:...`)
3. **Select a restaurant** → check logs for `[Analytics] Fetching stats from: http://localhost:3000/api/restaurants/7/visits/stats`
4. **Look for stats response** → `[Analytics] Fetched stats:`

**Common Console Errors & Fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot reach http://localhost:3000` | Node server not running | Start server: `npm start` |
| `HTTP 404` in logs | Restaurant doesn't exist | Use correct restaurant_id from database |
| `stats is null` after fetch | API returned error | Check MySQL connections |
| `Cannot read property 'restaurant_id'` | restaurants array empty | Check `/api/restaurants` endpoint |

---

## 🚀 How to Test End-to-End

### Step 1: Verify Database
```bash
mysql -u root food_app
mysql> SELECT COUNT(*) FROM restaurant;  -- Should show 20+
mysql> SELECT COUNT(*) FROM customer_visited;  -- Should show 6+ (test data)
```

### Step 2: Start Backend
```bash
cd web\main
npm start
# Should log: Backend đang chạy tại http://localhost:3000
```

### Step 3: Test API Endpoints
```bash
# Terminal 1 - List restaurants
curl http://localhost:3000/api/restaurants | jq '.[] | {restaurant_id, name}'

# Terminal 2 - Get stats (use a real restaurant_id from output above)
curl http://localhost:3000/api/restaurants/7/visits/stats | jq
```

### Step 4: Test Frontend
1. Open `http://localhost:3000` (web admin)
2. Go to **Thống kê truy cập** menu
3. Should see restaurants list
4. Click restaurant 7 → should see stats cards with numbers:
   - **Khách truy cập:** 3
   - **Lần truy cập:** 16
   - **Lần nghe audio:** 10
   - **Truy cập gần nhất:** [timestamp]

### Step 5: Verify Calculations
- **Trung bình lần truy cập/khách:** 16/3 = 5.33
- **Trung bình lần nghe/khách:** 10/3 = 3.33
- **Engagement rate:** (10/16) × 100 = 62.5%

---

## 📱 Testing with Real POIApp Data

Once POIApp sends actual visit data, do **NOT** clear test data. Instead:

1. **In POIApp:** 
   - Login as customer
   - Tap a POI marker (e.g., restaurant 7)
   - Play audio
   - Note the logs: `[Analytics] Ghi nhận truy cập:...`

2. **In Web Admin:**
   - Open Analytics page
   - Select same restaurant
   - Stats should update within 1-2 seconds
   - Numbers should increment

---

## 🔧 Troubleshooting

### Issue 1: Analytics page loads but stats don't display

**Symptoms:**
- Restaurant dropdown shows restaurants
- No stats cards appear
- No errors in console

**Steps:**
1. Open DevTools → Console
2. Type: `localStorage.getItem('isAdminLoggedIn')`
3. Should return `"true"`
4. Select a restaurant
5. Look for `[Analytics] Fetching stats from:...` log
6. Check if response shows `total_visitors` > 0

**If still failing:**
```javascript
// Run in browser console
fetch('http://localhost:3000/api/restaurants/7/visits/stats')
  .then(r => r.json())
  .then(d => console.log('Stats:', d))
  .catch(e => console.log('Error:', e))
```

---

### Issue 2: Restaurant list is empty

**Symptoms:**
- Dropdown shows "Không có gian hàng nào"
- Error message: "Lỗi lấy quán:..."

**Steps:**
1. Check database: ```bash
   mysql -u root food_app -e "SELECT COUNT(*) FROM restaurant;"
   ```
   Should be 20+

2. Check API returns data:
   ```bash
   curl http://localhost:3000/api/restaurants | head
   ```
   Should show JSON array

3. If empty, check MySQL connection in server.js

---

### Issue 3: Stats show 0 for everything

**Symptoms:**
- All stat cards show: **0**
- Engagement rate: **0%**

**Steps:**
1. Verify test data exists:
   ```bash
   mysql -u root food_app -e "SELECT COUNT(*) FROM customer_visited;"
   ```
   Should be 6+ rows

2. Check stats calculation:
   ```bash
   mysql -u root food_app -e "
     SELECT COUNT(DISTINCT customer_id), SUM(visit_count)
     FROM customer_visited WHERE restaurant_id = 7;"
   ```

3. If shows 0, re-insert test data (see below)

---

## 🔄 Reset & Re-insert Test Data

If something goes wrong, reset test data:

```bash
mysql -u root food_app -e "
-- Delete all test data
DELETE FROM customer_visited;

-- Re-insert clean test data
INSERT INTO customer_visited (customer_id, restaurant_id, visit_count, audio_listen_count, last_visited)
VALUES 
  (1, 7, 5, 3, NOW()),
  (2, 7, 3, 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (3, 7, 8, 5, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (1, 22, 2, 1, NOW()),
  (4, 22, 4, 4, NOW()),
  (5, 19, 6, 3, NOW());

SELECT COUNT(*) as total_visits FROM customer_visited;
"
```

---

## 📊 Expected UI Flow

```
Analytics Page Opens
     ↓
[Fetch /api/restaurants] ← Lists all 20 restaurants
     ↓
User selects Restaurant 7
     ↓
[Fetch /api/restaurants/7/visits/stats] ← Gets stats
     ↓
Display 4 Cards:
  ┌─────────────────┐
  │ Khách truy cập │  → 3
  ├─────────────────┤
  │ Lần truy cập    │  → 16
  ├─────────────────┤
  │ Lần nghe audio  │  → 10
  ├─────────────────┤
  │ Truy cập gần    │  → NOW()
  └─────────────────┘
```

---

## 📝 Next Steps

1. ✅ Test data inserted correctly
2. ✅ Analytics component shows stats
3. 🟡 **Next:** Integrate with real POIApp visits
   - Monitor for POST `/api/customer-visits` requests
   - Verify stats update in real-time

4. 🟡 **Future:** Export analytics to CSV/PDF

---

**Last Updated:** April 12, 2026  
**Status:** ✅ Ready to Test

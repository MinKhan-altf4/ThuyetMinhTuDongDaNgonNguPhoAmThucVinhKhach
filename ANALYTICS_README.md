# 📊 Customer Visit Analytics System

## Tổng Quan

Hệ thống giám sát truy cập khách hàng để các chủ nhà hàng có thể xem:
- **Tổng khách truy cập** (số khách độc nhất)
- **Tổng lần truy cập** (mỗi khách truy cập bao nhiêu lần)
- **Tổng lần nghe audio** (khách nghe mô tả âm thanh bao nhiêu lần)
- **Lần truy cập gần nhất** (khi nào có khách cuối cùng)

---

## Cấu Trúc

### 1️⃣ **Database Schema** (`migration_customer_visits.sql`)

```sql
CREATE TABLE customer_visited (
    visit_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    visit_count INT DEFAULT 1,
    audio_listen_count INT DEFAULT 0,
    last_visited TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_customer_restaurant (customer_id, restaurant_id),
    KEY idx_restaurant (restaurant_id),
    KEY idx_last_visited (last_visited)
);
```

**Cột:**
- `visit_id`: ID duy nhất của hàng
- `customer_id`: ID khách (từ POIApp SecureStorage)
- `restaurant_id`: ID nhà hàng (POI.Id)
- `visit_count`: Số lần khách truy cập
- `audio_listen_count`: Số lần khách nghe audio
- `last_visited`: Lần cuối cùng truy cập
- `created_at`: Lần đầu tiên truy cập

---

### 2️⃣ **Backend API** (`server.js`)

#### `POST /api/customer-visits` — Ghi nhận truy cập

**Request:**
```json
{
  "customer_id": 1,
  "restaurant_id": 5,
  "listen_count": 0
}
```

**Logic:**
1. Nếu cặp (customer_id, restaurant_id) **đã tồn tại**:
   - Increment `visit_count`
   - Cộng thêm `listen_count` vào `audio_listen_count`
   - Update `last_visited`

2. Nếu **lần đầu**:
   - Insert bản ghi mới với `visit_count=1`, `audio_listen_count=listen_count`

**Response:**
```json
{
  "success": true,
  "message": "Visit recorded",
  "data": { "visit_id": 42 }
}
```

---

#### `GET /api/restaurants/:id/visits` — Danh sách truy cập

**Response:** (List of visits sorted by last_visited DESC)
```json
{
  "success": true,
  "data": [
    {
      "customer_id": 2,
      "visit_count": 5,
      "audio_listen_count": 3,
      "last_visited": "2024-01-15T14:30:00Z"
    }
  ]
}
```

---

#### `GET /api/restaurants/:id/visits/stats` — Thống kê tổng hợp

**Response:**
```json
{
  "total_visitors": 42,
  "total_visits": 156,
  "total_listens": 89,
  "last_visit_time": "2024-01-15T14:30:00Z"
}
```

**Công thức:**
- `total_visitors` = COUNT(DISTINCT customer_id)
- `total_visits` = SUM(visit_count)
- `total_listens` = SUM(audio_listen_count)

---

### 3️⃣ **Mobile Service** (`AnalyticsService.cs`)

```csharp
public async Task RecordVisitAsync(int customerId, int restaurantId, int listenCount = 0)
{
    // Gửi POST đến server
    // Payload: { customer_id, restaurant_id, listen_count }
    // URL: http://localhost:3000/api/customer-visits
}
```

**Tính năng:**
- ✅ Async/await HTTP POST
- ✅ JSON serialization
- ✅ Error logging với Debug.WriteLine
- ✅ Timeout handling

---

### 4️⃣ **Mobile Integration** (`MapPage.xaml.cs`)

#### Event 1: POI Tap (Show Detail)

```csharp
private void ShowDetail(POI poi)
{
    // ... existing code ...
    _ = RecordPOIVisitAsync(poi);  // ← Ghi nhận truy cập
}

private async Task RecordPOIVisitAsync(POI poi)
{
    // Lấy customer_id từ SecureStorage
    var customerId = await SecureStorage.GetAsync("user_id");
    // Gọi: RecordVisitAsync(customerId, poi.Id, listenCount: 0)
}
```

**Khi nào trigger:** Khách tap POI marker → modal mở → ghi nhận 1 lần truy cập

---

#### Event 2: Audio Play

```csharp
private async void OnPlayAudioClicked(object? sender, EventArgs e)
{
    // ... play TTS ...
    _ = RecordAudioListenAsync(_selectedPOI);  // ← Ghi nhận nghe audio
}

private async Task RecordAudioListenAsync(POI poi)
{
    // Gọi: RecordVisitAsync(customerId, poi.Id, listenCount: 1)
}
```

**Khi nào trigger:** Khách bấm nút "Play" → audio phát → ghi nhận 1 lần nghe

---

### 5️⃣ **Web Admin Dashboard** (`Analytics.tsx`)

**Route:** `/analytics`

**Tính năng:**
- 📊 Dropdown chọn nhà hàng
- 🔍 Tìm kiếm gian hàng theo tên
- 📈 4 thẻ thống kê:
  - Khách truy cập (Users icon 👥)
  - Lần truy cập (Eye icon 👁️)
  - Lần nghe audio (Volume icon 🔊)
  - Truy cập gần nhất (Clock icon 🕐)

**Công thức Analytics:**
- Trung bình lần truy cập/khách = `total_visits / total_visitors`
- Trung bình lần nghe/khách = `total_listens / total_visitors`
- Engagement rate = `(total_listens / total_visits) * 100%`

---

## Setup Instructions

### 1. Run Migration SQL

```bash
mysql -u root food_app < path/to/migration_customer_visits.sql
```

**Verify:**
```bash
mysql -u root food_app -e "DESCRIBE customer_visited;"
```

---

### 2. Check Backend Endpoints

Verify server.js has 3 endpoints:
- `POST /api/customer-visits`
- `GET /api/restaurants/:id/visits`
- `GET /api/restaurants/:id/visits/stats`

Start server:
```bash
cd web\main
npm start  # or npm run dev
```

---

### 3. Mobile App Updates

✅ Verified:
- `AnalyticsService.cs` has `RecordVisitAsync()` method
- `MapPage.xaml.cs` calls `RecordPOIVisitAsync()` on POI tap
- `MapPage.xaml.cs` calls `RecordAudioListenAsync()` on audio play
- Uses `SecureStorage.GetAsync("user_id")` to get customer_id

Build & deploy POIApp:
```bash
cd POIApp
dotnet build -f net10.0-android
```

---

### 4. Web Admin Analytics

✅ Created:
- `Analytics.tsx` component
- Route added to `App.tsx`
- Navigation link added to `AdminSidebar.tsx`

Navigate to:
```
http://localhost:3000/analytics
```

---

## Data Flow Diagram

```
┌─────────────────────┐
│   POIApp (Mobile)   │
│   MapPage.xaml.cs   │
└──────────┬──────────┘
           │
           │ [1] User taps POI marker
           │     RecordPOIVisitAsync()
           │
           ├──────────────────────────┐
           │ [2] RecordVisitAsync()   │
           │     (listen_count = 0)   │
           │                          │
           v                          │
┌──────────────────────────────────────┴──┐
│   AnalyticsService.cs                   │
│   POST /api/customer-visits            │
│   { customer_id, restaurant_id, 0 }   │
└──────────────────┬─────────────────────┘
                   │
                   │ [3] HTTP POST
                   v
┌──────────────────────────────────────────┐
│   server.js (Node.js)                    │
│   POST /api/customer-visits endpoint     │
│                                          │
│   1. Check if (customer, restaurant)     │
│      already exists                      │
│   2. If YES: increment visit_count       │
│             add listen_count             │
│      If NO:  create new record           │
│   3. Update last_visited                 │
└──────────────┬───────────────────────────┘
               │
               │ [4] EXECUTE SQL
               v
┌──────────────────────────────────────────┐
│   MySQL - food_app.customer_visited      │
│   - Stores all visit records             │
│   - Indexes: restaurant, last_visited    │
└──────────────────────────────────────────┘
               │
               │ [5] Query for stats
               v
┌──────────────────────────────────────────┐
│   Web Admin Analytics.tsx                │
│   GET /api/restaurants/:id/visits/stats │
│                                          │
│   Displays:                              │
│   - Total visitors                       │
│   - Total visits                         │
│   - Total audio listens                  │
│   - Engagement metrics                   │
└──────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Database migration ran successfully
- [ ] 3 API endpoints respond without errors
- [ ] POIApp logs show "Ghi nhận truy cập" messages
- [ ] Web admin Analytics page loads
- [ ] Can select restaurant from dropdown
- [ ] Stats cards display correct numbers
- [ ] Engagement rate formula works

---

## Troubleshooting

### Issue: "Cannot reach http://localhost:3000"
→ Ensure Node.js server is running on port 3000

### Issue: "Ghi nhận truy cập" not in logs
→ Check SecureStorage has "user_id" key set
→ Verify POI.Id > 0

### Issue: Analytics page shows 0 for all stats
→ Check if `customer_visited` table has data:
```sql
SELECT * FROM customer_visited;
```
→ Verify restaurant_id matches POI IDs

### Issue: "Cannot serialize to JSON"
→ Check AnalyticsService payload format
→ Ensure listen_count is int (not string)

---

## Future Enhancements

- 📅 Date range filtering in analytics
- 🗺️ Map visualization of popular POIs
- 📧 Email notifications for new visits
- 📱 Push notifications to restaurant owners
- 🔐 Analytics export to CSV

---

## Files Modified

```
✅ migration_customer_visits.sql          [NEW] Database schema
✅ server.js                              [MODIFIED] +3 endpoints
✅ AnalyticsService.cs                   [MODIFIED] +RecordVisitAsync()
✅ MapPage.xaml.cs                       [MODIFIED] +integration calls
✅ Analytics.tsx                         [NEW] Web dashboard
✅ App.tsx                               [MODIFIED] +route
✅ AdminSidebar.tsx                      [MODIFIED] +navigation
```

---

**Last Updated:** 2024-01-15  
**Status:** ✅ Ready for Production Testing

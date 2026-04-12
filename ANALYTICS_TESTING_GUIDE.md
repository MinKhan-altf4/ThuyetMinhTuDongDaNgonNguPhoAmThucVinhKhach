# ✅ Analytics Visit Recording - Final Setup Guide

## 🔧 Fixes Applied

### 1️⃣ **AnalyticsService Enhanced** ✅
- ✅ Added detailed logging for debugging
- ✅ Added timeout (15 seconds)
- ✅ Added error handling for different failure types
- ✅ ⚠️ **Still using localhost** - OK for desktop testing!

### 2️⃣ **MapPage Fallback System** ✅
- ✅ If no `user_id` in SecureStorage → generates `device_id`
- ✅ Uses device_id hash as customer_id (persistent)
- ✅ Works even without login system

### 3️⃣ **Audio Listen Recording** ✅
- ✅ Same fallback mechanism as POI visits

---

## 🧪 Testing - 3 Scenarios

### **Scenario 1: Desktop Testing** (Windows)
```
1. Start Node.js server:
   cd web\main
   npm start
   
2. Start POIApp on Windows
   - Maps page opens
   
3. Tap POI marker
   - Modal shows POI details
   
4. Check OUTPUT WINDOW for:
   [Analytics] Created new device_id: abc12345
   [Analytics] ✓ Ghi nhận truy cập: customer=1234, restaurant=7
   
5. Verify database:
   mysql -u root food_app -e "SELECT * FROM customer_visited 
       WHERE restaurant_id = 7 ORDER BY last_visited DESC LIMIT 1;"
```

**Expected Output:**
```
visit_id | customer_id | restaurant_id | visit_count | audio_listen_count | last_visited
    10   |    1234     |       7       |      1      |         0          | 2024-04-12...
```

---

### **Scenario 2: Android Emulator** (Same Network)
```
PROBLEM: Android emulator can't reach localhost:3000
SOLUTION: Need desktop IP address

1. Get your desktop IP:
   Windows: ipconfig
   Look for "IPv4 Address" - something like 192.168.1.100
   
2. Update AnalyticsService.cs:
   Change: string serverAddress = "http://localhost:3000";
   To:     string serverAddress = "http://192.168.1.100:3000";  ← YOUR IP
   
3. Rebuild POIApp and deploy to emulator
   
4. Test: Emulator should now reach server
```

---

### **Scenario 3: Physical Android Device** (WiFi)
```
SAME as Scenario 2:
- Desktop and phone MUST be on same WiFi
- Firewall MUST allow port 3000
- Use desktop's local IP (e.g., 192.168.1.100)
```

---

## 📊 Real-World Testing Flow

### **Step 1: Verify Server is Running**
```bash
curl http://localhost:3000/api/restaurants | head -1
# Should return first restaurant object
```

### **Step 2: Clear Old Test Data (Optional)**
```bash
mysql -u root food_app -e "DELETE FROM customer_visited;"
```

### **Step 3: Launch POIApp**
1. Open Visual Studio Debugger
2. Press F5 to run
3. Wait for app to appear

### **Step 4: Tap POI - Watch Output**
1. Click "Maps" tab to see map
2. Tap any POI marker
3. Look at Visual Studio's OUTPUT window (Debug tab)

**Good Signs:** 
```
✅ [Analytics] Created new device_id: xyz789
✅ [Analytics] ✓ Ghi nhận truy cập: customer=5000, restaurant=7
```

**Bad Signs:**
```
❌ [Analytics] ✗ Network Error: Unable to connect to remoteserver
❌ [Analytics] ✗ Timeout Error: Operation timed out
❌ [Analytics] ✗ HTTP Error 404
```

### **Step 5: Play Audio - Watch Listen Count Increment**
1. Click "Play" button on POI modal
2. Audio plays (TTS)
3. Check output for:
```
✅ [Analytics] ✓ Ghi nhận audio listen: customer=5000, restaurant=7
```

### **Step 6: Verify in Database**
```bash
# Check latest visit
mysql -u root food_app -e "SELECT * FROM customer_visited 
    WHERE restaurant_id = 7 
    ORDER BY last_visited DESC LIMIT 1;"

# Expected: visit_count=1 or 2, audio_listen_count=0 or 1
```

### **Step 7: Check Web Analytics**
1. Open http://localhost:3000/analytics
2. Select Restaurant 7 from dropdown
3. Should see stats:
   - Khách truy cập: 1
   - Lần truy cập: 1-2 (depending on repeats)
   - Lần nghe audio: 0-1 (if you played audio)

---

## 🔍 Debugging by Output Message

| Log Message | Meaning | Action |
|------------|---------|--------|
| `Created new device_id: abc123` | First time testing | ✅ Normal |
| `Using fallback customer_id: 500` | No user_id set | ✅ Normal |
| `✓ Ghi nhận truy cập` | Visit recorded | ✅ Success! |
| `✓ Ghi nhận audio listen` | Audio recorded | ✅ Success! |
| `POI có ID không hợp lệ` | Bug in data | ❌ Check POI object |
| `Network Error: Unable to connect` | Server offline | ❌ Start server |
| `HTTP Error 404` | Endpoint not found | ❌ Check server.js |
| `HTTP Error 400` | Bad request data | ❌ Check JSON format |
| `Timeout Error` | Server too slow | ❌ Check DB performance |

---

## 📱 Mobile Testing Checklist

### Before Testing on Phone:
- [ ] Desktop server running (`npm start`)
- [ ] Phone connected to same WiFi as desktop
- [ ] Desktop firewall allows port 3000
- [ ] SERVER_IP in AnalyticsService updated to desktop's IP
- [ ] POIApp rebuilt and deployed

### Testing on Phone:
- [ ] App starts without crash
- [ ] Map loads POIs
- [ ] Tap POI → modal shows
- [ ] Check phone's Debug output (via Android Studio)
- [ ] Database shows customer visit after tapping

### Expected After 2-3 Taps:
```sql
SELECT COUNT(DISTINCT customer_id), SUM(visit_count) 
FROM customer_visited WHERE restaurant_id = 7;
-- Should show something like: 1-2 customers, 2-3 total visits
```

---

## 🆘 Troubleshooting

### **Issue: No logs appearing**
```
❌ No [Analytics] messages in OUTPUT
```
**Causes:**
1. OUTPUT window not open (View → Output)
2. Wrong debug configuration
3. App crashed silently

**Fix:**
```csharp
// Add this in MapPage constructor
Debug.WriteLine("[MapPage] Started - Analytics ready");
```

---

### **Issue: Network Error on Phone**
```
❌ [Analytics] ✗ Network Error: Unable to connect
```
**Causes:**
1. Phone not on same WiFi
2. Desktop IP wrong
3. Firewall blocking port 3000
4. Server not running

**Fix:**
```bash
# Verify server listening on port 3000
netstat -ano | findstr :3000

# Verify IP address
ipconfig

# Update AnalyticsService with correct IP
```

---

### **Issue: Database not Updated**
```
❌ SELECT * FROM customer_visited; → No rows
```
**Causes:**
1. HTTP request failing silently
2. customer_id/restaurant_id wrong
3. Database connection issue

**Fix:**
```sql
-- Check if endpoint is even being called
-- Add this to server.js temporarily
app.post('/api/customer-visits', async (req, res) => {
    console.log("[SERVER] POST received:", req.body);  // ← ADD THIS
    // ... rest of code
});
```

---

## ✨ Expected End-to-End Data Flow

```
┌─────────────────────────────────┐
│  POIApp (Mobile/Emulator)       │
│  - User taps POI marker         │
└──────────┬──────────────────────┘
           │
           ├─ MapPage.ShowDetail()
           │  ├─ POIDetailPanel.IsVisible = true  ← Show immediately
           │  └─ Task.Run(RecordPOIVisitAsync)    ← Background
           │
           ├─ RecordPOIVisitAsync()
           │  ├─ Get device_id from SecureStorage
           │  ├─ Hash → customer_id (e.g., 5000)
           │  └─ Call AnalyticsService.RecordVisitAsync()
           │
           ├─ HttpClient.PostAsync()
           │  ├─ URL: http://SERVER_IP:3000/api/customer-visits
           │  ├─ Body: {customer_id: 5000, restaurant_id: 7, listen_count: 0}
           │  └─ Response: {success: true}
           │
           ├─ Output: "[Analytics] ✓ Ghi nhận truy cập: customer=5000, restaurant=7"
           │
           v
┌─────────────────────────────────┐
│  Node.js Server                 │
│  - POST endpoint receives data  │
│  - Validates customer_id, restaurant_id
│  - Checks if (customer, restaurant) exists
│      ├─ If YES: UPDATE visit_count + 1
│      └─ If NO: INSERT new row
│  - Updates last_visited = NOW()
└──────────┬──────────────────────┘
           │
           v
┌─────────────────────────────────┐
│  MySQL Database                 │
│  customer_visited table         │
│  - Inserts or updates row       │
│  - visit_count incremented      │
│  - last_visited updated         │
└──────────┬──────────────────────┘
           │
           v
┌─────────────────────────────────┐
│  Web Admin Analytics.tsx        │
│  - GET /api/restaurants/7/visits/stats
│  - Displays: Visitors, Visits, Listens
└─────────────────────────────────┘
```

---

## ✅ Success Indicators

✅ **You're done when:**
1. App taps POI → POI details show immediately (UI not blocked)
2. Output shows: `[Analytics] ✓ Ghi nhận truy cập: customer=X, restaurant=Y`
3. Database has new row in customer_visited
4. Analytics page shows non-zero numbers
5. Repeat taps increment visit_count
6. Audio play increments audio_listen_count

---

## 📞 Still Not Working?

1. **Open OUTPUT window:** Debug → Windows → Output
2. **Look for [Analytics] messages** - paste them here
3. **Check server logs:** Node.js console should show POST requests
4. **Verify database:** `SELECT * FROM customer_visited;`
5. **Test endpoint manually:**
   ```bash
   curl -X POST http://localhost:3000/api/customer-visits \
     -H "Content-Type: application/json" \
     -d '{"customer_id":1,"restaurant_id":7,"listen_count":0}'
   ```

---

**Last Updated:** April 12, 2026  
**Status:** ✅ Ready for Testing - Device ID Fallback Enabled

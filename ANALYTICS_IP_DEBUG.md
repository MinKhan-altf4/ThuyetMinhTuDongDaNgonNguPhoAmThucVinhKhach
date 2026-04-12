# 🔍 Analytics Visit Recording - Debugging Guide

## ❌ Why No Visits Recorded

### Root Cause 1: IP Address Issue 🌐
**Problem:**
```csharp
// AnalyticsService.cs
await client.PostAsync("http://localhost:3000/api/customer-visits", content);
```
- `localhost:3000` works on **desktop only**
- Mobile/emulator can't reach desktop's localhost
- **Solution:** Use desktop's network IP instead

---

### Root Cause 2: SecureStorage Not Set 🔐
**Problem:**
```csharp
var userIdStr = await SecureStorage.GetAsync("user_id");
```
- If user hasn't logged in yet, `user_id` won't be in SecureStorage
- RecordPOIVisitAsync **exits early** without recording
- **Solution:** Set user_id when user logs in

---

### Root Cause 3: Network Timeout ⏱️
**Problem:**
- No timeout set on HttpClient
- On slow network, POST might timeout silently
- **Solution:** Add timeout configuration

---

## 🛠️ Fix Strategy

### Step 1️⃣: Get Desktop IP Address
```bash
# On your desktop/XAMPP server
ipconfig

# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.100  ← This is what mobile needs
```

### Step 2️⃣: Update AnalyticsService with IP Configuration

Create a configuration to use IP instead of localhost:

```csharp
public class AnalyticsService
{
    // ← ADD THIS: Configuration for server address
    private const string SERVER_IP = "192.168.1.100";  // CHANGE THIS
    private const int SERVER_PORT = 3000;
    private readonly string _analyticsUrl = $"http://{SERVER_IP}:{SERVER_PORT}/api/customer-visits";

    public async Task RecordVisitAsync(int customerId, int restaurantId, int listenCount = 0)
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            
            var response = await client.PostAsync(
                _analyticsUrl,  // ← USE CONFIGURED URL
                new StringContent(
                    System.Text.Json.JsonSerializer.Serialize(new {
                        customer_id = customerId,
                        restaurant_id = restaurantId,
                        listen_count = listenCount
                    }),
                    System.Text.Encoding.UTF8,
                    "application/json"
                )
            );

            if (response.IsSuccessStatusCode)
            {
                Debug.WriteLine($"[Analytics] ✓ Visit recorded: customer={customerId}, restaurant={restaurantId}");
            }
            else
            {
                Debug.WriteLine($"[Analytics] ✗ HTTP {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Analytics] ✗ Connection error: {ex.Message}");
        }
    }
}
```

### Step 3️⃣: Verify User ID is Set on Login

In your login logic (probably `LoginPage.xaml.cs` or wherever you handle login):

```csharp
// AFTER successful login
await SecureStorage.SetAsync("user_id", userId.ToString());  // ← ADD THIS
Debug.WriteLine($"[SecureStorage] User ID saved: {userId}");


// ON APP STARTUP - verify it's set
var savedUserId = await SecureStorage.GetAsync("user_id");
Debug.WriteLine($"[SecureStorage] User ID at startup: {savedUserId}");
```

### Step 4️⃣: Verify Visit Data is Recorded

**In Debug Output, look for:**
```
[Analytics] ✓ Ghi nhận truy cập: customer=X, restaurant=Y
```

If this shows, then data was sent successfully. Check database:
```bash
mysql -u root food_app -e "SELECT * FROM customer_visited WHERE restaurant_id = Y ORDER BY last_visited DESC LIMIT 1;"
```

---

## 🧪 Testing Checklist

### Before Testing:
- [ ] Desktop server running on port 3000
- [ ] POIApp built and deployed
- [ ] User is logged in (user_id in SecureStorage)
- [ ] Device/emulator connected to same WiFi as desktop
- [ ] Firewall allows port 3000

### Testing Steps:
1. **Open DevTools** (F5 in VS debug)
2. **Tap a POI** on map
3. **Check Output Window** for Analytics logs:
   ```
   [Analytics] ✓ Ghi nhận truy cập: customer=1, restaurant=7
   ```
   OR
   ```
   [Analytics] ✗ Lỗi ghi nhận truy cập: HttpRequestException - Unable to connect
   ```

4. **Check Database:**
   ```bash
   mysql -u root food_app -e "SELECT COUNT(*) FROM customer_visited;"
   ```
   Should increase by 1

### Expected Flow:
```
User taps POI
    ↓
ShowDetail(poi)
    ↓
_ = Task.Run(RecordPOIVisitAsync)  [BACKGROUND]
    │
    ├→ Check if POI ID valid ✓
    ├→ Get user_id from SecureStorage ✓
    ├→ POST to http://IP:3000/api/customer-visits
    │   ├→ JSON: {customer_id: 1, restaurant_id: 7, listen_count: 0}
    │   └→ Response: {success: true, message: "..."}
    └→ Log: "[Analytics] ✓ Visit recorded"
    ↓
[Server inserts into customer_visited table]
```

---

## 🔧 Quick Fix Code

Apply these changes:

### **AnalyticsService.cs**
```csharp
public class AnalyticsService
{
    // Configuration - CHANGE IP TO YOUR DESKTOP IP
    private const string SERVER_IP = "192.168.1.100";
    private const int SERVER_PORT = 3000;

    public async Task RecordVisitAsync(int customerId, int restaurantId, int listenCount = 0)
    {
        try
        {
            var url = $"http://{SERVER_IP}:{SERVER_PORT}/api/customer-visits";
            Debug.WriteLine($"[Analytics] Sending to: {url}");

            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            var payload = new { customer_id = customerId, restaurant_id = restaurantId, listen_count = listenCount };
            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await client.PostAsync(url, content);

            if (response.IsSuccessStatusCode)
                Debug.WriteLine($"[Analytics] ✓ Success (HTTP {response.StatusCode})");
            else
                Debug.WriteLine($"[Analytics] ✗ Failed: HTTP {response.StatusCode}");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Analytics] ✗ Error: {ex.GetType().Name}: {ex.Message}");
        }
    }
}
```

---

## 📊 Diagnostic Script

Run in MySQL to see all visits:
```sql
SELECT 
    r.name as restaurant,
    COUNT(DISTINCT cv.customer_id) as unique_customers,
    SUM(cv.visit_count) as total_visits,
    SUM(cv.audio_listen_count) as total_listens,
    MAX(cv.last_visited) as last_visit
FROM customer_visited cv
JOIN restaurant r ON cv.restaurant_id = r.restaurant_id
GROUP BY cv.restaurant_id
ORDER BY total_visits DESC;
```

---

## 🚀 Next Steps

1. **Find desktop IP:** `ipconfig` → IPv4 Address
2. **Update SERVER_IP** in AnalyticsService
3. **Ensure user_id** is set on login
4. **Rebuild POIApp** and deploy
5. **Tap POI** and check Output window
6. **Verify** in database

---

**Status:** ⚠️ Blocked by IP Address Configuration  
**Action:** Update SERVER_IP constant before testing

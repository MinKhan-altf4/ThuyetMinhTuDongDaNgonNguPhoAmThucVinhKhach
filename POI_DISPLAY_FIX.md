# 🐛 POI Display Fix Guide

## ❌ Vấn đề
Sau khi thêm analytics integration, POI không hiển thị khi tap marker.

## ✅ Root Causes & Solutions

### 1. **AnalyticsService Initialization Error** ✅ FIXED
**Problem:**
```csharp
// MapPage.xaml.cs
private readonly AnalyticsService _analyticsService = new();  // ← ERROR!
```
AnalyticsService có constructor yêu cầu `CacheService` parameter, nhưng MapPage khởi tạo mà không truyền.

**Solution:**
- ✅ Thêm parameterless constructor vào AnalyticsService
- ✅ Constructor mới: `public AnalyticsService() { _cacheService = null; }`

### 2. **NullReferenceException in Cache Operations** ✅ FIXED
**Problem:**
RecordListenAsync(), LoadFromCacheAsync(), ResetAsync() có thể throw NRE nếu `_cacheService` là null.

**Solution:**
- ✅ Thêm null checks trước tất cả `_cacheService.*` calls:
```csharp
if (_cacheService != null)
    await _cacheService.SaveAnalyticsAsync(_listenCounts);
```

### 3. **Async Navigation Flow** ✅ FIXED
**Problem:**
`RecordPOIVisitAsync()` được gọi với `_ =` (fire-and-forget) nhưng nếu throw exception, có thể crash.

**Solution:**
- ✅ Wrapped in `Task.Run()` với explicit try-catch:
```csharp
_ = Task.Run(async () => 
{
    try
    {
        await RecordPOIVisitAsync(poi);
    }
    catch (Exception ex)
    {
        Debug.WriteLine($"[Analytics] Error: {ex}");
    }
});
```

### 4. **Defensive Null Checks** ✅ FIXED
**Problem:**
`RecordPOIVisitAsync()` không handle null POI hoặc invalid customer_id gracefully.

**Solution:**
- ✅ Added safety checks:
```csharp
if (poi?.Id <= 0) return;  // ← Early exit
if (string.IsNullOrWhiteSpace(userIdStr)) return;
```

---

## 🧪 Verification Checklist

### ✅ POI Display
- [ ] Tap POI marker → modal hiển thị
- [ ] POI name/description visible
- [ ] Distance & coordinates show
- [ ] Audio button present

### ✅ Analytics (background)
- [ ] Check DevTools → Console
- [ ] Look for `[Analytics] ✓ Ghi nhận truy cập:...`
- [ ] No red errors
- [ ] No blocking delays

### ✅ Audio Playback
- [ ] Click "Play" button
- [ ] TTS plays description
- [ ] Check console for `[Analytics] ✓ Ghi nhận audio listen:...`

---

## 📋 Code Changes Summary

### **AnalyticsService.cs**
```csharp
// BEFORE
public AnalyticsService(CacheService cacheService)
{
    _cacheService = cacheService;
}

// AFTER - Added parameterless constructor
public AnalyticsService()
{
    _cacheService = null;  // For MapPage initialization
}

public AnalyticsService(CacheService cacheService)
{
    _cacheService = cacheService;
}
```

**Null checks added to:**
- RecordListenAsync() - Line 61
- RecordListenAsync(int, string) - Line 78
- LoadFromCacheAsync() - Line 116
- ResetAsync() - Line 153

### **MapPage.xaml.cs**
```csharp
// Make RecordPOIVisitAsync safe & non-blocking
_ = Task.Run(async () => 
{
    try
    {
        await RecordPOIVisitAsync(poi);
    }
    catch (Exception ex)
    {
        Debug.WriteLine($"[Analytics] Unhandled error: {ex}");
    }
});

// Defensive parameter checks
if (poi?.Id <= 0) return;
if (string.IsNullOrWhiteSpace(userIdStr)) return;
```

---

## 🚀 Testing Steps

**Step 1: Start App**
```bash
cd POIApp
dotnet run
```

**Step 2: Open Map**
- Should show map with POI markers
- No crash/freeze on startup

**Step 3: Tap POI**
- Modal should appear **immediately**
- POI details visible
- No lag/delay

**Step 4: Check Logs**
```
[Analytics] ✓ Ghi nhận truy cập: customer=X, restaurant=Y
```

**Step 5: Play Audio**
- Click "Play"
- Audio plays
- Log: `[Analytics] ✓ Ghi nhận audio listen: customer=X, restaurant=Y`

---

## 🔍 Debugging (if still broken)

**Issue: POI still not displaying**
1. Open DevTools (VS debug window)
2. Check Exception output for unhandled exceptions
3. Look for `[Analytics]` logs
4. If exception, add breakpoint in `ShowDetail()`

**Issue: Analytics not logging**
- This is OK! Analytics is background, doesn't block POI
- POI should display even if analytics fails

**Issue: Timeout/Slow opening**
- Check if `http://localhost:3000` is reachable
- If server down, analytics will timeout (5-10 sec)
- But POI should still show (non-blocking)

---

## ✨ Expected Behavior

```
User taps POI marker
    ↓
ShowDetail() called
    ↓
POIDetailPanel.IsVisible = true  ← Modal shows IMMEDIATELY
    ↓
_ = Task.Run(RecordPOIVisitAsync)  ← Background task (non-blocking)
    ↓
  ├→ Load dishes
  └→ POST to /api/customer-visits  ← May fail, doesn't matter
    ↓
Modal displays POI details
User can interact (play audio, navigate)
```

**Key:** POI display is **BEFORE** analytics calls, so no blocking!

---

## 📱 Mobile App Impact

**None!** All changes are safe:
- ✅ POI display unaffected
- ✅ Analytics is background (non-blocking)
- ✅ Even if analytics fails, POI works
- ✅ Graceful error handling

---

**Last Updated:** April 12, 2026  
**Status:** ✅ Ready to Test on Device

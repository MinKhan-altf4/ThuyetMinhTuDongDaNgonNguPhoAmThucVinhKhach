using System.Diagnostics;
using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Service Analytics - Đếm số lần nghe POI
/// Cực đơn giản, dùng Dictionary + Cache file
/// </summary>
public class AnalyticsService
{
    // =====================================================
    // BIẾN
    // =====================================================
    // Dictionary lưu số lần nghe: Key = POI ID, Value = số lần
    private Dictionary<int, int> _listenCounts = new();

    // Service cache để lưu/đọc
    private readonly CacheService _cacheService;

    // Tổng số lần nghe
    private int _totalListens = 0;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================
    public AnalyticsService(CacheService cacheService)
    {
        _cacheService = cacheService;
    }

    // ← THÊM MỚI: Parameterless constructor cho MapPage
    public AnalyticsService()
    {
        _cacheService = null;  // Không cần CacheService cho RecordVisitAsync
    }

    // =====================================================
    // ĐẾM: Mỗi khi user nghe POI
    // =====================================================
    /// <summary>
    /// Ghi nhận user đã nghe POI này
    /// </summary>
    /// <param name="poi">POI vừa nghe</param>
    public async Task RecordListenAsync(POI poi)
    {
        if (poi == null)
            return;

        // Tăng số lần
        if (!_listenCounts.ContainsKey(poi.Id))
        {
            _listenCounts[poi.Id] = 0;
        }
        _listenCounts[poi.Id]++;
        _totalListens++;

        Debug.WriteLine($"[Analytics] POI {poi.Id} ({poi.Name}): {_listenCounts[poi.Id]} lần nghe");

        // Lưu vào cache (nếu có)
        if (_cacheService != null)
            await _cacheService.SaveAnalyticsAsync(_listenCounts);
    }

    /// <summary>
    /// Ghi nhận user đã nghe POI (overload đơn giản)
    /// </summary>
    public async Task RecordListenAsync(int poiId, string poiName)
    {
        if (!_listenCounts.ContainsKey(poiId))
        {
            _listenCounts[poiId] = 0;
        }
        _listenCounts[poiId]++;
        _totalListens++;

        Debug.WriteLine($"[Analytics] POI {poiId} ({poiName}): {_listenCounts[poiId]} lần nghe");

        if (_cacheService != null)
            await _cacheService.SaveAnalyticsAsync(_listenCounts);
    }

    // =====================================================
    // LẤY SỐ LẦN NGHE
    // =====================================================
    /// <summary>
    /// Lấy số lần nghe của 1 POI
    /// </summary>
    public int GetListenCount(int poiId)
    {
        return _listenCounts.ContainsKey(poiId) ? _listenCounts[poiId] : 0;
    }

    /// <summary>
    /// Lấy tổng số lần nghe
    /// </summary>
    public int GetTotalListens()
    {
        return _totalListens;
    }

    /// <summary>
    /// Lấy tất cả số liệu
    /// </summary>
    public Dictionary<int, int> GetAllStats()
    {
        return new Dictionary<int, int>(_listenCounts);
    }

    // =====================================================
    // TẢI TỪ CACHE
    // =====================================================
    /// <summary>
    /// Tải dữ liệu analytics từ cache (gọi khi app khởi động)
    /// </summary>
    public async Task LoadFromCacheAsync()
    {
        if (_cacheService == null)
        {
            Debug.WriteLine("[Analytics] CacheService is null, skipping LoadFromCacheAsync");
            return;
        }
        _listenCounts = await _cacheService.GetAnalyticsAsync();
        _totalListens = _listenCounts.Values.Sum();
        Debug.WriteLine($"[Analytics] Đã tải {_listenCounts.Count} POI từ cache. Tổng: {_totalListens} lần nghe");
    }

    // =====================================================
    // TRẢ VỀ TEXT THỐNG KÊ (cho hiển thị)
    // =====================================================
    /// <summary>
    /// Tạo text thống kê để hiển thị
    /// </summary>
    public string GetStatsSummary()
    {
        if (_listenCounts.Count == 0)
            return "Chưa có dữ liệu";

        var lines = new List<string>
        {
            $"Tổng lần nghe: {_totalListens}",
            "---",
        };

        foreach (var kvp in _listenCounts.OrderByDescending(x => x.Value))
        {
            lines.Add($"POI #{kvp.Key}: {kvp.Value} lần");
        }

        return string.Join("\n", lines);
    }

    /// <summary>
    /// Reset tất cả thống kê
    /// </summary>
    public async Task ResetAsync()
    {
        _listenCounts.Clear();
        _totalListens = 0;
        if (_cacheService != null)
            await _cacheService.SaveAnalyticsAsync(_listenCounts);
        Debug.WriteLine("[Analytics] Đã reset tất cả thống kê");
    }

    // =====================================================
    // GỬI LÊN SERVER (Web Admin)
    // =====================================================
    /// <summary>
    /// Ghi lại lượt truy cập POI lên server (quán gián hàng)
    /// Được gọi khi user click POI trên map
    /// 
    /// ⚠️ IMPORTANT: Cần update SERVER_ADDRESS nếu chạy trên device!
    /// localhost:3000 chỉ hoạt động trên desktop
    /// Device cần dùng IP address của desktop, ví dụ: 192.168.1.100:3000
    /// </summary>
    public async Task RecordVisitAsync(int customerId, int restaurantId, int listenCount = 0)
    {
        try
        {
            // ← CONFIGURATION: Change this IP when running on mobile device
            string serverAddress = AppSettingsHelper.GetCustomerVisitServerUrl();
            Debug.WriteLine($"[Analytics] Using customer visit server: {serverAddress}");

            string url = $"{serverAddress.TrimEnd('/')}/api/customer-visits";
            
            Debug.WriteLine($"[Analytics] POST to: {url}");
            Debug.WriteLine($"[Analytics] Payload: customer={customerId}, restaurant={restaurantId}, listen={listenCount}");

            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
            var payload = new
            {
                customer_id = customerId,
                restaurant_id = restaurantId,
                listen_count = listenCount
            };

            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await client.PostAsync(url, content);

            if (response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync();
                Debug.WriteLine($"[Analytics] ✓ Success (HTTP {response.StatusCode})");
                Debug.WriteLine($"[Analytics] Response: {responseBody}");
            }
            else
            {
                Debug.WriteLine($"[Analytics] ✗ HTTP Error {response.StatusCode}");
                var errorBody = await response.Content.ReadAsStringAsync();
                Debug.WriteLine($"[Analytics] Error: {errorBody}");
            }
        }
        catch (HttpRequestException ex)
        {
            Debug.WriteLine($"[Analytics] ✗ Network Error: {ex.Message}");
            Debug.WriteLine($"[Analytics] ⚠️ Check: Is server running? Is firewall blocking port 3000?");
            Debug.WriteLine($"[Analytics] ⚠️ Mobile users: Update SERVER_ADDRESS to desktop IP (e.g., 192.168.1.100:3000)");
        }
        catch (TaskCanceledException ex)
        {
            Debug.WriteLine($"[Analytics] ✗ Timeout Error: {ex.Message}");
            Debug.WriteLine($"[Analytics] ⚠️ Server took too long to respond (timeout: 15s)");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Analytics] ✗ Unexpected Error ({ex.GetType().Name}): {ex.Message}");
        }
    }
}

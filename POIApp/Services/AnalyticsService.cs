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

        // Lưu vào cache
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
        await _cacheService.SaveAnalyticsAsync(_listenCounts);
        Debug.WriteLine("[Analytics] Đã reset tất cả thống kê");
    }
}

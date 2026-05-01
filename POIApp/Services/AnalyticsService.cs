using System.Diagnostics;
using System.Text;
using System.Text.Json;
using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Theo dõi analytics: số lần nghe POI, lượt truy cập quán, lượt mở app.
/// </summary>
public class AnalyticsService
{
    // ── Trạng thái ──────────────────────────────────────────────────
    private Dictionary<int, int> _listenCounts = new();
    private int _totalListens = 0;
    private readonly CacheService? _cache;

    // ── Constructor ─────────────────────────────────────────────────
    /// <summary>Dùng khi cần lưu cache (khởi tạo qua DI).</summary>
    public AnalyticsService(CacheService cacheService) => _cache = cacheService;

    /// <summary>Dùng khi không cần cache (MapPage, App.xaml.cs).</summary>
    public AnalyticsService() => _cache = null;

    // ── Nghe POI ────────────────────────────────────────────────────
    /// <summary>Ghi nhận một lần nghe POI.</summary>
    public async Task RecordListenAsync(POI poi)
    {
        if (poi is null) return;
        await RecordListenAsync(poi.Id, poi.Name);
    }

    /// <summary>Ghi nhận một lần nghe POI (overload dùng id + tên).</summary>
    public async Task RecordListenAsync(int poiId, string poiName)
    {
        _listenCounts.TryGetValue(poiId, out int current);
        _listenCounts[poiId] = current + 1;
        _totalListens++;

        Debug.WriteLine($"[Analytics] POI {poiId} ({poiName}): {_listenCounts[poiId]} lần nghe");

        if (_cache is not null)
            await _cache.SaveAnalyticsAsync(_listenCounts);
    }

    // ── Đọc thống kê local ──────────────────────────────────────────
    public int GetListenCount(int poiId)           => _listenCounts.GetValueOrDefault(poiId);
    public int GetTotalListens()                   => _totalListens;
    public Dictionary<int, int> GetAllStats()      => new(_listenCounts);

    public string GetStatsSummary()
    {
        if (_listenCounts.Count == 0) return "Chưa có dữ liệu";
        var lines = new List<string> { $"Tổng lần nghe: {_totalListens}", "---" };
        lines.AddRange(_listenCounts.OrderByDescending(x => x.Value).Select(x => $"POI #{x.Key}: {x.Value} lần"));
        return string.Join("\n", lines);
    }

    // ── Cache ───────────────────────────────────────────────────────
    /// <summary>Tải dữ liệu analytics từ cache khi app khởi động.</summary>
    public async Task LoadFromCacheAsync()
    {
        if (_cache is null) { Debug.WriteLine("[Analytics] Bỏ qua LoadFromCache (không có CacheService)"); return; }
        _listenCounts = await _cache.GetAnalyticsAsync();
        _totalListens = _listenCounts.Values.Sum();
        Debug.WriteLine($"[Analytics] Đã tải {_listenCounts.Count} POI từ cache — tổng {_totalListens} lần nghe");
    }

    public async Task ResetAsync()
    {
        _listenCounts.Clear();
        _totalListens = 0;
        if (_cache is not null) await _cache.SaveAnalyticsAsync(_listenCounts);
        Debug.WriteLine("[Analytics] Đã reset tất cả thống kê");
    }

    // ── Gửi lên server ──────────────────────────────────────────────
    /// <summary>
    /// Ghi lượt xem + nghe POI khi user tap quán trên map.
    /// ⚠️ Chạy trên thiết bị thật: cập nhật IP trong AppSettingsHelper thay vì localhost.
    /// </summary>
    // Đã loại bỏ các hàm gửi analytics lên server NodeJS (RecordVisitAsync, RecordAppOpenAsync) vì server online không hỗ trợ.

    // ── Nội bộ ──────────────────────────────────────────────────────
    // Đã loại bỏ hoàn toàn PostAsync vì không còn gửi analytics lên server NodeJS/localhost.
}
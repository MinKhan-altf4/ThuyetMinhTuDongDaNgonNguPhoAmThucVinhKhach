using System.Diagnostics;
using System.IO;
using System.Text.Json;
using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Service cache POI bằng file JSON local
/// KHÔNG cần SQLite, chỉ dùng file text
/// </summary>
public class CacheService
{
    // =====================================================
    // CẤU HÌNH
    // =====================================================
    // Thư mục lưu cache
    private readonly string _cacheFolder;

    // File cache POI
    private readonly string _poiCacheFile;

    // File cache analytics
    private readonly string _analyticsCacheFile;

    // File lưu tuỳ chọn người dùng (ngôn ngữ)
    private readonly string _preferencesCacheFile;

    // Thời gian cache hợp lệ (giờ)
    private readonly double _cacheExpiryHours;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================
    public CacheService(double cacheExpiryHours = 24)
    {
        _cacheExpiryHours = cacheExpiryHours;

        // Thư mục cache trong app
        _cacheFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "POICache"
        );

        _poiCacheFile = Path.Combine(_cacheFolder, "pois_cache.json");
        _analyticsCacheFile = Path.Combine(_cacheFolder, "analytics_cache.json");
        _preferencesCacheFile = Path.Combine(_cacheFolder, "preferences_cache.json");
        _preferencesCacheFile = Path.Combine(_cacheFolder, "preferences_cache.json");

        // Tạo thư mục nếu chưa có
        if (!Directory.Exists(_cacheFolder))
        {
            Directory.CreateDirectory(_cacheFolder);
            Debug.WriteLine($"[Cache] Tạo thư mục cache: {_cacheFolder}");
        }
    }

    // =====================================================
    // LƯU POI VÀO CACHE
    // =====================================================
    /// <summary>
    /// Lưu danh sách POI vào file cache
    /// </summary>
    public async Task SavePOICacheAsync(List<POI> pois)
    {
        try
        {
            var cacheData = new POICacheData
            {
                CachedAt = DateTime.Now,
                POIs = pois
            };

            var json = JsonSerializer.Serialize(cacheData, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            await File.WriteAllTextAsync(_poiCacheFile, json);
            Debug.WriteLine($"[Cache] Đã lưu {pois.Count} POI vào cache");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Cache] Lỗi lưu cache: {ex.Message}");
        }
    }

    // =====================================================
    // ĐỌC POI TỪ CACHE
    // =====================================================
    /// <summary>
    /// Đọc danh sách POI từ cache
    /// </summary>
    /// <returns>Danh sách POI, hoặc null nếu cache hết hạn/không tồn tại</returns>
    public async Task<List<POI>?> GetPOICacheAsync()
    {
        try
        {
            if (!File.Exists(_poiCacheFile))
            {
                Debug.WriteLine("[Cache] File cache POI không tồn tại");
                return null;
            }

            var json = await File.ReadAllTextAsync(_poiCacheFile);
            var cacheData = JsonSerializer.Deserialize<POICacheData>(json);

            if (cacheData == null || cacheData.POIs == null)
            {
                Debug.WriteLine("[Cache] Dữ liệu cache POI không hợp lệ");
                return null;
            }

            // Kiểm tra cache có còn hạn không
            var age = DateTime.Now - cacheData.CachedAt;
            if (age.TotalHours > _cacheExpiryHours)
            {
                Debug.WriteLine($"[Cache] Cache POI đã hết hạn ({age.TotalHours:F1} giờ)");
                return null;
            }

            Debug.WriteLine($"[Cache] Đọc {cacheData.POIs.Count} POI từ cache (tuổi: {age.TotalMinutes:F0} phút)");
            return cacheData.POIs;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Cache] Lỗi đọc cache: {ex.Message}");
            return null;
        }
    }

    // =====================================================
    // XÓA CACHE
    // =====================================================
    /// <summary>
    /// Xóa cache POI
    /// </summary>
    public void ClearPOICache()
    {
        try
        {
            if (File.Exists(_poiCacheFile))
            {
                File.Delete(_poiCacheFile);
                Debug.WriteLine("[Cache] Đã xóa cache POI");
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Cache] Lỗi xóa cache: {ex.Message}");
        }
    }

    // =====================================================
    // LƯU ANALYTICS
    // =====================================================
    /// <summary>
    /// Lưu số lần nghe POI vào cache
    /// </summary>
    public async Task SaveAnalyticsAsync(Dictionary<int, int> analytics)
    {
        try
        {
            var json = JsonSerializer.Serialize(analytics, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            await File.WriteAllTextAsync(_analyticsCacheFile, json);
            Debug.WriteLine($"[Cache] Đã lưu analytics: {analytics.Count} POI");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Cache] Lỗi lưu analytics: {ex.Message}");
        }
    }

    // =====================================================
    // ĐỌC ANALYTICS
    // =====================================================
    /// <summary>
    /// Đọc số lần nghe POI từ cache
    /// </summary>
    public async Task<Dictionary<int, int>> GetAnalyticsAsync()
    {
        try
        {
            if (!File.Exists(_analyticsCacheFile))
            {
                Debug.WriteLine("[Cache] File analytics không tồn tại, trả về rỗng");
                return new Dictionary<int, int>();
            }

            var json = await File.ReadAllTextAsync(_analyticsCacheFile);
            var analytics = JsonSerializer.Deserialize<Dictionary<int, int>>(json);

            Debug.WriteLine($"[Cache] Đọc analytics: {analytics?.Count ?? 0} POI");
            return analytics ?? new Dictionary<int, int>();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Cache] Lỗi đọc analytics: {ex.Message}");
            return new Dictionary<int, int>();
        }
    }

    public async Task SavePreferredLanguageAsync(string languageCode)
    {
        try
        {
            var preference = new UserPreferenceData
            {
                PreferredLanguageCode = languageCode,
                UpdatedAt = DateTime.Now
            };

            var json = JsonSerializer.Serialize(preference, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            await File.WriteAllTextAsync(_preferencesCacheFile, json);
            Debug.WriteLine($"[Cache] Đã lưu ngôn ngữ mặc định: {languageCode}");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Cache] Lỗi lưu language preference: {ex.Message}");
        }
    }

    public async Task<string?> GetPreferredLanguageAsync()
    {
        try
        {
            if (!File.Exists(_preferencesCacheFile))
            {
                return null;
            }

            var json = await File.ReadAllTextAsync(_preferencesCacheFile);
            var preference = JsonSerializer.Deserialize<UserPreferenceData>(json);
            return preference?.PreferredLanguageCode;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Cache] Lỗi đọc language preference: {ex.Message}");
            return null;
        }
    }
}

// =====================================================
// CLASS PHỤ: Lưu trữ dữ liệu cache
// =====================================================
internal class POICacheData
{
    public DateTime CachedAt { get; set; }
    public List<POI> POIs { get; set; } = new();
}

internal class UserPreferenceData
{
    public string PreferredLanguageCode { get; set; } = "vi";
    public DateTime UpdatedAt { get; set; }
}

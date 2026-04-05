using System.Diagnostics;
using System.Text.Json;
using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Service quản lý dữ liệu Offline - Lưu POI từ API vào local storage
/// </summary>
public class OfflineDataService
{
    private readonly string _offlineDataFolder;
    private readonly string _offlinePoisFile;

    public OfflineDataService()
    {
        _offlineDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "POIOfflineData"
        );

        _offlinePoisFile = Path.Combine(_offlineDataFolder, "pois_offline.json");

        // Tạo thư mục nếu chưa có
        if (!Directory.Exists(_offlineDataFolder))
        {
            Directory.CreateDirectory(_offlineDataFolder);
            Debug.WriteLine($"[Offline] Tạo thư mục dữ liệu offline: {_offlineDataFolder}");
        }
    }

    /// <summary>
    /// Lưu POI từ API vào offline storage
    /// </summary>
    public async Task SavePOIsOfflineAsync(List<POI> pois)
    {
        try
        {
            var json = JsonSerializer.Serialize(pois, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            await File.WriteAllTextAsync(_offlinePoisFile, json);
            AppSettingsHelper.SetOfflineDataAvailable(true);
            Debug.WriteLine($"[Offline] ✅ Đã lưu {pois.Count} POI vào offline storage");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Offline] ❌ Lỗi lưu offline: {ex.Message}");
        }
    }

    /// <summary>
    /// Tải POI từ offline storage
    /// </summary>
    public async Task<List<POI>?> LoadPOIsOfflineAsync()
    {
        try
        {
            if (!File.Exists(_offlinePoisFile))
            {
                Debug.WriteLine("[Offline] File dữ liệu offline không tồn tại");
                return null;
            }

            var json = await File.ReadAllTextAsync(_offlinePoisFile);
            var pois = JsonSerializer.Deserialize<List<POI>>(json);

            if (pois == null || pois.Count == 0)
            {
                Debug.WriteLine("[Offline] Dữ liệu offline rỗng");
                return null;
            }

            Debug.WriteLine($"[Offline] ✅ Tải {pois.Count} POI từ offline storage");
            return pois;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Offline] ❌ Lỗi tải offline: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Kiểm tra xem offline data có tồn tại không
    /// </summary>
    public bool HasOfflineData()
    {
        return File.Exists(_offlinePoisFile);
    }

    /// <summary>
    /// Xóa offline data
    /// </summary>
    public void ClearOfflineData()
    {
        try
        {
            if (File.Exists(_offlinePoisFile))
            {
                File.Delete(_offlinePoisFile);
                AppSettingsHelper.SetOfflineDataAvailable(false);
                Debug.WriteLine("[Offline] ✅ Đã xóa offline data");
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Offline] ❌ Lỗi xóa offline: {ex.Message}");
        }
    }
}

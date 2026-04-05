using System.Diagnostics;

namespace POIApp.Services;

/// <summary>
/// Service ánh xạ POI tên → Local audio resource
/// Audio files nằm trong Resources/Raw/audio/{lang}/
/// </summary>
public static class AudioResourceService
{
    /// <summary>
    /// Chuyển POI name → tên file audio (loại bỏ ký tự đặc biệt, thêm .mp3)
    /// Ví dụ: "Lâu Cá Kéo" → "lau_ca_keo"
    /// </summary>
    public static string NormalizeAudioFileName(string poiName)
    {
        if (string.IsNullOrWhiteSpace(poiName))
            return string.Empty;

        // Loại bỏ diacritics (dấu)
        var decomposed = poiName.Normalize(System.Text.NormalizationForm.FormD);
        var normalized = System.Text.RegularExpressions.Regex.Replace(
            decomposed,
            @"\p{Mn}",
            ""
        );

        // Chuyển thành lowercase
        normalized = normalized.ToLowerInvariant();

        // Thay thế space và ký tự đặc biệt bằng dấu gạch dưới
        normalized = System.Text.RegularExpressions.Regex.Replace(normalized, @"[^\w]", "_");

        // Loại bỏ dấu gạch dưới liên tiếp
        normalized = System.Text.RegularExpressions.Regex.Replace(normalized, @"_+", "_");

        // Loại bỏ dấu gạch dưới đầu/cuối
        normalized = normalized.Trim('_');

        return normalized;
    }

    /// <summary>
    /// Lấy full path của audio file từ Resources/Raw
    /// </summary>
    public static string GetAudioResourcePath(string poiName, string language)
    {
        var fileName = NormalizeAudioFileName(poiName);
        
        if (string.IsNullOrEmpty(fileName))
        {
            Debug.WriteLine($"[Audio] ❌ POI name không hợp lệ: {poiName}");
            return string.Empty;
        }

        // Ví dụ: "Resources/Raw/audio/vi/lau_ca_keo.mp3"
        var resourcePath = $"Resources/Raw/audio/{language}/{fileName}.mp3";
        Debug.WriteLine($"[Audio] 📁 Audio path: {resourcePath}");
        return resourcePath;
    }

    /// <summary>
    /// Kiểm tra audio file có tồn tại trong Resources/Raw không
    /// </summary>
    public static bool AudioFileExists(string poiName, string language)
    {
        try
        {
            var fileName = NormalizeAudioFileName(poiName);
            if (string.IsNullOrEmpty(fileName))
                return false;

            // Kiểm tra file tại Resources/Raw/audio/{lang}/
            var appPath = AppContext.BaseDirectory;
            var audioPath = Path.Combine(appPath, "Resources", "Raw", "audio", language, $"{fileName}.mp3");
            
            var exists = File.Exists(audioPath);
            Debug.WriteLine($"[Audio] File check ({language}/{fileName}): {(exists ? "✅ Tồn tại" : "❌ Không tồn tại")}");
            return exists;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Audio] ❌ Lỗi kiểm tra file: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Lấy stream audio từ resource
    /// </summary>
    public static async Task<Stream?> GetAudioStreamAsync(string poiName, string language)
    {
        try
        {
            var resourcePath = GetAudioResourcePath(poiName, language);
            if (string.IsNullOrEmpty(resourcePath))
                return null;

            // Sử dụng MAUI ResourceLoader
            var stream = await FileSystem.OpenAppPackageFileAsync(resourcePath);
            Debug.WriteLine($"[Audio] ✅ Tải audio stream: {resourcePath}");
            return stream;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Audio] ❌ Lỗi tải audio stream: {ex.Message}");
            return null;
        }
    }
}

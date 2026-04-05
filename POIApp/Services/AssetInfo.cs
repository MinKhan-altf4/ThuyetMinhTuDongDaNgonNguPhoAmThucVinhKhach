using System.Diagnostics;

namespace POIApp.Services;

/// <summary>
/// Hướng dẫn tổ chức file assets trong MAUI
/// =========================================
///
/// CẤU TRÚC THƯ MỤC (MAUI Convention)
///
/// 1. AUDIO OFFLINE — Đặt trong: Resources/Raw/audio/
///    Format: audio/{lang}/poi_{restaurant_id}.mp3
///    Ví dụ:
///      Resources/Raw/audio/vi/poi_1.mp3
///      Resources/Raw/audio/en/poi_1.mp3
///      Resources/Raw/audio/zh/poi_1.mp3
///      Resources/Raw/audio/jp/poi_1.mp3
///      Resources/Raw/audio/kr/poi_1.mp3
///
///    Cách truy cập trong code:
///      var path = $"audio/vi/poi_{poiId}.mp3";
///      await using var stream = await FileSystem.OpenAppPackageFileAsync(path);
///
///    Lưu ý: Đánh dấu file .mp3 là EmbeddedResource hoặc MauiAsset trong .csproj:
///      <MauiAsset Include="Resources\Raw\audio\**" />
///
/// 2. HÌNH ẢNH RESTAURANT/MÓN ĂN
///    Cách 1: Từ URL API (Khuyến nghị)
///      → API đã trả field image_url
///      → Dùng: ImageSource.FromUri(poi.ImageUrl)
///      → Không cần bundling, luôn up-to-date
///
///    Cách 2: Bundle local (placeholder/fallback)
///      → Đặt trong: Resources/Images/
///      → Ví dụ: Resources/Images/restaurants/placeholder.png
///      → Access: ImageSource.FromFile("restaurants_placeholder.png")
///
/// 3. CÁCH KIỂM TRA FILE TỒN TẠI TRONG APP BUNDLE
///    try {
///        await FileSystem.OpenAppPackageFileAsync("audio/vi/poi_1.mp3");
///        // file tồn tại
///    } catch {
///        // file không có
///    }
///
/// =========================================
/// CÁCH THÊM FILE VÀO PROJECT
/// =========================================
///
/// 1. Tạo thư mục Resources/Raw/audio/vi/
/// 2. Copy file .mp3 vào
/// 3. Trong Solution Explorer: Add Existing Item → chọn file
/// 4. Set Build Action:
///      .mp3, .json, .txt → MauiAsset
///      .png, .jpg        → MauiImage
/// 5. Hoặc thêm trực tiếp trong .csproj:
///    <MauiAsset Include="Resources\Raw\audio\**" />
///
/// =========================================
/// TẢI AUDIO TỪ SERVER (Fallback khi chưa bundling)
/// =========================================
///
/// Nếu file chưa bundling, tải từ server và lưu local:
///
/// var audioPath = Path.Combine(
///     FileSystem.AppDataDirectory,
///     $"audio_{poiId}_{lang}.mp3");
///
/// if (!File.Exists(audioPath)) {
///     var bytes = await _httpClient.GetByteArrayAsync($"/audio/{lang}/poi_{poiId}.mp3");
///     await File.WriteAllBytesAsync(audioPath, bytes);
/// }
///
/// </summary>
public static class AssetInfo
{
    /// <summary>
    /// Kiểm tra audio file có trong app bundle không
    /// </summary>
    public static async Task<bool> HasBundledAudioAsync(int poiId, string languageCode)
    {
        try
        {
            var path = $"audio/{languageCode}/poi_{poiId}.mp3";
            await FileSystem.OpenAppPackageFileAsync(path);
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Lấy đường dẫn file audio trong bundle
    /// </summary>
    public static string GetBundledAudioPath(int poiId, string languageCode)
    {
        return $"audio/{languageCode}/poi_{poiId}.mp3";
    }

    /// <summary>
    /// Danh sách ngôn ngữ audio được hỗ trợ
    /// </summary>
    public static readonly string[] SupportedAudioLanguages = ["vi", "en", "zh", "jp", "kr"];

    /// <summary>
    /// Thư mục lưu audio download về máy
    /// </summary>
    public static string GetLocalAudioFolder()
    {
        return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "POIAudio"
        );
    }
}

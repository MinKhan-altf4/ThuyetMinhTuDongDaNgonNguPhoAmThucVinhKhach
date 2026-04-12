using System.Diagnostics;
using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Service audio hybrid: Bundle + Server
/// 1. Cố gắng phát audio từ bundled files (offline)
/// 2. Nếu không tìm thấy, download từ server (online)
/// 3. Cache file downloaded vào local
/// </summary>
public sealed class AudioService
{
    private readonly object _lock = new();
    private bool _isPlaying = false;
    private readonly string _cacheDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "POIAudioCache");

#if ANDROID
    private Android.Media.MediaPlayer? _player;
#endif

    public AudioService()
    {
        if (!Directory.Exists(_cacheDir))
            Directory.CreateDirectory(_cacheDir);
    }

    /// <summary>
    /// Phát audio: thử bundled → thử cache local → download từ server
    /// </summary>
    public async Task PlayAsync(POI poi, string languageCode)
    {
        if (poi == null) return;

        if (!AudioPathHelper.IsSupportedLanguage(languageCode))
        {
            Debug.WriteLine($"[Audio] ❌ Unsupported language: {languageCode}");
            return;
        }

        Stop();

        // FIX 1: Bundled path dùng đúng naming convention từ AudioPathHelper
        // Pattern: audio/{lang}/poi{id}-{lang}.mp3  (vd: audio/vi/poi1-vi.mp3)
        var bundledPath = AudioPathHelper.GetAudioPath(languageCode, poi.Id);
        Debug.WriteLine($"[Audio] 📦 Thử bundled: {bundledPath}");

        if (await IsBundledFileExistsAsync(bundledPath))
        {
            Debug.WriteLine($"[Audio] ✅ Phát từ bundle");
            await PlayBundledAudioAsync(bundledPath);
            return;
        }

        // FIX 2: Thử cache local trước khi download
        // Cache key dùng restaurantId + languageCode + poiId để tránh trùng
        int restaurantId = poi.RestaurantId != 0 ? poi.RestaurantId : poi.Id;
        var cachedPath = GetCachedFilePath(restaurantId, languageCode, poi.Id);

        if (File.Exists(cachedPath))
        {
            Debug.WriteLine($"[Audio] ✅ Phát từ cache: {cachedPath}");
            await PlayFileAsync(cachedPath);
            return;
        }

        // Nếu không có cache → download từ server
        Debug.WriteLine($"[Audio] ⬇️ Bundled + cache không có, download từ server...");
        var downloadedPath = await DownloadAudioFromServerAsync(restaurantId, languageCode, poi.Id);
        if (downloadedPath != null)
        {
            await PlayFileAsync(downloadedPath);
            return;
        }

        Debug.WriteLine($"[Audio] ❌ Không tìm thấy audio ở bundle, cache và server");
    }

    /// <summary>
    /// Tạo cache file path nhất quán: {cacheDir}/{restaurantId}_{languageCode}_{poiId}.mp3
    /// Dùng poiId để phân biệt từng POI, tránh trùng khi restaurant có nhiều POI
    /// </summary>
    private string GetCachedFilePath(int restaurantId, string languageCode, int poiId)
        => Path.Combine(_cacheDir, $"{restaurantId}_{languageCode}_{poiId}.mp3");

    /// <summary>
    /// Download audio từ server theo restaurant_id + language_code
    /// Trả về cached file path hoặc null nếu lỗi
    /// </summary>
    private async Task<string?> DownloadAudioFromServerAsync(int restaurantId, string languageCode, int poiId)
    {
        try
        {
            string baseUrl = AppSettingsHelper.GetCustomerVisitServerUrl();
            Debug.WriteLine($"[Audio] 🌐 Server: {baseUrl}");

            // Query API lấy audio active của restaurant + ngôn ngữ
            var apiUrl = $"{baseUrl}/api/audio?restaurant_id={restaurantId}&language_code={languageCode}&is_active=1";
            Debug.WriteLine($"[Audio] 🔍 Query: {apiUrl}");

            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            var response = await client.GetAsync(apiUrl);

            if (!response.IsSuccessStatusCode)
            {
                Debug.WriteLine($"[Audio] ❌ API error: {response.StatusCode}");
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            Debug.WriteLine($"[Audio] 📋 Response: {json}");

            var audios = System.Text.Json.JsonSerializer.Deserialize<List<AudioItem>>(json);
            if (audios == null || audios.Count == 0)
            {
                Debug.WriteLine($"[Audio] ⚠️ Không có audio cho restaurant={restaurantId}, lang={languageCode}");
                return null;
            }

            var audio = audios[0];

            // FIX 3: URL download dùng đúng endpoint /offline-audio/{lang}/{fileName}
            // audio_url trong DB có dạng: "audio/vi/poi_1.mp3" hoặc "audio/vi/123-456-tenfile.mp3"
            // → tách lấy fileName từ audio_url, KHÔNG encode toàn bộ path
            var audioUrlPath = audio.audio_url?.Replace('\\', '/').TrimStart('/') ?? "";
            // audioUrlPath = "audio/vi/poi_1.mp3"
            // segments[0] = "audio", segments[1] = "vi", segments[2] = "poi_1.mp3"
            var segments = audioUrlPath.Split('/');

            string langSegment, fileSegment;
            if (segments.Length >= 3 && segments[0] == "audio")
            {
                // Đúng format: audio/{lang}/{file}
                langSegment = segments[1];
                fileSegment = segments[2];
            }
            else if (segments.Length >= 2)
            {
                // Fallback: {lang}/{file}
                langSegment = segments[0];
                fileSegment = segments[1];
            }
            else
            {
                // Không parse được, dùng languageCode + tên file cuối
                langSegment = languageCode;
                fileSegment = Path.GetFileName(audioUrlPath);
            }

            // Cache path cố định theo poiId (không dùng tên file server để tránh thay đổi)
            var cachedPath = GetCachedFilePath(restaurantId, languageCode, poiId);

            if (File.Exists(cachedPath))
            {
                Debug.WriteLine($"[Audio] ✅ Đã có cache: {cachedPath}");
                return cachedPath;
            }

            // Download: GET /offline-audio/{lang}/{fileName}
            var downloadUrl = $"{baseUrl}/offline-audio/{Uri.EscapeDataString(langSegment)}/{Uri.EscapeDataString(fileSegment)}";
            Debug.WriteLine($"[Audio] ⬇️ Download: {downloadUrl}");

            var fileResponse = await client.GetAsync(downloadUrl);
            if (!fileResponse.IsSuccessStatusCode)
            {
                Debug.WriteLine($"[Audio] ❌ Download failed: {fileResponse.StatusCode}");
                return null;
            }

            // Lưu vào cache
            var tempPath = cachedPath + ".tmp";
            await using (var fileStream = File.Create(tempPath))
                await fileResponse.Content.CopyToAsync(fileStream);

            // Rename atomic để tránh file bị hỏng nếu app crash giữa chừng
            if (File.Exists(cachedPath)) File.Delete(cachedPath);
            File.Move(tempPath, cachedPath);

            Debug.WriteLine($"[Audio] ✅ Cached: {cachedPath}");
            return cachedPath;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Audio] ❌ Download error: {ex.Message}");
            return null;
        }
    }

    private async Task<bool> IsBundledFileExistsAsync(string bundledPath)
    {
        try
        {
            await FileSystem.OpenAppPackageFileAsync(bundledPath);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task PlayBundledAudioAsync(string bundledPath)
    {
        string? localPath = null;
        try
        {
            var localDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "POIAudio");
            if (!Directory.Exists(localDir))
                Directory.CreateDirectory(localDir);

            localPath = Path.Combine(localDir, $"_play_{Guid.NewGuid():N}.mp3");

            await using (var src = await FileSystem.OpenAppPackageFileAsync(bundledPath))
            await using (var dst = File.Create(localPath))
                await src.CopyToAsync(dst);

            await PlayFileAsync(localPath);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Audio] ❌ Play bundled error: {ex.Message}");
        }
        finally
        {
            if (localPath != null)
            {
                _ = Task.Run(async () =>
                {
                    await Task.Delay(8000);
                    try { if (File.Exists(localPath)) File.Delete(localPath); } catch { }
                });
            }
        }
    }

    private Task PlayFileAsync(string path)
    {
#if ANDROID
        return Task.Run(() =>
        {
            lock (_lock)
            {
                try
                {
                    _isPlaying = true;
                    _player?.Release();
                    _player = new Android.Media.MediaPlayer();
                    _player.SetDataSource(path);
                    _player.Prepare();
                    _player.Start();
                    Debug.WriteLine($"[Audio] ▶️ Playing: {path}");
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"[Audio] ❌ Android MediaPlayer error: {ex.Message}");
                    _isPlaying = false;
                }
            }
        });
#else
        Debug.WriteLine($"[Audio] ℹ️ Non-Android platform, skip play");
        return Task.CompletedTask;
#endif
    }

    /// <summary>
    /// Dừng audio ngay lập tức
    /// </summary>
    public void Stop()
    {
        lock (_lock)
        {
            _isPlaying = false;
#if ANDROID
            try { _player?.Stop(); _player?.Release(); _player = null; }
            catch { }
#endif
        }
        Debug.WriteLine("[Audio] ⏹️ Stopped");
    }

    /// <summary>
    /// Clear toàn bộ cache audio đã download
    /// </summary>
    public void ClearCache()
    {
        try
        {
            if (Directory.Exists(_cacheDir))
                Directory.Delete(_cacheDir, true);
            Directory.CreateDirectory(_cacheDir);
            Debug.WriteLine("[Audio] 🗑️ Cache cleared");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Audio] ❌ Error clearing cache: {ex.Message}");
        }
    }

    /// <summary>Helper class cho deserialization API response</summary>
    private class AudioItem
    {
        public int audio_id { get; set; }
        public int restaurant_id { get; set; }
        public string audio_url { get; set; } = "";
        public int duration { get; set; }
        public int version { get; set; }
    }
}
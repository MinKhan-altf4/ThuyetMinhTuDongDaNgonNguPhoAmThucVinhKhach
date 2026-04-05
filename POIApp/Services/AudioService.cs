using System.Diagnostics;
using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Service audio offline — CHỈ phát file audio có sẵn.
/// KHÔNG dùng TTS, KHÔNG gọi API, KHÔNG generate audio.
/// Path: Resources/Raw/audio/{lang}/poi{id}-{lang}.mp3
/// </summary>
public sealed class AudioService
{
    private readonly object _lock = new();
    private bool _isPlaying = false;

#if ANDROID
    private Android.Media.MediaPlayer? _player;
#endif

    public AudioService() { }

    /// <summary>
    /// Phát audio offline theo ngôn ngữ.
    /// vi → audio/vi/poi{id}-vi.mp3
    /// en → audio/en/poi{id}-en.mp3
    /// Không tồn tại → log lỗi, không crash, không fallback.
    /// </summary>
    public async Task PlayAsync(POI poi, string languageCode)
    {
        if (poi == null) return;

        Stop(); // stop audio cũ trước khi phát mới

        var lang = languageCode == "vi" ? "vi" : "en";
        var bundledPath = $"audio/{lang}/poi{poi.Id}-{lang}.mp3";

        Debug.WriteLine($"[Audio] ▶ Play: {bundledPath}");

        if (!await IsBundledFileExistsAsync(bundledPath))
        {
            Debug.WriteLine($"[Audio] ❌ File not found: {bundledPath}");
            return;
        }

        await PlayBundledAudioAsync(bundledPath);
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
            Debug.WriteLine($"[Audio] ❌ Play error: {ex.Message}");
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
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"[Audio] Android error: {ex.Message}");
                    _isPlaying = false;
                }
            }
        });
#else
        return Task.CompletedTask;
#endif
    }

    /// <summary>
    /// Dừng audio ngay lập tức. Không chồng tiếng.
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
        Debug.WriteLine("[Audio] Stopped");
    }
}

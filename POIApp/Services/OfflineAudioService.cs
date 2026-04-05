using System.Diagnostics;
using System.Globalization;
using POIApp.Models;

#if ANDROID
using Android.Media;
#endif

#if IOS || MACCATALYST
using AVFoundation;
using Foundation;
#endif

#if WINDOWS
using Windows.Media.Core;
using Windows.Media.Playback;
#endif

namespace POIApp.Services;

public sealed class OfflineAudioService
{
    private readonly string _audioFolder;

#if ANDROID
    private MediaPlayer? _androidPlayer;
#endif

#if IOS || MACCATALYST
    private AVAudioPlayer? _iosPlayer;
#endif

#if WINDOWS
    private MediaPlayer? _windowsPlayer;
#endif

    public OfflineAudioService()
    {
        _audioFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "POIAudio");
        if (!Directory.Exists(_audioFolder))
        {
            Directory.CreateDirectory(_audioFolder);
        }
    }

    public async Task<AudioPlayResult> PlayAsync(POI poi, string languageCode)
    {
        try
        {
            var path = await ResolveAudioFileAsync(poi, languageCode);
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            {
                return new AudioPlayResult(false, "Audio offline chưa sẵn sàng cho ngôn ngữ này");
            }

            Stop();
            var started = PlayPlatform(path);
            return started
                ? new AudioPlayResult(true, "Đang phát audio offline")
                : new AudioPlayResult(false, "Thiết bị chưa hỗ trợ phát offline");
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[OfflineAudio] Lỗi phát: " + ex.Message);
            return new AudioPlayResult(false, "Không thể phát audio offline");
        }
    }

    public void Pause()
    {
#if ANDROID
        if (_androidPlayer?.IsPlaying == true)
        {
            _androidPlayer.Pause();
        }
#endif

#if IOS || MACCATALYST
        if (_iosPlayer?.Playing == true)
        {
            _iosPlayer.Pause();
        }
#endif

#if WINDOWS
        _windowsPlayer?.Pause();
#endif
    }

    public void Stop()
    {
#if ANDROID
        try
        {
            _androidPlayer?.Stop();
            _androidPlayer?.Release();
            _androidPlayer?.Dispose();
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[OfflineAudio] Android stop lỗi: " + ex.Message);
        }
        finally
        {
            _androidPlayer = null;
        }
#endif

#if IOS || MACCATALYST
        try
        {
            _iosPlayer?.Stop();
            _iosPlayer?.Dispose();
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[OfflineAudio] iOS stop lỗi: " + ex.Message);
        }
        finally
        {
            _iosPlayer = null;
        }
#endif

#if WINDOWS
        try
        {
            _windowsPlayer?.Pause();
            _windowsPlayer?.Dispose();
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[OfflineAudio] Windows stop lỗi: " + ex.Message);
        }
        finally
        {
            _windowsPlayer = null;
        }
#endif
    }

    private bool PlayPlatform(string path)
    {
#if ANDROID
        _androidPlayer = new MediaPlayer();
        _androidPlayer.SetDataSource(path);
        _androidPlayer.Prepare();
        _androidPlayer.Start();
        return true;
#elif IOS || MACCATALYST
        var url = NSUrl.FromFilename(path);
        _iosPlayer = AVAudioPlayer.FromUrl(url);
        if (_iosPlayer == null)
        {
            return false;
        }

        _iosPlayer.PrepareToPlay();
        _iosPlayer.Play();
        return true;
#elif WINDOWS
        _windowsPlayer = new MediaPlayer();
        _windowsPlayer.Source = MediaSource.CreateFromUri(new Uri(path));
        _windowsPlayer.Play();
        return true;
#else
        return false;
#endif
    }

    private async Task<string?> ResolveAudioFileAsync(POI poi, string languageCode)
    {
        // Tiếng Việt → ưu tiên local offline trước server
        if (languageCode.Equals("vi", StringComparison.OrdinalIgnoreCase))
        {
            var bundledName = $"audio/vi/poi_{poi.Id}_vi.mp3";
            if (await IsBundledFileExistsAsync(bundledName))
            {
                return await CopyBundledToLocalAsync(poi.Id, bundledName);
            }
        }

        // Tiếng Anh → dùng local nếu có
        if (languageCode.Equals("en", StringComparison.OrdinalIgnoreCase))
        {
            var bundledName = $"audio/en/poi_{poi.Id}.mp3";
            if (await IsBundledFileExistsAsync(bundledName))
            {
                return await CopyBundledToLocalAsync(poi.Id, bundledName);
            }
        }

        // Ngôn ngữ khác hoặc local không có → trả null (dùng TTS)
        return null;
    }

    private async Task<string?> PersistBase64AudioAsync(int poiId, string base64)
    {
        try
        {
            var bytes = Convert.FromBase64String(base64);
            var path = Path.Combine(_audioFolder, $"poi_{poiId}_{DateTime.UtcNow.Ticks.ToString(CultureInfo.InvariantCulture)}.mp3");
            await File.WriteAllBytesAsync(path, bytes);
            return path;
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[OfflineAudio] Lỗi ghi base64: " + ex.Message);
            return null;
        }
    }

    private static async Task<bool> IsBundledFileExistsAsync(string bundledPath)
    {
        try
        {
            await using var _ = await FileSystem.OpenAppPackageFileAsync(bundledPath);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task<string?> CopyBundledToLocalAsync(int poiId, string bundledPath)
    {
        try
        {
            var destination = Path.Combine(_audioFolder, $"poi_{poiId}_bundled.mp3");
            if (File.Exists(destination))
            {
                return destination;
            }

            await using var source = await FileSystem.OpenAppPackageFileAsync(bundledPath);
            await using var target = File.Create(destination);
            await source.CopyToAsync(target);
            return destination;
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[OfflineAudio] Lỗi copy bundled audio: " + ex.Message);
            return null;
        }
    }
}

public sealed record AudioPlayResult(bool Success, string Message);

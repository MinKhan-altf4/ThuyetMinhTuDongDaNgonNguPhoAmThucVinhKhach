using System.Diagnostics;

namespace POIApp.Services;

/// <summary>
/// Service Text To Speech - Hỗ trợ đa ngôn ngữ (vi/zh/jp/kr)
/// </summary>
public class TTSService
{
    private CancellationTokenSource? _cts;

    public TTSService()
    {
    }

    /// <summary>
    /// Phát giọng nói từ text
    /// </summary>
    public async Task SpeakAsync(string text, string languageCode = "vi")
    {
        if (string.IsNullOrWhiteSpace(text))
            return;

        // Cancel speech trước đó nếu đang phát
        _cts?.Cancel();
        _cts = new CancellationTokenSource();

        try
        {
            var locales = await TextToSpeech.GetLocalesAsync();

            // Tìm locale theo language code
            Locale? targetLocale = locales.FirstOrDefault(l =>
                l.Language.Contains(languageCode, StringComparison.OrdinalIgnoreCase));

            var options = new SpeechOptions();
            if (targetLocale != null)
            {
                options.Locale = targetLocale;
            }

            await TextToSpeech.SpeakAsync(text, options, _cts.Token);
            Debug.WriteLine($"[TTS] Đã phát ({languageCode}): {text}");
        }
        catch (OperationCanceledException)
        {
            Debug.WriteLine("[TTS] Đã hủy");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[TTS] Lỗi: {ex.Message}");
        }
    }

    /// <summary>
    /// Dừng phát giọng nói
    /// </summary>
    public void Stop()
    {
        try
        {
            _cts?.Cancel();
            Debug.WriteLine("[TTS] Đã dừng");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[TTS] Lỗi Stop: {ex.Message}");
        }
    }
}

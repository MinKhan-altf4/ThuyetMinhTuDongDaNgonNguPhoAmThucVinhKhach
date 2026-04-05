using System.Diagnostics;

namespace POIApp.Services;

/// <summary>
/// TTS Service — KHÔNG crash, load locale 1 lần duy nhất khi app start.
/// TUYỆT ĐỐI: không tạo locale thủ công bằng new Locale(...).
/// TUYỆT ĐỐI: không load lại danh sách locale nhiều lần.
/// </summary>
public sealed class TTSService
{
    private CancellationTokenSource? _cts;

    // ── Cache locale 1 lần duy nhất ──
    private static IReadOnlyList<Locale>? _cachedLocales;
    private static readonly object _lock = new();

    public TTSService() { }

    /// <summary>
    /// Load danh sách locale 1 lần duy nhất. Gọi ở App.OnStart().
    /// </summary>
    public static async Task PreloadLocalesAsync()
    {
        if (_cachedLocales != null) return;

        lock (_lock)
        {
            if (_cachedLocales != null) return;
            Debug.WriteLine("[TTS] Đang load locale...");
        }

        try
        {
            var locales = await TextToSpeech.GetLocalesAsync();
            var list = locales.ToList();
            lock (_lock)
            {
                _cachedLocales = list;
            }
            Debug.WriteLine($"[TTS] Đã load {list.Count} locale.");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[TTS] Lỗi load locale: {ex.Message}");
            lock (_lock)
            {
                _cachedLocales = Array.Empty<Locale>();
            }
        }
    }

    /// <summary>
    /// Tìm locale hợp lệ theo language code.
    /// Fallback: locale bắt đầu bằng "en".
    /// TUYỆT ĐỐI: không tạo locale bằng new Locale(...).
    /// </summary>
    private Locale? FindLocale(string languageCode)
    {
        var locales = _cachedLocales;
        if (locales == null || locales.Count == 0)
        {
            Debug.WriteLine("[TTS] ⚠️ Chưa load locale — fallback en");
            return locales?.FirstOrDefault(l => l.Language.StartsWith("en", StringComparison.OrdinalIgnoreCase));
        }

        // Tìm locale khớp language code
        Locale? found = locales.FirstOrDefault(l =>
            l.Language.StartsWith(languageCode, StringComparison.OrdinalIgnoreCase));

        if (found != null)
        {
            Debug.WriteLine($"[TTS] Locale: {found.Language}/{found.Country} ({languageCode})");
            return found;
        }

        // Fallback: tiếng Anh
        var enLocale = locales.FirstOrDefault(l =>
            l.Language.StartsWith("en", StringComparison.OrdinalIgnoreCase));

        Debug.WriteLine($"[TTS] ⚠️ Không tìm thấy locale '{languageCode}' → fallback en: {enLocale?.Language}/{enLocale?.Country}");
        return enLocale;
    }

    /// <summary>
    /// Phát giọng nói từ text.
    /// </summary>
    public async Task SpeakAsync(string text, string languageCode = "vi")
    {
        if (string.IsNullOrWhiteSpace(text))
            return;

        _cts?.Cancel();
        _cts = new CancellationTokenSource();

        try
        {
            var locale = FindLocale(languageCode);
            var options = new SpeechOptions();

            if (locale != null)
                options.Locale = locale;

            Debug.WriteLine($"[TTS] text={text} | lang={languageCode} | locale={locale?.Language ?? "null"}");

            await TextToSpeech.Default.SpeakAsync(text, options, _cts.Token);
            Debug.WriteLine($"[TTS] ✅ Đã phát: {text}");
        }
        catch (OperationCanceledException)
        {
            Debug.WriteLine("[TTS] Đã hủy");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[TTS] ❌ Lỗi: {ex.Message}");
        }
    }

    /// <summary>
    /// Dừng phát giọng nói.
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

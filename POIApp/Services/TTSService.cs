using System.Diagnostics;

namespace POIApp.Services;

/// <summary>
/// Service Text To Speech - Dùng TTS mặc định của Android
/// </summary>
public class TTSService
{
    public TTSService()
    {
    }

    /// <summary>
    /// Phát giọng nói từ text
    /// </summary>
    public async Task SpeakAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return;

        try
        {
            // =====================================================
            // CẤU HÌNH NGÔN NGỮ - Tiếng Việt
            // =====================================================
            var locales = await TextToSpeech.GetLocalesAsync();

            // Tìm locale tiếng Việt
            Locale? vietnameseLocale = locales.FirstOrDefault(l =>
                l.Language.Contains("vi", StringComparison.OrdinalIgnoreCase));

            // Tạo SpeechOptions
            var options = new SpeechOptions();

            if (vietnameseLocale != null)
            {
                options.Locale = vietnameseLocale;
            }

            // =====================================================
            // PHÁT GIỌNG NÓI
            // =====================================================
            await TextToSpeech.SpeakAsync(text, options);

            Debug.WriteLine($"[TTS] Đã phát: {text}");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[TTS] Lỗi: {ex.Message}");
        }
    }
}

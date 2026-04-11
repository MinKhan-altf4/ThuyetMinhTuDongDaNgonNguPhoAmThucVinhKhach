using System.Diagnostics;
using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// TTS Service — KHÔNG crash, load locale 1 lần duy nhất khi app start.
/// TUYỆT ĐỐI: không tạo locale thủ công bằng new Locale(...).
/// TUYỆT ĐỐI: không load lại danh sách locale nhiều lần.
/// </summary>
public sealed class TTSService
{
    private CancellationTokenSource? _cts;           // ← Cho TTS description nhà hàng
    private CancellationTokenSource? _menuCts;       // ← Cho TTS menu món ăn (THÊM MỚI)

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

    /// <summary>
    /// Phát thuyết minh menu món ăn — TTS RIÊNG KHÔNG ĐỤNG TTS DESCRIPTION NHẬP HÀNG.
    /// Format: "Món {name}. Mô tả: {description}. Giá: {price} đồng."
    /// THÊM MỚI: Sử dụng _menuCts riêng biệt để độc lập với TTS description.
    /// </summary>
    public async Task SpeakMenuAsync(List<Models.Dish> dishes, string languageCode = "vi")
    {
        if (dishes == null || dishes.Count == 0)
        {
            Debug.WriteLine("[TTS-MENU] ⚠️ Danh sách mon ăn rỗng → không phát");
            return;
        }

        // Dừng TTS menu cũ (nếu đang phát)
        _menuCts?.Cancel();
        _menuCts = new CancellationTokenSource();

        try
        {
            Debug.WriteLine($"[TTS-MENU] Bắt đầu phát menu {dishes.Count} món | lang={languageCode}");

            // Phát lần lượt từng món ăn
            for (int i = 0; i < dishes.Count; i++)
            {
                var dish = dishes[i];
                
                // Format: "Món {name}. Mô tả: {description}. Giá: {price} đồng."
                string dishText = $"Món {dish.Name}";
                if (!string.IsNullOrWhiteSpace(dish.Description))
                    dishText += $". Mô tả: {dish.Description}";
                dishText += $". Giá: {(long)dish.Price:N0} đồng.";

                Debug.WriteLine($"[TTS-MENU] [{i + 1}/{dishes.Count}] {dishText}");

                // Phát từng món
                await SpeakMenuItemAsync(dishText, languageCode, _menuCts.Token);
                
                // Delay 500ms giữa các items để TTS kịp phát
                if (i < dishes.Count - 1)
                    await Task.Delay(500, _menuCts.Token);
            }

            Debug.WriteLine("[TTS-MENU] ✅ Phát xong toàn bộ menu");
        }
        catch (OperationCanceledException)
        {
            Debug.WriteLine("[TTS-MENU] Đã dừng phát menu");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[TTS-MENU] ❌ Lỗi: {ex.GetType().Name} - {ex.Message}");
        }
    }

    /// <summary>
    /// Phát từng item trong menu (helper để SpeakMenuAsync).
    /// </summary>
    private async Task SpeakMenuItemAsync(string text, string languageCode, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(text))
            return;

        try
        {
            var locale = FindLocale(languageCode);
            var options = new SpeechOptions();

            if (locale != null)
                options.Locale = locale;

            Debug.WriteLine($"[TTS-MENU] 🔊 Phát ({locale?.Language ?? "default"}): {text.Substring(0, Math.Min(50, text.Length))}...");

            await TextToSpeech.Default.SpeakAsync(text, options, cancellationToken);
            Debug.WriteLine($"[TTS-MENU] ✅ Phát xong: {text.Substring(0, Math.Min(40, text.Length))}...");
        }
        catch (OperationCanceledException)
        {
            // Bình thường khi user bấm stop
            Debug.WriteLine("[TTS-MENU] Item bị hủy");
            throw;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[TTS-MENU] ❌ Lỗi phát item: {ex.GetType().Name} - {ex.Message}");
            throw;  // ← Rethrow để SpeakMenuAsync biết có lỗi
        }
    }

    /// <summary>
    /// Dừng phát menu (TTS MENU).
    /// THÊM MỚI: Riêng biệt với Stop() để không ảnh hưởng TTS description.
    /// </summary>
    public void StopMenu()
    {
        try
        {
            _menuCts?.Cancel();
            Debug.WriteLine("[TTS-MENU] Đã dừng menu TTS");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[TTS-MENU] Lỗi StopMenu: {ex.Message}");
        }
    }
}

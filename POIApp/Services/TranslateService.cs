using System.Diagnostics;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace POIApp.Services;

/// <summary>
/// Dịch text sang ngôn ngữ đích qua MyMemory API (miễn phí, không giới hạn).
/// Cache kết quả để tránh gọi lại nhiều lần.
/// Fallback: dùng text gốc tiếng Việt.
/// </summary>
public sealed class TranslateService
{
    private static TranslateService? _instance;
    public static TranslateService Instance => _instance ??= new TranslateService();

    // Key = $"{sourceText}_{targetLang}", Value = translatedText
    private readonly Dictionary<string, string> _cache = new();
    private readonly HttpClient _http;

    // MyMemory API — miễn phí, không rate limit
    private const string ApiBase = "https://api.mymemory.translated.net/get";

    private TranslateService()
    {
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
    }

    /// <summary>
    /// Dịch text tiếng Việt sang ngôn ngữ đích.
    /// Kết quả được cache theo "text_lang".
    /// </summary>
    public async Task<string> TranslateAsync(string text, string targetLang)
    {
        if (string.IsNullOrWhiteSpace(text) || targetLang == "vi")
            return text;

        var cacheKey = $"{text}_{targetLang}";
        if (_cache.TryGetValue(cacheKey, out var cached))
        {
            Debug.WriteLine($"[Translate] Cache hit: '{text}' → {targetLang}");
            return cached;
        }

        var translated = await TranslateViaApiAsync(text, targetLang);
        if (!string.IsNullOrWhiteSpace(translated))
        {
            _cache[cacheKey] = translated;
            Debug.WriteLine($"[Translate] ✅ '{text}' → '{translated}' ({targetLang})");
            return translated;
        }

        // Fallback: trả text gốc tiếng Việt
        Debug.WriteLine($"[Translate] ⚠️ Lỗi → dùng originalText");
        return text;
    }

    private async Task<string?> TranslateViaApiAsync(string text, string targetLang)
    {
        try
        {
            // MyMemory dùng langpair: source|target
            var langPair = $"vi|{targetLang}";
            var url = $"{ApiBase}?q={Uri.EscapeDataString(text)}&langpair={langPair}";

            var response = await _http.GetStringAsync(url);

            // Response: { "responseData": { "translatedText": "..." }, "responseStatus": 200 }
            using var doc = JsonDocument.Parse(response);
            var root = doc.RootElement;

            var status = root.TryGetProperty("responseStatus", out var s)
                ? s.GetInt32()
                : 0;

            if (status == 200 &&
                root.TryGetProperty("responseData", out var rd) &&
                rd.TryGetProperty("translatedText", out var tt))
            {
                var result = tt.GetString();
                // MyMemory bọc text gốc trong <span class="notranslate"> → strip HTML tags
                if (!string.IsNullOrWhiteSpace(result))
                    result = Regex.Replace(result, "<[^>]+>", "").Trim();

                return result;
            }

            Debug.WriteLine($"[Translate] MyMemory status={status}");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Translate] Lỗi: {ex.Message}");
        }

        return null;
    }

    /// <summary>
    /// Xóa cache — gọi khi cần reset translation.
    /// </summary>
    public void ClearCache() => _cache.Clear();
}

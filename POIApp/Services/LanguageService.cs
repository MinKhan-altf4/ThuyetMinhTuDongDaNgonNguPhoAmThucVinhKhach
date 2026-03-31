using System.Diagnostics;
using System.Globalization;
using System.Reflection;
using System.Text.Json;

namespace POIApp.Services;

/// <summary>
/// i18n Service — loads translations from bundled JSON files.
/// Lazy-loads only the needed language to minimize startup time.
/// </summary>
public sealed class LanguageService
{
    private const string LangVi = "vi";
    private const string LangEn = "en";
    private const string LangZh = "zh";
    private const string LangJp = "jp";
    private const string LangKr = "kr";

    public static readonly IReadOnlyList<LanguageOption> SupportedLanguages =
    [
        new LanguageOption(LangVi, "Tiếng Việt", "🇻🇳"),
        new LanguageOption(LangEn, "English", "🇺🇸"),
        new LanguageOption(LangZh, "中文", "🇨🇳"),
        new LanguageOption(LangJp, "日本語", "🇯🇵"),
        new LanguageOption(LangKr, "한국어", "🇰🇷"),
    ];

    private readonly CacheService _cacheService;
    private readonly Dictionary<string, string> _strings = new();
    private string _currentLang = LangVi;
    private bool _isLoaded = false;

    // Static shared instance — easy access from any page
    private static LanguageService? _shared;
    public static LanguageService Shared => _shared ??= new LanguageService(new CacheService());

    public LanguageService(CacheService cacheService)
    {
        _cacheService = cacheService;
    }

    public string CurrentLanguage => _currentLang;

    public event EventHandler? LanguageChanged;

    /// <summary>
    /// Resolve default language:
    /// 1. Saved preference → 2. Device locale → 3. Geo fallback (VN → vi, else en)
    /// </summary>
    public async Task<string> ResolveDefaultLanguageAsync(double? userLat = null, double? userLon = null)
    {
        var saved = await _cacheService.GetPreferredLanguageAsync();
        if (!string.IsNullOrWhiteSpace(saved) && SupportedLanguages.Any(l => l.Code == saved))
            return saved;

        var locale = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.ToLowerInvariant();
        if (SupportedLanguages.Any(l => l.Code == locale))
            return locale;

        // Geo fallback: inside Vietnam bounds
        if (userLat is >= 8 and <= 24 && userLon is >= 102 and <= 110)
            return LangVi;

        return LangEn;
    }

    /// <summary>
    /// Initialize service — loads strings for the given language.
    /// Call once on app startup.
    /// </summary>
    public async Task InitializeAsync(string? languageCode = null)
    {
        if (languageCode == null)
            languageCode = await ResolveDefaultLanguageAsync();

        await SetLanguageAsync(languageCode);
    }

    /// <summary>
    /// Change current language. Persists to cache.
    /// </summary>
    public async Task SetLanguageAsync(string languageCode)
    {
        if (_currentLang == languageCode && _isLoaded)
            return;

        _currentLang = languageCode;
        await _cacheService.SavePreferredLanguageAsync(languageCode);
        await LoadStringsAsync(languageCode);
        LanguageChanged?.Invoke(this, EventArgs.Empty);
    }

    /// <summary>
    /// Get translated string. Falls back to key if not found.
    /// </summary>
    public string this[string key] => Get(key);

    public string Get(string key)
    {
        if (!_isLoaded)
        {
            Debug.WriteLine($"[LanguageService] WARN: strings not loaded yet, key='{key}'");
            return key;
        }

        return _strings.TryGetValue(key, out var value) ? value : key;
    }

    /// <summary>
    /// Get translation with format arguments, e.g. Get("greeting", "Alice")
    /// </summary>
    public string Getf(string key, params object[] args)
    {
        var template = Get(key);
        try
        {
            return string.Format(template, args);
        }
        catch
        {
            return template;
        }
    }

    /// <summary>
    /// Returns true if the language has been loaded.
    /// </summary>
    public bool IsLoaded => _isLoaded;

    private async Task LoadStringsAsync(string languageCode)
    {
        try
        {
            // Try embedded resource first
            var assembly = Assembly.GetExecutingAssembly();
            var resourceName = $"POIApp.Resources.i18n.{languageCode}.json";

            var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream != null)
            {
                using (stream)
                {
                    var json = await new StreamReader(stream).ReadToEndAsync();
                    _strings.Clear();
                    var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                    if (dict != null)
                        foreach (var kvp in dict)
                            _strings[kvp.Key] = kvp.Value;
                }
                _isLoaded = true;
                Debug.WriteLine($"[LanguageService] Loaded embedded: {languageCode}");
                return;
            }

            // Fallback: try file system (for hot-reload / dev)
            var localPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                $"POIApp/i18n/{languageCode}.json"
            );

            if (File.Exists(localPath))
            {
                var json = await File.ReadAllTextAsync(localPath);
                _strings.Clear();
                var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                if (dict != null)
                    foreach (var kvp in dict)
                        _strings[kvp.Key] = kvp.Value;

                _isLoaded = true;
                Debug.WriteLine($"[LanguageService] Loaded from file: {localPath}");
                return;
            }

            Debug.WriteLine($"[LanguageService] ERROR: could not load {languageCode}");
            _isLoaded = false;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[LanguageService] Error loading {languageCode}: {ex.Message}");
            _isLoaded = false;
        }
    }
}

public record LanguageOption(string Code, string DisplayName, string Flag)
{
    public string Label => $"{Flag} {DisplayName}";
}

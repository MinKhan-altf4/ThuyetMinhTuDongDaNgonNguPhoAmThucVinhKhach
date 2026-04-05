using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.Reflection;
using System.Text.Json;

namespace POIApp.Services;

/// <summary>
/// Service ngôn ngữ — chỉ hỗ trợ vi, en.
/// Dùng file JSON embedded: Resources/i18n/vi.json, en.json
/// Load 1 lần, cache, notify UI khi đổi ngôn ngữ.
/// </summary>
public sealed class LanguageService : INotifyPropertyChanged
{
    public const string LangVi = "vi";
    public const string LangEn = "en";

    public static readonly IReadOnlyList<LanguageOption> SupportedLanguages =
    [
        new LanguageOption(LangVi, "Tiếng Việt", "🇻🇳"),
        new LanguageOption(LangEn, "English", "🇺🇸"),
    ];

    private static LanguageService? _instance;
    public static LanguageService Instance => _instance ??= new LanguageService();

    public event EventHandler? LanguageChanged;
    public event PropertyChangedEventHandler? PropertyChanged;

    private readonly Dictionary<string, string> _strings = new();
    private string _currentLang = LangVi;
    private bool _isLoaded = false;

    public string CurrentLanguage => _currentLang;
    public bool IsLoaded => _isLoaded;

    private LanguageService() { }

    /// <summary>
    /// Initialize — gọi 1 lần trong App.OnStart().
    /// KHÔNG chạy logic phức tạp ở đây.
    /// </summary>
    public async Task InitializeAsync()
    {
        // Load saved language hoặc fallback
        string code = LangVi;
        try
        {
            var saved = Preferences.Get("AppLanguage", "");
            if (!string.IsNullOrWhiteSpace(saved) && SupportedLanguages.Any(l => l.Code == saved))
                code = saved;
        }
        catch { }
        await SetLanguageAsync(code);
    }

    /// <summary>
    /// Đổi ngôn ngữ. Notify UI, KHÔNG reload navigation.
    /// </summary>
    public async Task SetLanguageAsync(string languageCode)
    {
        if (_currentLang == languageCode && _isLoaded)
            return;

        // Normalize legacy codes
        languageCode = languageCode.ToLowerInvariant() switch
        {
            "jp" or "kr" => LangVi,
            _ => SupportedLanguages.Any(l => l.Code == languageCode) ? languageCode : LangVi
        };

        _currentLang = languageCode;
        try { Preferences.Set("AppLanguage", languageCode); }
        catch { }

        await LoadStringsAsync(languageCode);
        LanguageChanged?.Invoke(this, EventArgs.Empty);
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs("Item[]"));
        Debug.WriteLine($"[LanguageService] Language changed to: {languageCode}");
    }

    public string this[string key] => Get(key);

    public string Get(string key)
    {
        if (!_isLoaded)
            return key;
        return _strings.TryGetValue(key, out var value) ? value : key;
    }

    public string Get(string key, params object[] args)
    {
        var format = Get(key);
        try { return args.Length > 0 ? string.Format(format, args) : format; }
        catch { return format; }
    }

    public string GetDisplayName(string code)
        => SupportedLanguages.FirstOrDefault(l => l.Code == code)?.DisplayName ?? code;

    private async Task LoadStringsAsync(string languageCode)
    {
        _isLoaded = false;
        _strings.Clear();

        try
        {
            var assembly = Assembly.GetExecutingAssembly();
            var resourceName = $"POIApp.Resources.i18n.{languageCode}.json";
            var stream = assembly.GetManifestResourceStream(resourceName);

            if (stream != null)
            {
                using (stream)
                {
                    var json = await new StreamReader(stream).ReadToEndAsync();
                    var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                    if (dict != null)
                        foreach (var kvp in dict)
                            _strings[kvp.Key] = kvp.Value;
                }
                _isLoaded = true;
                Debug.WriteLine($"[LanguageService] Loaded: {languageCode} ({_strings.Count} keys)");
                return;
            }

            Debug.WriteLine($"[LanguageService] ERROR: resource not found: {resourceName}");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[LanguageService] Load error: {ex.Message}");
        }

        _isLoaded = false;
    }
}

public record LanguageOption(string Code, string DisplayName, string Flag)
{
    public string Label => $"{Flag} {DisplayName}";
}

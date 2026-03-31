using System.ComponentModel;
using System.Globalization;
using System.Reflection;
using System.Resources;

namespace POIApp.Services;

/// <summary>
/// Simple localization service using .NET resx files.
/// Switches CultureInfo and fires LanguageChanged event so all pages update.
/// </summary>
public class LocalizationService : INotifyPropertyChanged
{
    private static readonly Lazy<LocalizationService> _instance =
        new(() => new LocalizationService());

    public static LocalizationService Instance { get; } = _instance.Value;

    public event PropertyChangedEventHandler? PropertyChanged;
    public event EventHandler? LanguageChanged;

    // Resource base name: assembly default namespace + folder + filename (no extension)
    private static readonly ResourceManager _rm = new(
        "POIApp.AppStrings",
        Assembly.GetExecutingAssembly());

    // Supported languages: vi | en | zh | kr (thống nhất với MapPage & database)
    public static readonly List<(string Code, string DisplayName)> SupportedLanguages =
    [
        ("vi", "Tiếng Việt 🇻🇳"),
        ("en", "English 🇺🇸"),
        ("zh", "中文 🇨🇳"),
        ("kr", "한국어 🇰🇷")   // "kr" = thống nhất với MapPage & database
    ];

    public string CurrentLanguage { get; private set; } = "vi";

    private LocalizationService() { }

    /// <summary>
    /// Initialize language from saved preference or device locale.
    /// Call once in App.OnStart().
    /// </summary>
    public void Initialize()
    {
        var saved = Preferences.Get("AppLanguage", "");
        var code = !string.IsNullOrWhiteSpace(saved) && SupportedLanguages.Any(l => l.Code == saved)
            ? saved
            : DetectDeviceLanguage();

        SetLanguageInternal(code, save: false);
    }

    /// <summary>
    /// Switch to a new language. Saves to Preferences and fires LanguageChanged.
    /// </summary>
    public void SetLanguage(string languageCode)
    {
        if (!SupportedLanguages.Any(l => l.Code == languageCode))
            return;

        SetLanguageInternal(languageCode, save: true);
    }

    private void SetLanguageInternal(string code, bool save)
    {
        CurrentLanguage = code;

        var culture = code switch
        {
            "vi" => new CultureInfo("vi-VN"),
            "en" => new CultureInfo("en-US"),
            "zh" => new CultureInfo("zh-CN"),
            "kr" => new CultureInfo("ko-KR"),
            _ => CultureInfo.InvariantCulture
        };

        CultureInfo.CurrentUICulture = culture;

        if (save)
            Preferences.Set("AppLanguage", code);

        LanguageChanged?.Invoke(this, EventArgs.Empty);
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs("Item[]"));
    }

    /// <summary>
    /// Get a string by key, e.g. L["TabMap"]
    /// </summary>
    public string this[string key]
    {
        get
        {
            try
            {
                return _rm.GetString(key, CultureInfo.CurrentUICulture) ?? key;
            }
            catch
            {
                return key;
            }
        }
    }

    /// <summary>
    /// Get a string with format args, e.g. L["Distance", 150]
    /// </summary>
    public string Get(string key, params object[] args)
    {
        var format = this[key];
        return args.Length > 0 ? string.Format(format, args) : format;
    }

    public string GetDisplayName(string code)
        => SupportedLanguages.FirstOrDefault(l => l.Code == code).DisplayName;

    private string DetectDeviceLanguage()
    {
        var device = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.ToLowerInvariant();
        if (SupportedLanguages.Any(l => l.Code == device))
            return device;
        return "vi";
    }
}

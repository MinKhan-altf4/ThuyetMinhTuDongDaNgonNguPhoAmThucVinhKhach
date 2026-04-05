using System.ComponentModel;

namespace POIApp.Services;

/// <summary>
/// Facade over LanguageService for backward compatibility.
/// All pages use LocalizationService.Instance (existing code).
/// </summary>
public class LocalizationService : INotifyPropertyChanged
{
    private static readonly Lazy<LocalizationService> _instance = new(() => new LocalizationService());
    public static LocalizationService Instance { get; } = _instance.Value;

    public event PropertyChangedEventHandler? PropertyChanged;
    public event EventHandler? LanguageChanged;

    // Forward to LanguageService
    public string CurrentLanguage => LanguageService.Instance.CurrentLanguage;
    public bool IsLoaded => LanguageService.Instance.IsLoaded;

    public static readonly System.Collections.Generic.List<LanguageOption> SupportedLanguages =
        LanguageService.SupportedLanguages.ToList();

    private LocalizationService()
    {
        // Subscribe to LanguageService changes and relay them
        LanguageService.Instance.LanguageChanged += (_, _) =>
        {
            LanguageChanged?.Invoke(this, EventArgs.Empty);
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs("Item[]"));
        };
        LanguageService.Instance.PropertyChanged += (_, e) =>
        {
            if (e.PropertyName == "Item[]")
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs("Item[]"));
        };
    }

    public void Initialize()
    {
        // Called from App.xaml.cs — actual init happens in LanguageService
    }

    public void SetLanguage(string languageCode)
    {
        _ = LanguageService.Instance.SetLanguageAsync(languageCode);
    }

    public string this[string key] => LanguageService.Instance[key];

    public string Get(string key, params object[] args)
        => LanguageService.Instance.Get(key, args);

    public string GetDisplayName(string code)
        => LanguageService.Instance.GetDisplayName(code);
}

using System.Diagnostics;
using POIApp.Services;

namespace POIApp;

public partial class SettingsPage : ContentPage
{
    private bool _pageLoaded = false;
    private readonly OfflineDataService _offlineDataService = new();
    private readonly APIService _apiService = new();

    // GPS sensitivity values (index = picker index)
    private static readonly string[] GpsValues = { "low", "medium", "high" };

    // Radius values in meters (index = picker index)
    private static readonly int[] RadiusValues = { 200, 500, 1000, 2000 };

    public SettingsPage()
    {
        InitializeComponent();
        LanguageService.Instance.LanguageChanged += OnLanguageChanged;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _pageLoaded = true;

        // Populate pickers ONCE (before ApplyLocalizedStrings so items are ready)
        PopulatePickers();
        ApplyLocalizedStrings();
        SyncPickers();
        UpdateOfflineStatus();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        LanguageService.Instance.LanguageChanged -= OnLanguageChanged;
    }

    private void OnLanguageChanged(object? sender, EventArgs e)
    {
        if (!_pageLoaded) return;
        MainThread.BeginInvokeOnMainThread(() =>
        {
            // Update localized strings (picker labels & UI labels)
            ApplyLocalizedStrings();
        });
    }

    /// <summary>
    /// Populate picker ItemsSource programmatically — KHÔNG hardcode trong XAML.
    /// Gọi 1 lần trong OnAppearing để items luôn sync với ngôn ngữ hiện tại.
    /// </summary>
    private void PopulatePickers()
    {
        var L = LanguageService.Instance;

        // GPS sensitivity picker
        GPSPicker.ItemsSource = new List<string>
        {
            L["gps_battery_saver"],
            L["gps_default"],
            L["gps_high_accuracy"]
        };

        // Radius picker
        RadiusPicker.ItemsSource = new List<string>
        {
            "200m",
            "500m",
            "1000m",
            "2000m"
        };
    }

    private void ApplyLocalizedStrings()
    {
        var L = LanguageService.Instance;

        // Language section
        LblLanguageHeader.Text = "🌐 " + L["language"];
        LblLanguageDesc.Text = L["select_language"];

        // GPS section
        LblGPSHeader.Text = "📡 " + L["gps_settings"];
        LblGPSDesc.Text = L["gps_sensitivity"];

        // Radius section
        LblRadiusHeader.Text = "📍 " + L["search_radius"];
        LblRadiusDesc.Text = L["poi_radius_desc"];

        // API section
        LblApiHeader.Text = "⚙️ " + L["api_config"];
        LblApiDesc.Text = L["api_config_desc"];

        // Offline section
        LblOfflineHeader.Text = "📱 " + L["offline_mode"];
        UpdateOfflineStatus();

        // About section
        LblAboutHeader.Text = "ℹ️ " + L["about"];
        LblAppName.Text = L["app_title"];
        LblVersion.Text = L["version"] + ": 1.0.0";
        LblMapCredit.Text = L["map_credit"] ?? "© OpenStreetMap contributors";

        // ── Re-populate pickers so their labels update with current language ──
        PopulatePickers();

        // Language picker
        LangPicker.ItemsSource = LanguageService.SupportedLanguages
            .Select(l => l.Label)
            .ToList();

        var langIdx = LanguageService.SupportedLanguages
            .Select((l, i) => new { l, i })
            .FirstOrDefault(x => x.l.Code == LanguageService.Instance.CurrentLanguage)?.i ?? 0;
        if (LangPicker.SelectedIndex != langIdx)
            LangPicker.SelectedIndex = langIdx;
    }

    private void UpdateOfflineStatus()
    {
        var L = LanguageService.Instance;
        if (AppSettingsHelper.IsOfflineDataAvailable())
        {
            LblOfflineStatus.Text = L["offline_ready"];
            BtnEnableOffline.Text = L["offline_update"];
        }
        else
        {
            LblOfflineStatus.Text = L["offline_desc"];
            BtnEnableOffline.Text = L["offline_download"];
        }
    }

    private void SyncPickers()
    {
        // Sync GPS picker
        var gps = AppSettingsHelper.GetGpsSensitivity();
        var gpsIdx = Array.IndexOf(GpsValues, gps);
        if (gpsIdx < 0) gpsIdx = 1; // default medium
        if (GPSPicker.SelectedIndex != gpsIdx)
            GPSPicker.SelectedIndex = gpsIdx;

        // Sync Radius picker
        var radius = AppSettingsHelper.GetRadius();
        var radiusIdx = Array.IndexOf(RadiusValues, radius);
        if (radiusIdx < 0) radiusIdx = 2; // default 1000
        if (RadiusPicker.SelectedIndex != radiusIdx)
            RadiusPicker.SelectedIndex = radiusIdx;

        // Sync API URL entry
        var apiUrl = AppSettingsHelper.GetApiBaseUrl();
        if (ApiUrlEntry != null && ApiUrlEntry.Text != apiUrl)
            ApiUrlEntry.Text = apiUrl;
    }

    private async void OnPickerLanguageChanged(object? sender, EventArgs e)
    {
        if (LangPicker.SelectedIndex < 0 || !_pageLoaded) return;
        var selected = LanguageService.SupportedLanguages[LangPicker.SelectedIndex];
        if (selected.Code == LanguageService.Instance.CurrentLanguage) return;
        await LanguageService.Instance.SetLanguageAsync(selected.Code);
    }

    private void OnGPSPickerChanged(object? sender, EventArgs e)
    {
        if (GPSPicker.SelectedIndex < 0 || !_pageLoaded) return;
        var gps = GpsValues[GPSPicker.SelectedIndex];
        AppSettingsHelper.SetGpsSensitivity(gps);
    }

    private void OnRadiusPickerChanged(object? sender, EventArgs e)
    {
        if (RadiusPicker.SelectedIndex < 0 || !_pageLoaded) return;
        var radius = RadiusValues[RadiusPicker.SelectedIndex];
        AppSettingsHelper.SetRadius(radius);
    }

    private void OnApiUrlEntryCompleted(object? sender, EventArgs e)
    {
        if (!_pageLoaded) return;
        var newUrl = ApiUrlEntry?.Text?.Trim();
        if (!string.IsNullOrEmpty(newUrl))
        {
            AppSettingsHelper.SetApiBaseUrl(newUrl);
        }
    }

    private async void OnEnableOfflineClicked(object? sender, EventArgs e)
    {
        var L = LanguageService.Instance;

        try
        {
            BtnEnableOffline.IsEnabled = false;
            LblOfflineStatus.Text = L["downloading"];

            var pois = await _apiService.GetPOIsAsync();

            if (pois == null || pois.Count == 0)
            {
                LblOfflineStatus.Text = "❌ Failed to download POI data. Check API connection.";
                BtnEnableOffline.IsEnabled = true;
                await DisplayAlert("Error", "Failed to download POI data. Check your API connection.", "OK");
                return;
            }

            await _offlineDataService.SavePOIsOfflineAsync(pois);

            LblOfflineStatus.Text = $"✅ Offline data ready — {pois.Count} POIs saved";
            BtnEnableOffline.Text = L["offline_update"];
            BtnEnableOffline.IsEnabled = true;

            await DisplayAlert("Success", $"Offline mode enabled! {pois.Count} POIs saved.", "OK");
            Debug.WriteLine($"[Settings] ✅ Offline mode enabled with {pois.Count} POIs");
        }
        catch (Exception ex)
        {
            LblOfflineStatus.Text = $"❌ Error: {ex.Message}";
            BtnEnableOffline.IsEnabled = true;
            Debug.WriteLine($"[Settings] ❌ Offline error: {ex.Message}");
            await DisplayAlert("Error", $"Failed to enable offline mode: {ex.Message}", "OK");
        }
    }
}

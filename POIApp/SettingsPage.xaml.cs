using System.Diagnostics;
using POIApp.Services;

namespace POIApp;

public partial class SettingsPage : ContentPage
{
    private bool _pageLoaded = false;
    private readonly OfflineDataService _offlineDataService = new();
    private readonly APIService _apiService = new();

    // GPS index mapping: 0=low, 1=medium, 2=high
    private static readonly string[] GpsValues = { "low", "medium", "high" };

    // Radius index mapping: 0=200, 1=500, 2=1000, 3=2000
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
        ApplyLocalizedStrings();
        SyncPickers();
        UpdateOfflineStatus(); // Refresh offline status when page appears
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        LanguageService.Instance.LanguageChanged -= OnLanguageChanged;
    }

    private void OnLanguageChanged(object? sender, EventArgs e)
    {
        if (!_pageLoaded) return;
        MainThread.BeginInvokeOnMainThread(ApplyLocalizedStrings);
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
        LblApiHeader.Text = "⚙️ API Configuration";
        LblApiDesc.Text = "API Base URL (leave empty to use default: 10.0.2.2)";

        // Offline section
        LblOfflineHeader.Text = "📱 Offline Mode";
        UpdateOfflineStatus();

        // About section
        LblAboutHeader.Text = "ℹ️ " + L["about"];
        LblAppName.Text = L["app_title"];
        LblVersion.Text = L["version"] + ": 1.0.0";
        LblMapCredit.Text = L["map_credit"] ?? "© OpenStreetMap contributors";

        // Language picker sync
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
        if (AppSettingsHelper.IsOfflineDataAvailable())
        {
            LblOfflineStatus.Text = "✅ Offline data ready — POI page will use local data";
            BtnEnableOffline.Text = "🔄 Update Offline Data";
        }
        else
        {
            LblOfflineStatus.Text = "Download POI data for offline use";
            BtnEnableOffline.Text = "📥 Enable Offline Mode";
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
        try
        {
            BtnEnableOffline.IsEnabled = false;
            LblOfflineStatus.Text = "⏳ Downloading POI data...";

            // Fetch POIs from API
            var pois = await _apiService.GetPOIsAsync();

            if (pois == null || pois.Count == 0)
            {
                LblOfflineStatus.Text = "❌ Failed to download POI data. Check API connection.";
                BtnEnableOffline.IsEnabled = true;
                await DisplayAlert("Error", "Failed to download POI data. Check your API connection.", "OK");
                return;
            }

            // Save to offline storage
            await _offlineDataService.SavePOIsOfflineAsync(pois);

            LblOfflineStatus.Text = $"✅ Offline data ready — {pois.Count} POIs saved";
            BtnEnableOffline.Text = "🔄 Update Offline Data";
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

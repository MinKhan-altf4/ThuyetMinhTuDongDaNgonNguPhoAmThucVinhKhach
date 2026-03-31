using POIApp.Services;

namespace POIApp;

public partial class SettingsPage : ContentPage
{
    private readonly TTSService _ttsService = new();
    private LocalizationService L => LocalizationService.Instance;

    private double _gpsSensitivity = 10;
    private double _searchRadius = 500;

    public SettingsPage()
    {
        InitializeComponent();
        VoicePicker.SelectedIndex = 0;

        // Populate language picker
        LangPicker.ItemsSource = LocalizationService.SupportedLanguages
            .Select(l => l.DisplayName)
            .ToList();

        L.LanguageChanged += OnLanguageChanged_Event;
        ApplyLocalizedStrings();
    }

    private void OnLanguageChanged_Event(object? sender, EventArgs e)
    {
        MainThread.BeginInvokeOnMainThread(ApplyLocalizedStrings);
    }

    private void ApplyLocalizedStrings()
    {
        // Language section
        LblLanguageHeader.Text = "🌐 " + L["Language"];
        LblLanguageDesc.Text = L["SelectLanguage"];
        LblCurrentLang.Text = L.Get("CurrentLanguage", L.GetDisplayName(L.CurrentLanguage));

        // Sync picker to current language
        var currentIdx = LocalizationService.SupportedLanguages
            .Select((l, i) => new { l, i })
            .FirstOrDefault(x => x.l.Code == L.CurrentLanguage)?.i ?? 0;
        if (LangPicker.SelectedIndex != currentIdx)
            LangPicker.SelectedIndex = currentIdx;

        // Voice offline section
        LblVoiceOfflineHeader.Text = "🔊 " + L["VoiceOffline"];
        LblVoiceDesc.Text = L["VoiceOfflineDesc"];
        BtnDownloadVoice.Text = "⬇ " + L["DownloadVoicePackage"];
        LblOfflineStatus.Text = L["OfflineNotDownloaded"];

        // TTS section
        LblTTSHeader.Text = "🗣️ " + L["VoiceSettings"];
        LblTTSDesc.Text = L["SelectVoice"];
        BtnTestVoice.Text = "🔊 " + L["TestVoice"];

        // GPS section
        LblGPSHeader.Text = "📡 " + L["GPSSettings"];
        LblGPSSensitivity.Text = L["GPSSensitivity"];
        LblGPSSensitivityValue.Text = L["NotificationRadius"] + $": {_gpsSensitivity:F0}m";
        LblSearchRadius.Text = L["SearchRadius"];
        LblSearchRadiusValue.Text = L["SearchRadius"] + $": {_searchRadius:F0}m";
        LblBackgroundGPS.Text = L["BackgroundGPS"];
        LblBackgroundGPSDesc.Text = L["BackgroundGPSDesc"];
        SwBackgroundGPS.OnColor = Color.FromArgb("#1565C0");

        // About section
        LblAboutHeader.Text = "ℹ️ " + L["About"];
        LblAppName.Text = L["AppTitle"];
        LblVersion.Text = L["Version"] + ": 1.0.0";
        LblSupportedLangs.Text = L["SupportedLanguages"] + ": Tiếng Việt, English, 中文, 한국어";
        LblMapCredit.Text = L["MapCredit"];
    }

    private void OnLanguageChanged(object? sender, EventArgs e)
    {
        if (LangPicker.SelectedIndex < 0) return;
        var selected = LocalizationService.SupportedLanguages[LangPicker.SelectedIndex];
        if (selected.Code == L.CurrentLanguage) return;

        // SetLanguage is synchronous — fires LanguageChanged event
        L.SetLanguage(selected.Code);
    }

    private async void OnDownloadVoiceClicked(object? sender, EventArgs e)
    {
        try
        {
            BtnDownloadVoice.IsEnabled = false;
            BtnDownloadVoice.Text = "⏳ " + L.Get("Downloading", 0);
            DownloadProgressFrame.IsVisible = true;

            // Simulate download — replace with real HTTP download in production
            for (int i = 0; i <= 100; i += 5)
            {
                DownloadProgress.Progress = i / 100.0;
                LblDownloadStatus.Text = L.Get("Downloading", i);
                await Task.Delay(100);
            }

            LblDownloadStatus.Text = L.Get("DownloadSuccess");
            LblOfflineStatus.Text = L.Get("OfflineReady");
            BtnDownloadVoice.Text = "✅ " + L.Get("DownloadSuccess").Replace("✅ ", "");
        }
        catch (Exception ex)
        {
            LblDownloadStatus.Text = L.Get("DownloadFailed", ex.Message);
            BtnDownloadVoice.Text = "⬇ " + L["Retry"];
        }
        finally
        {
            BtnDownloadVoice.IsEnabled = true;
        }
    }

    private async void OnTestVoiceClicked(object? sender, EventArgs e)
    {
        try
        {
            var testText = L.CurrentLanguage switch
            {
                "vi" => L["TTSTestVI"],
                "en" => L["TTSTestEN"],
                "zh" => L["TTSTestZH"],
                "ko" => L["TTSTestKO"],
                _ => L["TTSTestEN"]
            };
            await _ttsService.SpeakAsync(testText);
        }
        catch { }
    }

    private void OnGPSSensitivityChanged(object? sender, ValueChangedEventArgs e)
    {
        _gpsSensitivity = e.NewValue;
        LblGPSSensitivityValue.Text = L["NotificationRadius"] + $": {_gpsSensitivity:F0}m";
    }

    private void OnSearchRadiusChanged(object? sender, ValueChangedEventArgs e)
    {
        _searchRadius = e.NewValue;
        LblSearchRadiusValue.Text = L["SearchRadius"] + $": {_searchRadius:F0}m";
    }

    private void OnBackgroundGPSChanged(object? sender, ToggledEventArgs e)
    {
        // Save to preferences (future)
    }

    ~SettingsPage()
    {
        L.LanguageChanged -= OnLanguageChanged_Event;
    }
}

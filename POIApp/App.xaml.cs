using System.Diagnostics;
using System.Globalization;
using Microsoft.Maui.Storage;
using POIApp.Services;

namespace POIApp;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
        => new Window(new AppShell());

    protected override async void OnStart()
    {
        base.OnStart();

        // Khởi tạo các service như cũ
        await LanguageService.Instance.InitializeAsync();
        await TTSService.PreloadLocalesAsync();

        // Ghi lượt mở app lên server (fire-and-forget, không block UI)
        _ = RecordAppOpenAsync();
    }

    // ── Ghi lượt mở app ─────────────────────────────────────────────
    private static async Task RecordAppOpenAsync()
    {
        try
        {
            string deviceId     = GetOrCreateDeviceId();
            string deviceType   = GetDeviceType();
            string appVersion   = AppInfo.VersionString;
            string languageCode = CultureInfo.CurrentCulture.TwoLetterISOLanguageName;

            Debug.WriteLine($"[App] RecordAppOpen — device={deviceId}, type={deviceType}, ver={appVersion}, lang={languageCode}");

            var analytics = new AnalyticsService();
            await analytics.RecordAppOpenAsync(deviceId, deviceType, appVersion, languageCode);
        }
        catch (Exception ex)
        {
            // Không bao giờ crash app vì analytics
            Debug.WriteLine($"[App] RecordAppOpenAsync error: {ex.Message}");
        }
    }

    /// <summary>
    /// Tạo và lưu một Device ID cố định (UUID) bằng Preferences.
    /// Cùng thiết bị mở nhiều lần → cùng ID, khác lần mở.
    /// </summary>
    private static string GetOrCreateDeviceId()
    {
        const string key = "poi_device_id";
        if (!Preferences.ContainsKey(key))
            Preferences.Set(key, Guid.NewGuid().ToString());
        return Preferences.Get(key, string.Empty);
    }

    private static string GetDeviceType()
    {
        if (DeviceInfo.Platform == DevicePlatform.Android) return "android";
        if (DeviceInfo.Platform == DevicePlatform.iOS)     return "ios";
        return "windows";
    }
}
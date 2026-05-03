using System.Diagnostics;
using POIApp.Services;

namespace POIApp;

public partial class App : Application
{
    private readonly AnalyticsService _analyticsService = new();

    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
        => new Window(new AppShell());

    protected override async void OnStart()
    {
        base.OnStart();

        await LanguageService.Instance.InitializeAsync();
        await TTSService.PreloadLocalesAsync();
        await _analyticsService.RecordAppOpenAsync();
        await _analyticsService.StartOnlineSessionAsync();
    }

    protected override async void OnResume()
    {
        base.OnResume();
        await _analyticsService.StartOnlineSessionAsync();
    }

    protected override async void OnSleep()
    {
        await _analyticsService.EndOnlineSessionAsync();
        base.OnSleep();
    }
}

using POIApp.Services;

namespace POIApp;

public partial class AppShell : Shell
{
	private bool _isLoaded = false;

	public AppShell()
	{
		InitializeComponent();

		Loaded += OnLoaded;
		LanguageService.Instance.LanguageChanged += OnLanguageChanged;
	}

	private void OnLoaded(object? sender, EventArgs e)
	{
		_isLoaded = true;
		ApplyTabTitles();
	}

	private void OnLanguageChanged(object? sender, EventArgs e)
	{
		if (!_isLoaded) return;
		ApplyTabTitles();
	}

	private void ApplyTabTitles()
	{
		if (TabMap == null || TabPOI == null || TabSettings == null) return;

		var L = LanguageService.Instance;
		Title = L["app_title"];
		TabMap.Title = L["tab_map"];
		TabPOI.Title = L["tab_poi"];
		TabSettings.Title = L["tab_settings"];
	}
}

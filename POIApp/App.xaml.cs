using Microsoft.Extensions.DependencyInjection;
using POIApp.Services;

namespace POIApp;

public partial class App : Application
{
	public App()
	{
		InitializeComponent();
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		return new Window(new AppShell());
	}

	protected override async void OnStart()
	{
		base.OnStart();
		await LanguageService.Shared.InitializeAsync();
	}
}
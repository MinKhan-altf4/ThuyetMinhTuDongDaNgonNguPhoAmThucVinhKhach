using System.Diagnostics;
using POIApp.Models;
using POIApp.Services;

namespace POIApp;

public partial class POIPage : ContentPage
{
    private readonly List<POI> _pois = new();
    private readonly APIService _apiService = new();
    private readonly OfflineDataService _offlineDataService = new();
    private readonly GeofenceHelper _geofenceHelper = new();
    private readonly GPSTrackingService _gpsTracking = new();
    private readonly AudioService _audioService = new();

    private bool _pageLoaded = false;
    private string _audioLang = "vi"; // ngôn ngữ audio: vi hoặc en

    public POIPage()
    {
        InitializeComponent();
        _gpsTracking.LocationChanged += OnLocationChanged;
        LanguageService.Instance.LanguageChanged += OnLanguageChanged;
        AudioLangPicker.SelectedIndex = 0; // default: tiếng Việt
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        if (!_pageLoaded)
            _pageLoaded = true;

        LoadingIndicator.IsRunning = true;
        LoadingIndicator.IsVisible = true;

        ApplyLocalizedStrings();
        await _gpsTracking.StartTrackingAsync();
        await LoadPOIsAsync();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _audioService.Stop();
        _gpsTracking.StopTracking();
    }

    private void OnLanguageChanged(object? sender, EventArgs e)
    {
        if (!_pageLoaded) return;
        MainThread.BeginInvokeOnMainThread(() =>
        {
            ApplyLocalizedStrings();
            BindPOIList();
        });
    }

    private void OnLocationChanged(object? sender, Location loc)
    {
        UpdateDistances(loc.Latitude, loc.Longitude);
    }

    private void ApplyLocalizedStrings()
    {
        var L = LanguageService.Instance;
        Title = L["tab_poi"];
        LblTitle.Text = L["poi_near_you"];
        LblEmpty.Text = L["no_poi_data"];
        var count = _pois.Count;
        LblSubtitle.Text = $"{L["district"]} · {count} {L["poi_count"]}";
    }

    private void UpdateDistances(double lat, double lon)
    {
        foreach (var poi in _pois)
        {
            poi.Distance = _geofenceHelper.CalculateDistance(lat, lon, poi.Latitude, poi.Longitude);
            poi.IsNear = poi.Distance < 50;
        }
        var sorted = _pois.OrderBy(p => p.Distance).ToList();
        _pois.Clear();
        _pois.AddRange(sorted);
        MainThread.BeginInvokeOnMainThread(BindPOIList);
    }

    private async Task LoadPOIsAsync()
    {
        try
        {
            // ── BUG FIX: Check if offline mode is enabled ──
            List<POI>? pois = null;

            if (AppSettingsHelper.IsOfflineDataAvailable())
            {
                Debug.WriteLine("[POIPage] 📱 Offline mode enabled — loading from local storage...");
                pois = await _offlineDataService.LoadPOIsOfflineAsync();

                if (pois == null || pois.Count == 0)
                {
                    LblEmpty.Text = "❌ Offline data not found or empty. Please enable offline mode in Settings.";
                    Debug.WriteLine("[POIPage] ❌ Offline data not found");
                }
                else
                {
                    Debug.WriteLine($"[POIPage] ✅ Loaded {pois.Count} POI from offline storage");
                }
            }
            else
            {
                // No offline mode enabled - show message
                EmptyState.IsVisible = true;
                LblEmpty.Text = "📱 Offline mode not enabled.\nPlease go to Settings → Enable Offline Mode to download POI data.";
                Debug.WriteLine("[POIPage] ℹ️  Offline mode not enabled");
            }

            if (pois != null && pois.Count > 0)
            {
                _pois.Clear();
                _pois.AddRange(pois);

                var loc = _gpsTracking.CurrentLocation;
                if (loc != null)
                    UpdateDistances(loc.Latitude, loc.Longitude);
                else
                    MainThread.BeginInvokeOnMainThread(BindPOIList);

                MainThread.BeginInvokeOnMainThread(() =>
                {
                    ApplyLocalizedStrings();
                    LoadingIndicator.IsRunning = false;
                    LoadingIndicator.IsVisible = false;
                });
            }
            else
            {
                MainThread.BeginInvokeOnMainThread(() =>
                {
                    ApplyLocalizedStrings();
                    LoadingIndicator.IsRunning = false;
                    LoadingIndicator.IsVisible = false;
                });
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[POIPage] ❌ Load error: {ex.Message}");
            MainThread.BeginInvokeOnMainThread(() =>
            {
                LblEmpty.Text = $"❌ Error: {ex.Message}";
                EmptyState.IsVisible = true;
                LoadingIndicator.IsRunning = false;
                LoadingIndicator.IsVisible = false;
            });
        }
    }

    private void BindPOIList()
    {
        POIListContainer.Children.Clear();

        if (_pois.Count == 0)
        {
            EmptyState.IsVisible = true;
            return;
        }

        EmptyState.IsVisible = false;
        var L = LanguageService.Instance;

        foreach (var poi in _pois)
        {
            var nearBg = poi.IsNear ? "#E8F5E9" : "#FFFFFF";
            var nearBorder = poi.IsNear ? "#43A047" : "#E0E0E0";
            var ratingStars = BuildStars(poi.Rating);

            // Header grid: name + distance
            var nameLabel = new Label
            {
                Text = poi.Name,
                FontSize = 16,
                FontAttributes = FontAttributes.Bold,
                TextColor = Color.FromArgb("#1A237E")
            };
            var distLabel = new Label
            {
                Text = poi.IsNear ? $"🎯 {poi.Distance:F0}m" : $"{poi.Distance:F0}m",
                FontSize = 12,
                TextColor = poi.IsNear ? Color.FromArgb("#43A047") : Color.FromArgb("#607D8B"),
                FontAttributes = FontAttributes.Bold,
                VerticalOptions = LayoutOptions.Center,
                HorizontalOptions = LayoutOptions.End
            };
            var headerGrid = new Grid
            {
                ColumnDefinitions =
                {
                    new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                    new ColumnDefinition { Width = GridLength.Auto }
                }
            };
            headerGrid.Add(nameLabel, 0, 0);
            headerGrid.Add(distLabel, 1, 0);

            // Button row: Play + Stop
            var playBtn = new Button
            {
                Text = "🔊 " + L["play"],
                FontSize = 12,
                HeightRequest = 36,
                CornerRadius = 18,
                BackgroundColor = Color.FromArgb("#FF9800"),
                TextColor = Colors.White
            };
            playBtn.Clicked += (_, _) => OnPlayClicked(poi);

            var stopBtn = new Button
            {
                Text = "⏹ " + L["pause"],
                FontSize = 12,
                HeightRequest = 36,
                CornerRadius = 18,
                Margin = new Thickness(6, 0, 0, 0),
                BackgroundColor = Color.FromArgb("#607D8B"),
                TextColor = Colors.White
            };
            stopBtn.Clicked += (_, _) => _audioService.Stop();

            var btnRow = new Grid
            {
                ColumnDefinitions =
                {
                    new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                    new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) }
                },
                Margin = new Thickness(0, 4, 0, 0)
            };
            btnRow.Add(playBtn, 0, 0);
            btnRow.Add(stopBtn, 1, 0);

            var address = poi.Address ?? "";
            var openHour = poi.OpenHour ?? "";
            var closeHour = poi.CloseHour ?? "";

            var cardContent = new VerticalStackLayout
            {
                Spacing = 6,
                Children =
                {
                    headerGrid,
                    new Label { Text = ratingStars, FontSize = 13, TextColor = Color.FromArgb("#FFB300") },
                    new Label { Text = poi.Description, FontSize = 13, TextColor = Color.FromArgb("#37474F"), MaxLines = 2, LineBreakMode = LineBreakMode.TailTruncation },
                    new Label { Text = $"📍 {address}", FontSize = 11, TextColor = Color.FromArgb("#78909C"), MaxLines = 1 },
                    new Label { Text = $"🕐 {openHour} - {closeHour}", FontSize = 11, TextColor = Color.FromArgb("#90A4AE") },
                    btnRow
                }
            };

            var card = new Frame
            {
                Padding = new Thickness(14),
                BackgroundColor = Color.FromArgb(nearBg),
                BorderColor = Color.FromArgb(nearBorder),
                CornerRadius = 14,
                HasShadow = true,
                Content = cardContent
            };

            POIListContainer.Children.Add(card);
        }
    }

    private void OnAudioLangChanged(object? sender, EventArgs e)
    {
        _audioLang = AudioLangPicker.SelectedIndex == 0 ? "vi" : "en";
        Debug.WriteLine($"[POIPage] Audio lang changed: {_audioLang}");
    }

    private async void OnPlayClicked(POI poi)
    {
        if (poi == null) return;
        try
        {
            await _audioService.PlayAsync(poi, _audioLang);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[POIPage] Play error: {ex.Message}");
        }
    }

    private static string BuildStars(float rating)
    {
        var full = (int)Math.Floor(rating);
        var half = rating - full >= 0.5f;
        var empty = 5 - full - (half ? 1 : 0);
        return new string('⭐', full) + (half ? "½" : "") + new string('☆', empty);
    }
}

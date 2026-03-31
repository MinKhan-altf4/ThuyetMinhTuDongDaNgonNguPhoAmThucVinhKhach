using System.Diagnostics;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Layouts;
using POIApp.Models;
using POIApp.Services;

namespace POIApp;

public partial class POIPage : ContentPage
{
    private List<POI> _pois = new();
    private readonly APIService _apiService = new();
    private readonly GeofenceHelper _geofenceHelper = new();
    private readonly GPSTrackingService _gpsTracking = new();

    public POIPage()
    {
        InitializeComponent();
        _gpsTracking.LocationChanged += OnLocationChanged;
        LocalizationService.Instance.LanguageChanged += OnLanguageChangedFromService;
        ApplyLocalizedStrings();
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        LoadingIndicator.IsRunning = true;
        LoadingIndicator.IsVisible = true;
        ApplyLocalizedStrings();
        await _gpsTracking.StartTrackingAsync();
        await LoadPOIsAsync();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        LocalizationService.Instance.LanguageChanged -= OnLanguageChangedFromService;
        _gpsTracking.StopTracking();
    }

    private void OnLanguageChangedFromService(object? sender, EventArgs e)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            ApplyLocalizedStrings();
            BindPOIList();
        });
    }

    private void ApplyLocalizedStrings()
    {
        var L = LocalizationService.Instance;
        Title = L["TabPOI"];
        LblSubtitle.Text = $"TP.HCM · {_pois.Count} " + L["AllPlaces"].ToLower();
    }

    private void OnLocationChanged(object? sender, Location loc)
    {
        UpdateDistances(loc.Latitude, loc.Longitude);
    }

    private void UpdateDistances(double lat, double lon)
    {
        foreach (var poi in _pois)
        {
            poi.Distance = _geofenceHelper.CalculateDistance(lat, lon, poi.Latitude, poi.Longitude);
            poi.IsNear = poi.Distance < 50;
        }
        _pois = _pois.OrderBy(p => p.Distance).ToList();
        MainThread.BeginInvokeOnMainThread(BindPOIList);
    }

    private async Task LoadPOIsAsync()
    {
        try
        {
            Debug.WriteLine($"[POIPage] ▶ LoadPOIsAsync()");
            _pois = await _apiService.GetPOIsAsync();

            Debug.WriteLine($"[POIPage] ✅ Nhận {_pois.Count} POI từ API.");
            foreach (var p in _pois)
                Debug.WriteLine($"[POIPage]   #{p.Id}: DisplayName=\"{p.DisplayName}\" | lat={p.Latitude:F6}, lng={p.Longitude:F6}");

            var loc = _gpsTracking.CurrentLocation;
            if (loc != null)
                UpdateDistances(loc.Latitude, loc.Longitude);
            else
                BindPOIList();

            ApplyLocalizedStrings(); // refresh localized subtitle
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[POIPage] ❌ Lỗi tải POI: {ex.Message}");
            EmptyState.IsVisible = true;
        }
        finally
        {
            LoadingIndicator.IsRunning = false;
            LoadingIndicator.IsVisible = false;
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

        foreach (var poi in _pois)
        {
            var nearBg = poi.IsNear ? "#E8F5E9" : "#FFFFFF";
            var nearBorder = poi.IsNear ? "#43A047" : "#E0E0E0";
            var ratingStars = BuildStars(poi.Rating);

            // Name label with Grid.Column=0
            // ⚠️ Dùng DisplayName để hỗ trợ đa ngôn ngữ
            var nameLabel = new Label
            {
                Text = poi.DisplayName,
                FontSize = 16,
                FontAttributes = FontAttributes.Bold,
                TextColor = Color.FromArgb("#1A237E")
            };

            // Distance label with Grid.Column=1
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

            // Button: Nghe thuyet minh
            var listenBtn = new Button
            {
                Text = "🔊 " + LocalizationService.Instance["Listen"],
                FontSize = 12,
                HeightRequest = 36,
                CornerRadius = 18,
                BackgroundColor = Color.FromArgb("#FF9800"),
                TextColor = Colors.White
            };
            listenBtn.Clicked += (_, _) => OnThuyetMinhClicked(poi);

            // Button: Navigate
            var navBtn = new Button
            {
                Text = LocalizationService.Instance["Directions"],
                FontSize = 12,
                HeightRequest = 36,
                CornerRadius = 18,
                Margin = new Thickness(6, 0, 0, 0),
                BackgroundColor = Color.FromArgb("#43A047"),
                TextColor = Colors.White
            };
            navBtn.Clicked += (_, _) => OnNavigateClicked(poi);

            var btnRow = new Grid
            {
                ColumnDefinitions =
                {
                    new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                    new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) }
                },
                Margin = new Thickness(0, 4, 0, 0)
            };
            btnRow.Add(listenBtn, 0, 0);
            btnRow.Add(navBtn, 1, 0);

            var cardContent = new VerticalStackLayout
            {
                Spacing = 6,
                Children =
                {
                    headerGrid,
                    new Label { Text = ratingStars, FontSize = 13, TextColor = Color.FromArgb("#FFB300") },
                    new Label { Text = poi.DisplayDescription, FontSize = 13, TextColor = Color.FromArgb("#37474F"), MaxLines = 2, LineBreakMode = LineBreakMode.TailTruncation },
                    new Label { Text = $"📍 {poi.Address}", FontSize = 11, TextColor = Color.FromArgb("#78909C"), MaxLines = 1 },
                    new Label { Text = $"🕐 {poi.OpenHour} - {poi.CloseHour}", FontSize = 11, TextColor = Color.FromArgb("#90A4AE") },
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

    private async void OnThuyetMinhClicked(POI poi)
    {
        try
        {
            var tts = new TTSService();
            await tts.SpeakAsync($"{poi.DisplayName}. {poi.DisplayDescription}", LocalizationService.Instance.CurrentLanguage);
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[POIPage] Loi TTS: " + ex.Message);
        }
    }

    private async void OnNavigateClicked(POI poi)
    {
        try
        {
            var url = $"https://www.google.com/maps/dir/?api=1&destination={poi.Latitude},{poi.Longitude}";
            await Launcher.OpenAsync(new Uri(url));
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[POIPage] Loi chi duong: " + ex.Message);
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

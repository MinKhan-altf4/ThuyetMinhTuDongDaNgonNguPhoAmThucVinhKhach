using System.Diagnostics;
using System.Globalization;
using System.Text;
using Microsoft.Maui.Controls;
using POIApp.Models;
using POIApp.Services;

namespace POIApp;

public partial class MapPage : ContentPage
{
    private const string LangVi = "vi";
    private const string LangEn = "en";
    private const string LangZh = "zh";
    private const string LangJp = "jp";
    private const string LangKr = "kr";

    private static readonly List<(string Label, string Code)> Languages =
    [
        ("Tiếng Việt 🇻🇳", LangVi),
        ("English 🇺🇸",    LangEn),
        ("中文 🇨🇳",        LangZh),
        ("日本語 🇯🇵",       LangJp),
        ("한국어 🇰🇷",        LangKr)
    ];

    private List<POI> _allPois = new();   // full POI list
    private List<POI> _pois = new();     // filtered (search or all)
    private double _userLat = 10.7598;   // default: Vinh Khánh, D4
    private double _userLon = 106.6982;
    private POI? _selectedPOI;
    private string _selectedLanguage = LangVi;
    private System.Timers.Timer? _searchDebounceTimer;
    private System.Timers.Timer? _refreshTimer;
    private bool _mapReady = false;

    private readonly GeofenceHelper _geofenceHelper = new();
    private readonly GPSTrackingService _gpsTracking = new();
    private readonly CacheService _cacheService = new();
    private readonly OfflineAudioService _offlineAudioService = new();
    private readonly APIService _apiService = new();

    public MapPage()
    {
        InitializeComponent();
        InitializePage();
    }

    private void InitializePage()
    {
        LanguagePicker.ItemsSource = Languages.Select(x => x.Label).ToList();
        LanguagePicker.SelectedIndex = 0;

        _refreshTimer = new System.Timers.Timer(5000);
        _refreshTimer.Elapsed += (_, _) => MainThread.BeginInvokeOnMainThread(UpdateStatus);

        _searchDebounceTimer = new System.Timers.Timer(400);
        _searchDebounceTimer.AutoReset = false;
        _searchDebounceTimer.Elapsed += async (_, _) => await SearchAsync();

        MapWebView.Navigating += OnWebViewNavigating;
        MapWebView.Navigated += OnWebViewNavigated;
        LblAudioStatus.Text = "Sẵn sàng phát thuyết minh";
    }

    private void OnWebViewNavigated(object? sender, WebNavigatedEventArgs e)
    {
        _mapReady = true;
        Debug.WriteLine("[Map] WebView loaded OK");
        // NOTE: Do NOT call RefreshMap() here — that creates an infinite loop
        // because setting Source triggers Navigated again.
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        _selectedLanguage = await ResolveDefaultLanguageAsync();
        SetLanguagePickerByCode(_selectedLanguage);

        _gpsTracking.LocationChanged += OnLocationChanged;
        _gpsTracking.LocationError += OnError;

        // Load POIs FIRST, then render map
        await LoadPOIsAsync();

        // Build and show the map immediately after POIs are loaded
        RefreshMap();

        _refreshTimer?.Start();

        // Start GPS tracking last (may not resolve immediately on emulator)
        _ = _gpsTracking.StartTrackingAsync();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _refreshTimer?.Stop();
        _searchDebounceTimer?.Stop();
        _gpsTracking.LocationChanged -= OnLocationChanged;
        _gpsTracking.LocationError -= OnError;
        _gpsTracking.StopTracking();
        _offlineAudioService.Stop();
        _mapReady = false;
    }

    private async Task<string> ResolveDefaultLanguageAsync()
    {
        var saved = await _cacheService.GetPreferredLanguageAsync();
        if (!string.IsNullOrWhiteSpace(saved) && Languages.Any(l => l.Code == saved))
            return saved;

        var locale = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.ToLowerInvariant();
        if (Languages.Any(l => l.Code == locale))
            return locale;

        return _userLat is >= 8 and <= 24 && _userLon is >= 102 and <= 110
            ? LangVi
            : LangEn;
    }

    private void SetLanguagePickerByCode(string languageCode)
    {
        var index = Languages.FindIndex(l => l.Code == languageCode);
        LanguagePicker.SelectedIndex = Math.Max(0, index);
    }

    private async void OnLanguageChanged(object? sender, EventArgs e)
    {
        if (LanguagePicker.SelectedIndex < 0 || LanguagePicker.SelectedIndex >= Languages.Count)
            return;

        _selectedLanguage = Languages[LanguagePicker.SelectedIndex].Code;
        await _cacheService.SavePreferredLanguageAsync(_selectedLanguage);

        if (_selectedPOI != null)
            BindPOIDetailText(_selectedPOI);
    }

    private void OnLocationChanged(object? sender, Location loc)
    {
        _userLat = loc.Latitude;
        _userLon = loc.Longitude;
        UpdatePOIDistances();

        MainThread.BeginInvokeOnMainThread(() =>
        {
            UpdateChips();
            UpdateStatus();
            RefreshMap();
        });
    }

    private void OnError(object? sender, string err)
    {
        MainThread.BeginInvokeOnMainThread(() => { LblUserStatus.Text = "Lỗi GPS: " + err; });
    }

    private void OnWebViewNavigating(object? sender, WebNavigatingEventArgs e)
    {
        try
        {
            var url = e.Url ?? string.Empty;

            // POI detail click
            if (url.StartsWith("poi://detail/", StringComparison.OrdinalIgnoreCase))
            {
                e.Cancel = true;
                var idStr = url.Replace("poi://detail/", string.Empty, StringComparison.OrdinalIgnoreCase);
                if (int.TryParse(idStr, out var poiId))
                {
                    var poi = _pois.FirstOrDefault(p => p.Id == poiId);
                    if (poi != null)
                        MainThread.BeginInvokeOnMainThread(() => ShowDetail(poi));
                }
                return;
            }

            // Autocomplete POI select → center map + show detail
            if (url.StartsWith("poi://select/", StringComparison.OrdinalIgnoreCase))
            {
                e.Cancel = true;
                var idStr = url.Replace("poi://select/", string.Empty, StringComparison.OrdinalIgnoreCase);
                if (int.TryParse(idStr, out var poiId))
                {
                    var poi = _pois.FirstOrDefault(p => p.Id == poiId);
                    if (poi != null)
                        MainThread.BeginInvokeOnMainThread(() =>
                        {
                            SearchSuggestionsPanel.IsVisible = false;
                            CenterMapOnPOI(poi);
                            ShowDetail(poi);
                        });
                }
                return;
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[Map] Lỗi điều hướng: " + ex.Message);
        }
    }

    private void UpdatePOIDistances()
    {
        foreach (var poi in _pois)
        {
            poi.Distance = _geofenceHelper.CalculateDistance(_userLat, _userLon, poi.Latitude, poi.Longitude);
            poi.IsNear = poi.Distance < 100;
        }
        _pois = _pois.OrderBy(p => p.Distance).ToList();
    }

    private void UpdateStatus()
    {
        LblUserStatus.Text = $"📍 {_userLat:F6}, {_userLon:F6}";
        var nearest = _pois.FirstOrDefault();
        LblNearestStatus.Text = nearest == null
            ? "Khong co du lieu POI"
            : nearest.IsNear
                ? $"🎯 {nearest.Name} ({nearest.Distance:F0}m)"
                : $"📌 {nearest.Name} ({nearest.Distance:F0}m)";
    }

    private void UpdateChips()
    {
        POIChipsContainer.Children.Clear();

        foreach (var poi in _pois.Take(6))
        {
            var chip = new Frame
            {
                BackgroundColor = poi.IsNear ? Color.FromArgb("#E8F5E9") : Color.FromArgb("#F5F7FA"),
                BorderColor = poi.IsNear ? Color.FromArgb("#43A047") : Color.FromArgb("#CFD8DC"),
                CornerRadius = 16,
                Padding = new Thickness(10, 6),
                HasShadow = false,
                Content = new VerticalStackLayout
                {
                    Spacing = 2,
                    Children =
                    {
                        new Label { Text = poi.Name, FontSize = 11, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#263238") },
                        new Label { Text = poi.IsNear ? $"🎯 {poi.Distance:F0}m" : $"{poi.Distance:F0}m", FontSize = 10, TextColor = Color.FromArgb("#607D8B") }
                    }
                }
            };

            var tap = new TapGestureRecognizer();
            tap.Tapped += (_, _) =>
            {
                CenterMapOnPOI(poi);
                ShowDetail(poi);
            };
            chip.GestureRecognizers.Add(tap);
            POIChipsContainer.Children.Add(chip);
        }
    }

    private void RefreshMap()
    {
        // Set source first. If _mapReady is true, it will render immediately.
        // If _mapReady is false (first call), OnWebViewNavigated will re-call this
        // after the WebView finishes loading, so the map actually displays.
        MapWebView.Source = new HtmlWebViewSource { Html = BuildMapHtml() };
    }

    private void CenterMapOnPOI(POI poi)
    {
        if (!_mapReady) return;
        // Use EvaluateJavaScriptAsync to fly the map to the POI
        var js = $"if(window.map){{map.flyTo([{poi.Latitude},{poi.Longitude}],18,{{animate:true,duration:1}});}}";
        MapWebView.EvaluateJavaScriptAsync(js);
    }

    private string BuildMapHtml()
    {
        var inv = CultureInfo.InvariantCulture;
        var nearest = _pois.FirstOrDefault();
        var cLat = nearest != null ? (_userLat + nearest.Latitude) / 2 : _userLat;
        var cLon = nearest != null ? (_userLon + nearest.Longitude) / 2 : _userLon;

        var sb = new StringBuilder();
        sb.Append("<!DOCTYPE html><html><head>");
        sb.Append("<meta charset='utf-8'/>");
        sb.Append("<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'/>");
        sb.Append("<link rel='stylesheet' href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'/>");
        sb.Append("<script src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'></script>");
        sb.Append("<style>");
        sb.Append("*{margin:0;padding:0;box-sizing:border-box;}html,body,#map{height:100%;width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}");
        sb.Append(".leaflet-control-zoom a{width:44px!important;height:44px!important;line-height:42px!important;font-size:22px!important;border-radius:12px!important;border:none!important;background:#fff!important;color:#1E3A8A!important;box-shadow:0 4px 12px rgba(0,0,0,.18)!important;margin-bottom:8px!important;}");
        sb.Append(".poi-pin{position:relative;transform:translate(-50%,-100%);display:inline-block;}");
        sb.Append(".poi-pin .body{width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3);position:relative;z-index:2;transition:transform .2s;}");
        sb.Append(".poi-pin .tail{position:absolute;left:50%;bottom:-10px;width:14px;height:14px;background:inherit;transform:translateX(-50%) rotate(45deg);border-right:3px solid #fff;border-bottom:3px solid #fff;z-index:1;}");
        sb.Append(".poi-pin.near .body{animation:bounce 1.8s ease-in-out infinite;}");
        sb.Append(".poi-pin.selected .body{box-shadow:0 0 0 8px rgba(255,152,0,.3),0 4px 12px rgba(0,0,0,.3);transform:scale(1.15);}");
        sb.Append("@keyframes bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}");
        sb.Append("</style></head><body>");
        sb.Append("<div id='map'></div>");
        sb.Append("<script>");
        sb.Append($"var userLat={_userLat.ToString(inv)},userLng={_userLon.ToString(inv)};");
        sb.Append($"var map=L.map('map',{{zoomControl:false,attributionControl:false}}).setView([{cLat.ToString(inv)},{cLon.ToString(inv)}],16);");
        sb.Append("L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);");
        sb.Append("L.control.zoom({position:'bottomleft'}).addTo(map);");
        sb.Append(@"
L.Control.Recenter=L.Control.extend({options:{position:'bottomright'},onAdd:function(){
  var btn=L.DomUtil.create('button','leaflet-bar leaflet-control');
  btn.style.cssText='width:44px;height:44px;border-radius:12px;border:none;background:#fff;color:#1565C0;box-shadow:0 4px 12px rgba(0,0,0,.2);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
  btn.innerHTML='&#8853;';
  btn.title='Về vị trí của tôi';
  btn.addEventListener('click',function(){map.flyTo([userLat,userLng],17,{animate:true,duration:1});});
  return btn;
}});
new L.Control.Recenter().addTo(map);
");
        sb.Append("var userIcon=L.divIcon({html:\"<div style='width:20px;height:20px;border-radius:10px;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 12px rgba(37,99,235,.15)'></div>\",className:'',iconSize:[20,20],iconAnchor:[10,10]});");
        sb.Append("L.marker([userLat,userLng],{icon:userIcon}).addTo(map);");
        sb.Append("L.circle([userLat,userLng],{color:'#2563EB',fillColor:'#3B82F6',fillOpacity:.08,radius:60,weight:1}).addTo(map);");

        // POI markers (built directly in C# foreach — reliable, no JS complexity)
        foreach (var poi in _pois)
        {
            var isNear = poi.IsNear;
            var isSelected = _selectedPOI?.Id == poi.Id;
            var color = isSelected ? "#FF9800" : (isNear ? "#43A047" : "#EF5350");
            var nearClass = isNear ? "near" : "";
            var selClass = isSelected ? "selected" : "";
            sb.Append($"var pin{poi.Id}=L.divIcon({{html:\"<div class='poi-pin {nearClass} {selClass}'><div class='body' style='background:{color};'>•</div><div class='tail' style='background:{color};'></div></div>\",className:'',iconSize:[36,46],iconAnchor:[18,46]}});");
            sb.Append($"L.marker([{poi.Latitude.ToString(inv)},{poi.Longitude.ToString(inv)}],{{icon:pin{poi.Id}}}).addTo(map).on('click',function(){{window.location='poi://detail/{poi.Id}';}});");
            if (isNear)
                sb.Append($"L.circle([{poi.Latitude.ToString(inv)},{poi.Longitude.ToString(inv)}],{{color:'#43A047',fillColor:'#43A047',fillOpacity:.12,radius:80,weight:1}}).addTo(map);");
        }

        sb.Append("</script></body></html>");
        return sb.ToString();
    }


    private void ShowDetail(POI poi)
    {
        _selectedPOI = poi;
        BindPOIDetailText(poi);
        LblPOIDistance.Text = $"Khoang cach: {poi.Distance:F0}m";
        LblPOICoords.Text = $"{poi.Latitude:F6}, {poi.Longitude:F6}";
        LblPOIDistance.TextColor = poi.IsNear ? Color.FromArgb("#2E7D32") : Color.FromArgb("#607D8B");
        LblAudioStatus.Text = "San sang phat thuyet minh";
        POIDetailPanel.IsVisible = true;
        RefreshMap();
    }

    private void BindPOIDetailText(POI poi)
    {
        LblPOIName.Text = poi.DisplayName;
        LblPOIDescription.Text = poi.DisplayDescription;
    }

    private void OnCloseDetailClicked(object? sender, EventArgs e)
    {
        POIDetailPanel.IsVisible = false;
        _selectedPOI = null;
        _offlineAudioService.Stop();
        RefreshMap();
    }

    private async void OnPlayAudioClicked(object? sender, EventArgs e)
    {
        if (_selectedPOI == null) return;

        try
        {
            BtnPlayAudio.IsEnabled = false;
            AudioLoading.IsRunning = true;
            AudioLoading.IsVisible = true;
            LblAudioStatus.Text = "Dang tai audio...";

            var result = await _offlineAudioService.PlayAsync(_selectedPOI, _selectedLanguage);
            LblAudioStatus.Text = result.Message;
        }
        catch (Exception ex)
        {
            LblAudioStatus.Text = "Lỗi phát audio";
            Debug.WriteLine("[Map] Lỗi play audio: " + ex.Message);
        }
        finally
        {
            AudioLoading.IsRunning = false;
            AudioLoading.IsVisible = false;
            BtnPlayAudio.IsEnabled = true;
        }
    }

    private void OnPauseAudioClicked(object? sender, EventArgs e)
    {
        _offlineAudioService.Pause();
        LblAudioStatus.Text = "Đã tạm dừng";
    }

    private async void OnNavigateClicked(object? sender, EventArgs e)
    {
        if (_selectedPOI == null) return;
        try
        {
            var inv = CultureInfo.InvariantCulture;
            var url = $"https://www.google.com/maps/dir/?api=1&destination={_selectedPOI.Latitude.ToString(inv)},{_selectedPOI.Longitude.ToString(inv)}";
            await Launcher.OpenAsync(new Uri(url));
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[Map] Lỗi chỉ đường: " + ex.Message);
        }
    }

    private void OnReloadPOIClicked(object? sender, EventArgs e)
    {
        _ = LoadPOIsAsync();
    }

    private void OnClearSearchClicked(object? sender, EventArgs e)
    {
        SearchEntry.Text = string.Empty;
        SearchSuggestionsPanel.IsVisible = false;
        BtnClearSearch.IsVisible = false;
        _pois = _allPois;
        UpdatePOIDistances();
        UpdateChips();
        RefreshMap();
    }

    private void OnSearchCompleted(object? sender, EventArgs e)
    {
        _searchDebounceTimer?.Stop();
        _ = SearchAsync();
    }

    private void OnSearchTextChanged(object? sender, TextChangedEventArgs e)
    {
        BtnClearSearch.IsVisible = !string.IsNullOrWhiteSpace(e.NewTextValue);

        if (string.IsNullOrWhiteSpace(e.NewTextValue))
        {
            SearchSuggestionsPanel.IsVisible = false;
            _pois = _allPois;
            UpdatePOIDistances();
            UpdateChips();
            return;
        }

        _searchDebounceTimer?.Stop();
        _searchDebounceTimer?.Start();
    }

    private async Task SearchAsync()
    {
        var query = SearchEntry?.Text?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(query) || query.Length < 1)
        {
            MainThread.BeginInvokeOnMainThread(() => SearchSuggestionsPanel.IsVisible = false);
            return;
        }

        try
        {
            // First try local filter (instant)
            var localResults = _allPois
                .Where(p => p.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                            (p.Description?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (p.Address?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false))
                .OrderBy(p => p.Distance)
                .Take(8)
                .ToList();

            MainThread.BeginInvokeOnMainThread(() => ShowSearchSuggestions(localResults));

            // Also try API for broader results
            try
            {
                var apiResults = await _apiService.SearchRestaurantsAsync(query, _userLat, _userLon);
                if (apiResults.Count > 0)
                {
                    // Merge with local results, dedupe by id
                    var merged = localResults.Concat(
                        apiResults.Where(a => !localResults.Any(l => l.Id == a.Id))
                    ).Take(8).ToList();
                    MainThread.BeginInvokeOnMainThread(() => ShowSearchSuggestions(merged));
                }
            }
            catch { /* silent fail, local results already shown */ }
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[Map] Lỗi tìm kiếm: " + ex.Message);
        }
    }

    private void ShowSearchSuggestions(List<POI> results)
    {
        SearchSuggestionsContainer.Children.Clear();

        if (results.Count == 0)
        {
            SearchSuggestionsPanel.IsVisible = false;
            return;
        }

        for (int i = 0; i < results.Count; i++)
        {
            var poi = results[i];

            // Build the inner card grid before constructing the Frame
            var cardGrid = new Grid
            {
                ColumnDefinitions =
                {
                    new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                    new ColumnDefinition { Width = GridLength.Auto }
                }
            };

            cardGrid.Add(new Label
            {
                Text = poi.Name,
                FontSize = 14,
                FontAttributes = FontAttributes.Bold,
                TextColor = Color.FromArgb("#1A237E")
            }, 0, 0);

            cardGrid.Add(new Label
            {
                Text = poi.Description ?? "",
                FontSize = 11,
                TextColor = Color.FromArgb("#607D8B"),
                MaxLines = 1,
                LineBreakMode = LineBreakMode.TailTruncation
            }, 0, 1);

            var distLabel = new Label
            {
                Text = poi.Distance > 0 ? $"{poi.Distance:F0}m" : "",
                FontSize = 11,
                TextColor = Color.FromArgb("#43A047"),
                FontAttributes = FontAttributes.Bold,
                VerticalOptions = LayoutOptions.Center,
                Margin = new Thickness(8, 0, 0, 0)
            };
            Grid.SetColumn(distLabel, 1);
            cardGrid.Add(distLabel);

            var item = new Frame
            {
                Padding = new Thickness(12, 10),
                BackgroundColor = Colors.Transparent,
                BorderColor = Colors.Transparent,
                HasShadow = false,
                Content = cardGrid
            };

            var tap = new TapGestureRecognizer();
            var capturedId = poi.Id;
            tap.Tapped += (_, _) =>
            {
                SearchSuggestionsPanel.IsVisible = false;
                SearchEntry.Text = poi.Name;
                var found = _pois.FirstOrDefault(p => p.Id == capturedId);
                if (found != null)
                {
                    CenterMapOnPOI(found);
                    ShowDetail(found);
                }
            };
            item.GestureRecognizers.Add(tap);
            SearchSuggestionsContainer.Children.Add(item);

            if (i < results.Count - 1)
            {
                SearchSuggestionsContainer.Children.Add(
                    new BoxView { HeightRequest = 1, Color = Color.FromArgb("#F0F0F0"), Margin = new Thickness(12, 0, 12, 0) }
                );
            }
        }

        SearchSuggestionsPanel.IsVisible = true;
    }

    private async Task LoadPOIsAsync()
    {
        try
        {
            var pois = await _apiService.GetPOIsAsync();
            _allPois = pois;
            _pois = pois;
            UpdatePOIDistances();
            UpdateChips();
            UpdateStatus();
            RefreshMap();
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[Map] Lỗi tải POI: " + ex.Message);
            LblNearestStatus.Text = "Lỗi tải dữ liệu POI";
        }
    }
}

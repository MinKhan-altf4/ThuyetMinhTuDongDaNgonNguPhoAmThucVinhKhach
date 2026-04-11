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
    private const string LangJa = "ja";
    private const string LangKo = "ko";

    // Audio narration language options (TTS audio language)
    private static readonly List<(string Label, string Code)> AudioLanguages =
    [
        ("Tiếng Việt 🇻🇳", LangVi),
        ("English 🇺🇸",    LangEn),
        ("中文 🇨🇳",        LangZh),
        ("日本語 🇯🇵",       LangJa),
        ("한국어 🇰🇷",        LangKo)
    ];

    private List<POI> _allPois = new();
    private List<POI> _pois = new();
    private double _userLat = 10.7598;
    private double _userLon = 106.6982;
    private POI? _selectedPOI;
    private List<Dish> _currentDishes = new();   // ← THÊM MỚI: Danh sách món ăn
    private string _selectedLanguage = LangVi;
    private System.Timers.Timer? _searchDebounceTimer;
    private System.Timers.Timer? _refreshTimer;
    private bool _mapReady = false;
    private int _currentRadius = 1000;
    private string _currentGpsSensitivity = "medium";

    // ── GPS Realtime Tracking ──
    private bool _isTracking = false;
    private CancellationTokenSource? _trackingCts;

    private readonly GeofenceHelper _geofenceHelper = new();
    private readonly GPSTrackingService _gpsTracking = new();
    private readonly CacheService _cacheService = new();
    private readonly APIService _apiService = new();
    private readonly TTSService _ttsService = new();
    private readonly TranslateService _translateService = TranslateService.Instance;

    public MapPage()
    {
        InitializeComponent();
        InitializePage();
        LanguageService.Instance.LanguageChanged += OnAppLanguageChanged;
    }

    private void InitializePage()
    {
        LanguagePicker.ItemsSource = AudioLanguages.Select(x => x.Label).ToList();
        LanguagePicker.SelectedIndex = 0;

        _refreshTimer = new System.Timers.Timer(5000);
        _refreshTimer.Elapsed += (_, _) => MainThread.BeginInvokeOnMainThread(UpdateStatus);

        _searchDebounceTimer = new System.Timers.Timer(400);
        _searchDebounceTimer.AutoReset = false;
        _searchDebounceTimer.Elapsed += async (_, _) => await SearchAsync();

        MapWebView.Navigating += OnWebViewNavigating;
        MapWebView.Navigated += OnWebViewNavigated;

        // Load radius from settings
        _currentRadius = AppSettingsHelper.GetRadius();

        // ── Apply localized strings ONCE at init (before LanguageChanged fires) ──
        ApplyLocalizedStrings();
    }

    /// <summary>
    /// Subscribe vào LanguageService.LanguageChanged — tự động trigger khi user đổi ngôn ngữ.
    /// Đảm bảo Map screen + modal update NGAY lập tức khi đổi ngôn ngữ.
    /// </summary>
    private void OnAppLanguageChanged(object? sender, EventArgs e)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            ApplyLocalizedStrings();
            // Nếu modal đang mở → reload text ngay (không reuse view cũ)
            if (POIDetailPanel.IsVisible && _selectedPOI != null)
            {
                BindPOIDetailText(_selectedPOI);
            }
        });
    }

    /// <summary>
    /// Cập nhật TẤT CẢ text UI từ LanguageService.
    /// Gọi khi: init, language change, OnAppearing.
    /// </summary>
    private void ApplyLocalizedStrings()
    {
        var L = LanguageService.Instance;

        // Title
        Title = L["tab_map"];

        // Search bar hint
        SearchEntry.Placeholder = L["search_placeholder"];

        // Bottom section title
        LblNearbyTitle.Text = L["poi_near_you"];

        // Audio narration language picker
        LblAudioLangLabel.Text = L["audio_narration_language"];
        LanguagePicker.Title = L["select_audio_narration_language"];

        // Navigation button
        BtnNavigate.Text = L["navigate"];

        // Refresh status labels (giữ nguyên nội dung, chỉ cập nhật label)
        UpdateStatus();

        Debug.WriteLine($"[Map] ✅ ApplyLocalizedStrings() done — lang={L.CurrentLanguage}");
    }

    private void OnWebViewNavigated(object? sender, WebNavigatedEventArgs e)
    {
        _mapReady = true;

        if (e.Result == WebNavigationResult.Failure)
        {
            Debug.WriteLine($"[Map] ❌ WebView navigation FAIL: {e.Url}");
        }
        else
        {
            Debug.WriteLine($"[Map] ✅ WebView loaded OK: {e.Url}");
        }

        CheckMapHealthAsync();
    }

    private async void CheckMapHealthAsync()
    {
        try
        {
            var result = await MapWebView.EvaluateJavaScriptAsync(
                "typeof map !== 'undefined' && map !== null ? 'MAP_OK' : 'MAP_NULL'");

            Debug.WriteLine($"[Map] 🩺 Map health: {result}");

            if (result != "MAP_OK")
            {
                Debug.WriteLine("[Map] ⚠️  Leaflet map chưa init — có thể do _pois rỗng hoặc JS lỗi");
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Map] ❌ Map health check lỗi: {ex.Message}");
        }
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        _selectedLanguage = await ResolveDefaultLanguageAsync();
        SetLanguagePickerByCode(_selectedLanguage);

        _gpsTracking.LocationChanged += OnLocationChanged;
        _gpsTracking.LocationError += OnError;

        // Reload radius in case it changed in SettingsPage
        int newRadius = AppSettingsHelper.GetRadius();
        if (newRadius != _currentRadius)
        {
            _currentRadius = newRadius;
            Debug.WriteLine($"[Map] Radius changed to {_currentRadius}m — will refresh map");
        }

        // Reload GPS sensitivity and force restart if it changed
        string newGpsSensitivity = AppSettingsHelper.GetGpsSensitivity();
        if (newGpsSensitivity != _currentGpsSensitivity)
        {
            _currentGpsSensitivity = newGpsSensitivity;
            Debug.WriteLine($"[Map] GPS sensitivity changed to {_currentGpsSensitivity} — will restart tracking with new interval");
            StopTracking();
        }

        // Apply localized strings on each appear (handles language changes from other pages)
        ApplyLocalizedStrings();

        // Load POIs FIRST, then render map
        await LoadPOIsAsync();

        // Build and show the map immediately after POIs are loaded
        RefreshMap();

        _refreshTimer?.Start();

        // Start realtime tracking loop
        _ = StartTrackingAsync();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        LanguageService.Instance.LanguageChanged -= OnAppLanguageChanged;
        StopTracking();
        _refreshTimer?.Stop();
        _searchDebounceTimer?.Stop();
        _gpsTracking.LocationChanged -= OnLocationChanged;
        _gpsTracking.LocationError -= OnError;
        _gpsTracking.StopTracking();
        _ttsService.Stop();
        _mapReady = false;
    }

    private async Task<string> ResolveDefaultLanguageAsync()
    {
        var saved = await _cacheService.GetPreferredLanguageAsync();
        if (!string.IsNullOrWhiteSpace(saved) && AudioLanguages.Any(l => l.Code == saved))
            return saved;

        var locale = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.ToLowerInvariant();
        if (AudioLanguages.Any(l => l.Code == locale))
            return locale;

        return _userLat is >= 8 and <= 24 && _userLon is >= 102 and <= 110
            ? LangVi
            : LangEn;
    }

    private void SetLanguagePickerByCode(string languageCode)
    {
        var index = AudioLanguages.FindIndex(l => l.Code == languageCode);
        LanguagePicker.SelectedIndex = Math.Max(0, index);
    }

    private async void OnAudioLanguageChanged(object? sender, EventArgs e)
    {
        if (LanguagePicker.SelectedIndex < 0 || LanguagePicker.SelectedIndex >= AudioLanguages.Count)
            return;

        _selectedLanguage = AudioLanguages[LanguagePicker.SelectedIndex].Code;
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
            UpdateUserMarker();
        });
    }

    private void OnError(object? sender, string err)
    {
        var L = LanguageService.Instance;
        MainThread.BeginInvokeOnMainThread(() =>
        {
            LblUserStatus.Text = L.Get("gps_error", err);
        });
    }

    private void OnWebViewNavigating(object? sender, WebNavigatingEventArgs e)
    {
        try
        {
            var url = e.Url ?? string.Empty;

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
            poi.IsNear = poi.Distance < 400;
        }
        _pois = _pois.OrderBy(p => p.Distance).ToList();
    }

    private void UpdateStatus()
    {
        var L = LanguageService.Instance;

        LblUserStatus.Text = string.Format(
            L["nearby_location"],
            _userLat.ToString("F6", CultureInfo.InvariantCulture),
            _userLon.ToString("F6", CultureInfo.InvariantCulture));

        var nearest = _pois.FirstOrDefault();
        if (nearest == null)
        {
            LblNearestStatus.Text = L["no_poi_data"];
            return;
        }

        var icon = nearest.Distance < 400 ? "🎯" : (nearest.Distance <= 1000 ? "📍" : "📌");
        LblNearestStatus.Text = string.Format(
            L["poi_nearby_marker"],
            $"{icon} {nearest.DisplayName}",
            nearest.Distance.ToString("F0", CultureInfo.InvariantCulture));
    }

    private void UpdateChips()
    {
        POIChipsContainer.Children.Clear();

        var L = LanguageService.Instance;
        foreach (var poi in _pois.Take(6))
        {
            string distIcon = poi.Distance < 400 ? "🎯" : (poi.Distance <= 1000 ? "📍" : "📌");
            Color bgColor = poi.Distance < 400 ? Color.FromArgb("#E8F5E9") : (poi.Distance <= 1000 ? Color.FromArgb("#FFF3E0") : Color.FromArgb("#F5F7FA"));
            Color borderColor = poi.Distance < 400 ? Color.FromArgb("#43A047") : (poi.Distance <= 1000 ? Color.FromArgb("#FF9800") : Color.FromArgb("#CFD8DC"));

            var chip = new Frame
            {
                BackgroundColor = bgColor,
                BorderColor = borderColor,
                CornerRadius = 16,
                Padding = new Thickness(10, 6),
                HasShadow = false,
                Content = new VerticalStackLayout
                {
                    Spacing = 2,
                    Children =
                    {
                        new Label { Text = poi.Name, FontSize = 11, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#263238") },
                        new Label { Text = $"{distIcon} {poi.Distance:F0}{L["meters"]}", FontSize = 10, TextColor = Color.FromArgb("#607D8B") }
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

    // ═══════════════════════════════════════════════════════
    // GPS REALTIME TRACKING LOOP
    // ═══════════════════════════════════════════════════════

    private async Task StartTrackingAsync()
    {
        if (_isTracking) return;
        if (!_mapReady)
        {
            Debug.WriteLine("[Map] Tracking: chờ map ready...");
            await Task.Delay(1000);
            if (!_mapReady) return;
        }

        _isTracking = true;
        _trackingCts = new CancellationTokenSource();
        Debug.WriteLine($"[Map] ▶ Tracking bắt đầu (interval: {AppSettingsHelper.GetGpsIntervalMs()}ms, accuracy: {AppSettingsHelper.GetGpsAccuracy()})");

        try
        {
            while (_isTracking && !_trackingCts.Token.IsCancellationRequested)
            {
                try
                {
                    var location = await Geolocation.GetLocationAsync(new GeolocationRequest
                    {
                        DesiredAccuracy = AppSettingsHelper.GetGpsAccuracy(),
                        Timeout = TimeSpan.FromSeconds(10)
                    });

                    if (location != null)
                    {
                        _userLat = location.Latitude;
                        _userLon = location.Longitude;
                        UpdatePOIDistances();

                        MainThread.BeginInvokeOnMainThread(() =>
                        {
                            UpdateChips();
                            UpdateStatus();
                            UpdateUserMarker();
                        });
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"[Map] Tracking loop lỗi: {ex.Message}");
                }

                await Task.Delay(AppSettingsHelper.GetGpsIntervalMs(), _trackingCts.Token);
            }
        }
        catch (OperationCanceledException)
        {
            Debug.WriteLine("[Map] Tracking bị hủy");
        }
        finally
        {
            _isTracking = false;
            _trackingCts?.Dispose();
            _trackingCts = null;
        }
    }

    private void StopTracking()
    {
        if (!_isTracking) return;
        _isTracking = false;
        _trackingCts?.Cancel();
        Debug.WriteLine("[Map] ■ Tracking đã dừng");
    }

    private void UpdateUserMarker()
    {
        if (!_mapReady) return;
        var inv = CultureInfo.InvariantCulture;
        _ = MapWebView.EvaluateJavaScriptAsync($@"
if(window.map && window._userMarker){{
  window._userMarker.setLatLng([{_userLat.ToString(inv)},{_userLon.ToString(inv)}]);
  window.userLat={_userLat.ToString(inv)};
  window.userLng={_userLon.ToString(inv)};
}}");
    }

    private void RefreshMap()
    {
        MapWebView.Source = new HtmlWebViewSource { Html = BuildMapHtml() };
    }

    private void CenterMapOnPOI(POI poi)
    {
        if (!_mapReady) return;
        var inv = CultureInfo.InvariantCulture;
        var js = $@"
if(window.map){{
  var targetZoom=Math.min(map.getZoom()+2,19);
  map.flyTo([{poi.Latitude.ToString(inv)},{poi.Longitude.ToString(inv)}],targetZoom,{{animate:true,duration:1.2}});
  if(window._lastSelected!=={poi.Id}){{
    var prev=document.querySelector('.poi-pin.selected');
    if(prev){{prev.classList.remove('selected');var prevBody=prev.querySelector('.body');if(prevBody)prevBody.style.boxShadow='';}}
    var cur=document.querySelector('[data-poi-id=""{poi.Id}""]');
    if(cur){{cur.classList.add('selected');var curBody=cur.querySelector('.body');if(curBody)curBody.style.boxShadow='0 0 0 8px rgba(255,152,0,.3),0 4px 12px rgba(0,0,0,.3)';}}
    window._lastSelected={poi.Id};
  }}
}}";
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
        sb.Append(".leaflet-control-zoom{top:12px!important;right:12px!important;left:auto!important;bottom:auto!important;box-shadow:0 4px 12px rgba(0,0,0,.18)!important;border-radius:10px!important;overflow:hidden!important;}.leaflet-control-zoom a{width:40px!important;height:40px!important;line-height:40px!important;font-size:20px!important;border-radius:0!important;border:none!important;background:#fff!important;color:#1E3A8A!important;}.leaflet-control-zoom a:first-child{border-radius:10px 10px 0 0!important;}.leaflet-control-zoom a:last-child{border-radius:0 0 10px 10px!important;}");
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
        sb.Append(@"
L.Control.Recenter=L.Control.extend({options:{position:'bottomright'},onAdd:function(){
  var btn=L.DomUtil.create('button','leaflet-bar leaflet-control');
  btn.style.cssText='width:44px;height:44px;border-radius:12px;border:none;background:#fff;color:#1565C0;box-shadow:0 4px 12px rgba(0,0,0,.2);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
  btn.innerHTML='&#8853;';
  btn.title='Back to my location';
  btn.addEventListener('click',function(){map.flyTo([userLat,userLng],17,{animate:true,duration:1});});
  return btn;
}});
new L.Control.Recenter().addTo(map);
");
        sb.Append("var userIcon=L.divIcon({html:\"<div style='width:20px;height:20px;border-radius:10px;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 12px rgba(37,99,235,.15)'></div>\",className:'',iconSize:[20,20],iconAnchor:[10,10]});");
        sb.Append("window._userMarker=L.marker([userLat,userLng],{icon:userIcon}).addTo(map);");
        sb.Append("L.circle([userLat,userLng],{color:'#2563EB',fillColor:'#3B82F6',fillOpacity:.08,radius:60,weight:1}).addTo(map);");

        foreach (var poi in _pois)
        {
            var dist = poi.Distance;
            var withinRadius = dist <= _currentRadius;
            var isNear = dist < 400;
            var isMedium = dist >= 400 && dist <= 1000;
            var isFar = dist > 1000;
            var isSelected = _selectedPOI?.Id == poi.Id;

            string color;
            if (isSelected) color = "#FF9800";
            else if (isNear) color = "#43A047";
            else if (isMedium) color = "#FF9800";
            else color = "#EF5350";

            var nearClass = isNear ? "near" : "";
            var selClass = isSelected ? "selected" : "";
            var markerOpacity = withinRadius ? 1.0 : 0.0;
            sb.Append($"var pin{poi.Id}=L.divIcon({{html:\"<div class='poi-pin {nearClass} {selClass}' data-poi-id='{poi.Id}' data-dist='{dist:F0}'><div class='body' style='background:{color};'>•</div><div class='tail' style='background:{color};'></div></div>\",className:'',iconSize:[36,46],iconAnchor:[18,46]}});");
            sb.Append($"L.marker([{poi.Latitude.ToString(inv)},{poi.Longitude.ToString(inv)}],{{icon:pin{poi.Id},riseOnHover:true,opacity:{markerOpacity}}}).addTo(map).on('click',function(){{window.location='poi://detail/{poi.Id}';}});");

            if (isNear && withinRadius)
                sb.Append($"L.circle([{poi.Latitude.ToString(inv)},{poi.Longitude.ToString(inv)}],{{color:'#43A047',fillColor:'#43A047',fillOpacity:.12,radius:80,weight:1}}).addTo(map);");
        }

        sb.Append("</script></body></html>");
        return sb.ToString();
    }

    /// <summary>
    /// Hiện modal POI detail. Mỗi lần mở → load lại text từ LanguageService (không reuse view cũ).
    /// THÊM MỚI: Load danh sách món ăn async.
    /// </summary>
    private void ShowDetail(POI poi)
    {
        _selectedPOI = poi;

        // Load text từ LanguageService — đảm bảo modal luôn dùng ngôn ngữ hiện tại
        BindPOIDetailText(poi);

        var L = LanguageService.Instance;
        LblPOIDistance.Text = L.Get("distance_format", poi.Distance.ToString("F0", CultureInfo.InvariantCulture));
        LblPOICoords.Text = $"{poi.Latitude:F6}, {poi.Longitude:F6}";
        LblPOIDistance.TextColor = poi.Distance < 400 ? Color.FromArgb("#43A047") : (poi.Distance <= 1000 ? Color.FromArgb("#FF9800") : Color.FromArgb("#EF5350"));
        LblAudioStatus.Text = L["audio_ready"];

        POIDetailPanel.IsVisible = true;

        // ── THÊM MỚI: Load danh sách món ăn (async, không block UI) ──
        _ = LoadDishesAsync(poi.Id);
    }

    private void BindPOIDetailText(POI poi)
    {
        // Reload all text from LanguageService — handles language changes even while modal is open
        var L = LanguageService.Instance;
        LblPOIName.Text = poi.DisplayName;
        LblPOIDescription.Text = poi.DisplayDescription;
        BtnPlayAudio.Text = L["play"];
        BtnPauseAudio.Text = L["pause"];
    }

    private void OnCloseDetailClicked(object? sender, EventArgs e)
    {
        POIDetailPanel.IsVisible = false;
        _selectedPOI = null;
        _currentDishes.Clear();   // ← THÊM MỚI: Reset menu
        _ttsService.Stop();       // ← Stop description TTS
        _ttsService.StopMenu();   // ← THÊM MỚI: Stop menu TTS
        if (_mapReady)
        {
            MapWebView.EvaluateJavaScriptAsync(@"
if(window._lastSelected!==undefined){
  var el=document.querySelector('[data-poi-id=""'+window._lastSelected+'""]');
  if(el){el.classList.remove('selected');var body=el.querySelector('.body');if(body)body.style.boxShadow='';}
  window._lastSelected=null;
}");
        }
    }

    private async void OnPlayAudioClicked(object? sender, EventArgs e)
    {
        if (_selectedPOI == null) return;

        var L = LanguageService.Instance;

        try
        {
            BtnPlayAudio.IsEnabled = false;
            AudioLoading.IsRunning = true;
            AudioLoading.IsVisible = true;
            LblAudioStatus.Text = L["audio_loading"];

            // ── THÊM MỚI: Ghép menu vào description TTS ──
            var originalText = $"{_selectedPOI.Name}. {_selectedPOI.Description}";
            var menuText = BuildMenuText(_currentDishes);
            if (!string.IsNullOrWhiteSpace(menuText))
                originalText += " " + menuText;
            
            var lang = _selectedLanguage;

            if (lang == LangVi)
            {
                LblAudioStatus.Text = L["audio_playing_tts_vi"];
                await _ttsService.SpeakAsync(originalText, LangVi);
                LblAudioStatus.Text = L.Get("audio_playing_tts_done", "Tiếng Việt");
            }
            else
            {
                LblAudioStatus.Text = L["audio_translating"];
                var translatedText = await _translateService.TranslateAsync(originalText, lang);
                LblAudioStatus.Text = L["audio_playing"];
                await _ttsService.SpeakAsync(translatedText, lang);
                LblAudioStatus.Text = L.Get("audio_playing_tts_done", lang.ToUpperInvariant());
            }
        }
        catch (Exception ex)
        {
            LblAudioStatus.Text = L["audio_error"];
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
        _ttsService.Stop();
        LblAudioStatus.Text = LanguageService.Instance["audio_paused"];
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

    // ═════════════════════════════════════════════════════════════
    // THÊM MỚI: MENU MÓN ĂN - LOAD + RENDER + TTS
    // ═════════════════════════════════════════════════════════════

    /// <summary>
    /// Load danh sách món ăn từ API.
    /// THÊM MỚI: Async load dishes khi người dùng mở modal POI.
    /// </summary>
    private async Task LoadDishesAsync(int restaurantId)
    {
        try
        {
            // Reset UI
            MenuItemsContainer.Clear();
            _currentDishes.Clear();
            MenuLoading.IsRunning = true;
            MenuLoading.IsVisible = true;
            MenuScrollView.IsVisible = false;
            MenuButtonsGrid.IsVisible = false;
            LblMenuEmpty.IsVisible = false;
            LblMenuStatus.Text = "";

            Debug.WriteLine($"[MAP-MENU] Loading dishes for restaurant #{restaurantId}...");

            // Gọi API
            var dishes = await _apiService.GetDishesAsync(restaurantId);

            if (dishes == null || dishes.Count == 0)
            {
                Debug.WriteLine($"[MAP-MENU] ⚠️ Không tìm thấy món ăn cho restaurant #{restaurantId}");
                LblMenuEmpty.IsVisible = true;
                MenuLoading.IsVisible = false;
                return;
            }

            // Lưu danh sách
            _currentDishes = dishes;
            Debug.WriteLine($"[MAP-MENU] ✅ Nhận {dishes.Count} món ăn");

            // Render UI
            BindMenuUI(dishes);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[MAP-MENU] ❌ Lỗi load dishes: {ex.Message}");
            LblMenuEmpty.IsVisible = true;
            LblMenuEmpty.Text = "Lỗi tải menu";
        }
        finally
        {
            MenuLoading.IsRunning = false;
            MenuLoading.IsVisible = false;
        }
    }

    /// <summary>
    /// Render danh sách món ăn vào UI.
    /// THÊM MỚI: Hiển thị name + price cho từng món.
    /// </summary>
    private void BindMenuUI(List<Dish> dishes)
    {
        MenuItemsContainer.Clear();

        foreach (var dish in dishes)
        {
            // Tạo item layout: name | price
            var itemLayout = new VerticalStackLayout
            {
                Spacing = 2,
                Padding = new Thickness(4)
            };

            // Tên món
            var nameLabel = new Label
            {
                Text = dish.Name,
                FontSize = 12,
                FontAttributes = FontAttributes.Bold,
                TextColor = Color.FromArgb("#0D47A1"),
                LineBreakMode = LineBreakMode.WordWrap
            };
            itemLayout.Add(nameLabel);

            // Mô tả (nếu có)
            if (!string.IsNullOrWhiteSpace(dish.Description))
            {
                var descLabel = new Label
                {
                    Text = dish.Description,
                    FontSize = 11,
                    TextColor = Color.FromArgb("#555555"),
                    MaxLines = 2,
                    LineBreakMode = LineBreakMode.TailTruncation
                };
                itemLayout.Add(descLabel);
            }

            // Giá
            var priceLabel = new Label
            {
                Text = dish.FormattedPrice,
                FontSize = 11,
                FontAttributes = FontAttributes.Bold,
                TextColor = Color.FromArgb("#FF9800")
            };
            itemLayout.Add(priceLabel);

            // Thêm item vào container
            MenuItemsContainer.Add(itemLayout);

            // Thêm đường căn giữa
            var separator = new BoxView
            {
                HeightRequest = 1,
                Color = Color.FromArgb("#E0E0E0"),
                Margin = new Thickness(0, 4)
            };
            MenuItemsContainer.Add(separator);
        }

        // Show menu + buttons
        MenuScrollView.IsVisible = true;
        MenuButtonsGrid.IsVisible = true;
        LblMenuEmpty.IsVisible = false;
        LblMenuStatus.Text = "";

        Debug.WriteLine($"[MAP-MENU] ✅ Rendered {dishes.Count} menu items");
    }

    /// <summary>
    /// Phát TTS menu (danh sách tất cả món ăn).
    /// THÊM MỚI: Gọi TTSService.SpeakMenuAsync() với danh sách dishes.
    /// </summary>
    private async void OnPlayMenuClicked(object? sender, EventArgs e)
    {
        if (_currentDishes == null || _currentDishes.Count == 0)
        {
            LblMenuStatus.Text = "Chưa có menu";
            Debug.WriteLine("[MAP-MENU] OnPlayMenuClicked: _currentDishes rỗng");
            return;
        }

        try
        {
            BtnPlayMenu.IsEnabled = false;
            LblMenuStatus.Text = "Đang phát menu...";
            Debug.WriteLine($"[MAP-MENU] OnPlayMenuClicked: Phát {_currentDishes.Count} món, lang={_selectedLanguage}");

            // Gọi TTS menu (riêng biệt, không ảnh hưởng TTS description)
            await _ttsService.SpeakMenuAsync(_currentDishes, _selectedLanguage);

            LblMenuStatus.Text = "Phát xong menu";
            Debug.WriteLine("[MAP-MENU] OnPlayMenuClicked: Phát xong");
        }
        catch (OperationCanceledException)
        {
            LblMenuStatus.Text = "Đã dừng menu";
            Debug.WriteLine("[MAP-MENU] OnPlayMenuClicked: Bị hủy");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[MAP-MENU] ❌ Lỗi phát menu: {ex.GetType().Name} - {ex.Message}");
            LblMenuStatus.Text = $"Lỗi: {ex.Message}";
        }
        finally
        {
            BtnPlayMenu.IsEnabled = true;
        }
    }

    /// <summary>
    /// Dừng phát TTS menu.
    /// THÊM MỚI: Gọi TTSService.StopMenu().
    /// </summary>
    private void OnStopMenuClicked(object? sender, EventArgs e)
    {
        _ttsService.StopMenu();
        LblMenuStatus.Text = "Đã dừng";
        Debug.WriteLine("[MAP-MENU] Dừng menu TTS");
    }

    // ═════════════════════════════════════════════════════════════

    /// <summary>
    /// Xây dựng chuỗi text để đọc menu món ăn.
    /// THÊM MỚI: Format: "Menu của quán bao gồm: Món {name}, giá {price} đồng."
    /// </summary>
    private string BuildMenuText(List<Dish> dishes)
    {
        if (dishes == null || dishes.Count == 0)
            return string.Empty;

        var sb = new StringBuilder();
        sb.Append("Menu của quán bao gồm: ");

        for (int i = 0; i < dishes.Count; i++)
        {
            var dish = dishes[i];
            sb.Append($"Món {dish.Name}, giá {(long)dish.Price:N0} đồng.");
            
            // Thêm dấu cách giữa các món (ngoại trừ cái cuối)
            if (i < dishes.Count - 1)
                sb.Append(" ");
        }

        var result = sb.ToString();
        Debug.WriteLine($"[MAP-MENU] Xây dựng menu text: {result.Substring(0, Math.Min(80, result.Length))}...");
        return result;
    }

    private void OnReloadPOIClicked(object? sender, EventArgs e)
    {
        _ = LoadPOIsAsync();
    }

    private void OnZoomInClicked(object? sender, EventArgs e)
    {
        if (!_mapReady) return;
        MapWebView.EvaluateJavaScriptAsync("if(window.map){map.zoomIn();}");
    }

    private void OnZoomOutClicked(object? sender, EventArgs e)
    {
        if (!_mapReady) return;
        MapWebView.EvaluateJavaScriptAsync("if(window.map){map.zoomOut();}");
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
            Debug.WriteLine($"[Map] SearchAsync: query=\"{query}\"");

            List<POI> localResults;
            if (_allPois.Count > 0)
            {
                localResults = _allPois
                    .Where(p => p.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                                (p.Description?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false) ||
                                (p.Address?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false))
                    .OrderBy(p => p.Distance)
                    .Take(8)
                    .ToList();

                if (localResults.Count > 0)
                {
                    MainThread.BeginInvokeOnMainThread(() => ShowSearchSuggestions(localResults));
                    return;
                }
            }
            else
            {
                localResults = new List<POI>();
            }

            // Call API search
            var apiResults = await _apiService.SearchRestaurantsAsync(query, _userLat, _userLon);

            if (apiResults.Count > 0)
            {
                var merged = localResults.Concat(
                    apiResults.Where(a => !localResults.Any(l => l.Id == a.Id))
                ).Take(8).ToList();
                MainThread.BeginInvokeOnMainThread(() => ShowSearchSuggestions(merged));
            }
            else if (localResults.Count == 0)
            {
                MainThread.BeginInvokeOnMainThread(() => SearchSuggestionsPanel.IsVisible = false);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Map] ❌ Lỗi tìm kiếm: {ex.Message}");
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

        var L = LanguageService.Instance;

        for (int i = 0; i < results.Count; i++)
        {
            var poi = results[i];

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
                Text = poi.Distance > 0 ? $"{poi.Distance:F0}{L["meters"]}" : "",
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
        var L = LanguageService.Instance;

        try
        {
            var pois = await _apiService.GetPOIsAsync();

            _allPois = pois;
            _pois = pois;

            if (_pois.Count == 0)
            {
                LblNearestStatus.Text = L["no_poi_data_check"];
                return;
            }

            UpdatePOIDistances();
            UpdateChips();
            UpdateStatus();
            RefreshMap();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Map] ❌ Lỗi tải POI: {ex.Message}");
            LblNearestStatus.Text = L["poi_load_error"];
        }
    }
}
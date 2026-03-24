using System.Diagnostics;
using System.Text;
using Microsoft.Maui.Controls;
using POIApp.Models;
using POIApp.Services;

namespace POIApp;

public partial class MapPage : ContentPage
{
    private List<POI> _pois = new();
    private double _userLat = 10.7829;
    private double _userLon = 106.6993;
    private POI? _selectedPOI = null;
    private readonly TTSService _ttsService = new();
    private readonly GeofenceHelper _geofenceHelper = new();
    private readonly GPSTrackingService _gpsTracking = new();
    private readonly System.Timers.Timer _refreshTimer;

    public MapPage()
    {
        InitializeComponent();
        _refreshTimer = new System.Timers.Timer(5000);
        _refreshTimer.Elapsed += (s, e) => MainThread.BeginInvokeOnMainThread(UpdateStatus);

        // Đăng ký bắt URL từ JavaScript
        MapWebView.Navigating += OnWebViewNavigating;
    }

    public MapPage(List<POI> pois, double userLat, double userLon)
    {
        InitializeComponent();
        _pois = pois;
        _userLat = userLat;
        _userLon = userLon;
        _refreshTimer = new System.Timers.Timer(5000);
        _refreshTimer.Elapsed += (s, e) => MainThread.BeginInvokeOnMainThread(UpdateStatus);

        MapWebView.Navigating += OnWebViewNavigating;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        _gpsTracking.LocationChanged += OnLocationChanged;
        _gpsTracking.LocationError += OnError;

        await _gpsTracking.StartTrackingAsync();
        UpdatePOIDistances();
        UpdateChips();
        UpdateStatus();
        RefreshMap();
        _refreshTimer.Start();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _refreshTimer.Stop();
        _gpsTracking.LocationChanged -= OnLocationChanged;
        _gpsTracking.LocationError -= OnError;
        _gpsTracking.StopTracking();
    }

    private void OnLocationChanged(object? sender, Location loc)
    {
        _userLat = loc.Latitude;
        _userLon = loc.Longitude;
        UpdatePOIDistances();

        MainThread.BeginInvokeOnMainThread(() => {
            UpdateChips();
            UpdateStatus();
            RefreshMap();
        });
    }

    private void OnError(object? sender, string err)
    {
        MainThread.BeginInvokeOnMainThread(() => {
            LblUserStatus.Text = "Loi GPS: " + err;
        });
    }

    // ==========================
    // BẮT SỰ KIỆN TỪ JAVASCRIPT
    // ==========================
    private void OnWebViewNavigating(object? sender, WebNavigatingEventArgs e)
    {
        try
        {
            string url = e.Url ?? "";

            // Kiểm tra URL đặc biệt: poi://detail/{id}
            if (url.StartsWith("poi://detail/"))
            {
                e.Cancel = true; // Không navigate thật sự

                string idStr = url.Replace("poi://detail/", "");
                if (int.TryParse(idStr, out int poiId))
                {
                    var poi = _pois.FirstOrDefault(p => p.Id == poiId);
                    if (poi != null)
                    {
                        MainThread.BeginInvokeOnMainThread(() => {
                            ShowDetail(poi);
                        });
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[Map] Loi navigat: " + ex.Message);
        }
    }

    private void UpdatePOIDistances()
    {
        foreach (var p in _pois)
        {
            p.Distance = _geofenceHelper.CalculateDistance(_userLat, _userLon, p.Latitude, p.Longitude);
            p.IsNear = p.Distance < 50;
        }
        _pois = _pois.OrderBy(p => p.Distance).ToList();
    }

    private void UpdateStatus()
    {
        LblUserStatus.Text = "📍 " + _userLat.ToString("F6") + ", " + _userLon.ToString("F6");
        var n = _pois.FirstOrDefault();
        if (n != null)
        {
            LblNearestStatus.Text = n.IsNear
                ? "🎯 " + n.Name + " (" + n.Distance.ToString("F0") + "m)"
                : "📍 " + n.Name + " (" + n.Distance.ToString("F0") + "m)";
        }
    }

    private void UpdateChips()
    {
        POIChipsContainer.Children.Clear();
        foreach (var p in _pois.Take(5))
        {
            string bg = p.IsNear ? "#E8F5E9" : "#F5F5F5";
            string bc = p.IsNear ? "#4CAF50" : "#DDD";
            string fc = p.IsNear ? "#2E7D32" : "#333";
            string dist = p.IsNear ? "🎯 " + p.Distance.ToString("F0") + "m" : p.Distance.ToString("F0") + "m";

            var f = new Frame {
                BackgroundColor = Color.FromArgb(bg),
                BorderColor = Color.FromArgb(bc),
                CornerRadius = 15, Padding = new Thickness(10, 6),
                HasShadow = false,
                Content = new VerticalStackLayout { Spacing = 2, Children = {
                    new Label { Text = p.Name, FontSize = 11, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb(fc) },
                    new Label { Text = dist, FontSize = 10, TextColor = Color.FromArgb("#666") }
                }}
            };

            var tap = new TapGestureRecognizer();
            tap.Tapped += (s, e) => ShowDetail(p);
            f.GestureRecognizers.Add(tap);
            POIChipsContainer.Children.Add(f);
        }
    }

    private void RefreshMap()
    {
        string html = BuildMapHTML();
        MapWebView.Source = new HtmlWebViewSource { Html = html };
    }

    private string BuildMapHTML()
    {
        var inv = System.Globalization.CultureInfo.InvariantCulture;
        var nearest = _pois.FirstOrDefault();

        double cLat = nearest != null ? (_userLat + nearest.Latitude) / 2 : _userLat;
        double cLon = nearest != null ? (_userLon + nearest.Longitude) / 2 : _userLon;

        var sb = new StringBuilder();

        // HTML head
        sb.Append(@"<!DOCTYPE html><html><head>");
        sb.Append(@"<meta charset=""utf-8""/>");
        sb.Append(@"<meta name=""viewport"" content=""width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no""/>");
        sb.Append(@"<link rel=""stylesheet"" href=""https://unpkg.com/leaflet@1.9.4/dist/leaflet.css""/>");
        sb.Append(@"<script src=""https://unpkg.com/leaflet@1.9.4/dist/leaflet.js""></script>");
        sb.Append(@"<style>");
        sb.Append(@"* { margin:0; padding:0; box-sizing:border-box; }");
        sb.Append(@"html, body, #map { height:100%; width:100%; }");
        sb.Append(@"</style></head><body>");

        sb.Append(@"<div id=""map""></div>");

        sb.Append(@"<script>");
        sb.Append("var map = L.map('map').setView([" + cLat.ToString(inv) + "," + cLon.ToString(inv) + "], 16);");
        sb.Append("L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);");

        // User marker
        sb.Append("var uLat = " + _userLat.ToString(inv) + ";");
        sb.Append("var uLng = " + _userLon.ToString(inv) + ";");
        sb.Append("L.marker([uLat, uLng]).addTo(map).bindPopup('<b>📍 Vi tri cua ban</b>');");
        sb.Append("L.circle([uLat, uLng], { color: '#2196F3', fillColor: '#2196F3', fillOpacity: 0.1, radius: 50 }).addTo(map);");

        // POI markers - tap sẽ mở chi tiết
        foreach (var p in _pois)
        {
            bool isN = p.Id == nearest?.Id;
            string color = isN ? "#4CAF50" : "#F44336";
            int sz = isN ? 32 : 24;

            sb.Append("var icon" + p.Id + " = L.divIcon({");
            sb.Append("html: '<div style=\"background:" + color + ";width:" + sz + "px;height:" + sz + "px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);\"></div>',");
            sb.Append("iconSize: [" + sz + ", " + sz + "], ");
            sb.Append("iconAnchor: [" + (sz/2) + ", " + (sz/2) + "]");
            sb.Append("});");

            // Tap marker -> moChiTiet(id)
            sb.Append("L.marker([" + p.Latitude.ToString(inv) + ", " + p.Longitude.ToString(inv) + "], { icon: icon" + p.Id + " }).addTo(map).on('click', function() { window.location = 'poi://detail/" + p.Id + "'; });");

            // Highlight circle
            if (isN)
            {
                sb.Append("L.circle([" + p.Latitude.ToString(inv) + ", " + p.Longitude.ToString(inv) + "], { color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 0.15, radius: 50 }).addTo(map);");
            }
        }

        sb.Append("</script></body></html>");

        return sb.ToString();
    }

    private void ShowDetail(POI p)
    {
        _selectedPOI = p;
        LblPOIName.Text = p.Name;
        LblPOIDescription.Text = p.Description;
        LblPOIDistance.Text = "Khoang cach: " + p.Distance.ToString("F0") + "m";
        LblPOICoords.Text = p.Latitude.ToString("F6") + ", " + p.Longitude.ToString("F6");
        LblPOIDistance.TextColor = p.IsNear ? Color.FromArgb("#2E7D32") : Color.FromArgb("#666");
        POIDetailPanel.IsVisible = true;
    }

    private void OnCloseDetailClicked(object? sender, EventArgs e)
    {
        POIDetailPanel.IsVisible = false;
        _selectedPOI = null;
    }

    private async void OnThuyetMinhClicked(object? sender, EventArgs e)
    {
        if (_selectedPOI != null)
            await _ttsService.SpeakAsync(_selectedPOI.Name + ". " + _selectedPOI.Description);
    }

    private async void OnNavigateClicked(object? sender, EventArgs e)
    {
        if (_selectedPOI == null) return;
        try
        {
            var inv = System.Globalization.CultureInfo.InvariantCulture;
            var url = "https://www.google.com/maps/dir/?api=1&destination=" +
                _selectedPOI.Latitude.ToString(inv) + "," + _selectedPOI.Longitude.ToString(inv);
            await Launcher.OpenAsync(new Uri(url));
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[Map] loi: " + ex.Message);
        }
    }

    private void OnBackClicked(object? sender, EventArgs e) => Navigation.PopAsync();

    private void OnRefreshClicked(object? sender, EventArgs e)
    {
        UpdatePOIDistances();
        UpdateChips();
        UpdateStatus();
        RefreshMap();
    }
}

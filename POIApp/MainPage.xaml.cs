using System.Diagnostics;
using Microsoft.Maui.Devices.Sensors;
using POIApp.Models;
using POIApp.Services;

namespace POIApp;

/// <summary>
/// MainPage - Tích hợp GPS Tracking thời gian thực
/// - Lấy vị trí liên tục
/// - Cập nhật khoảng cách POI tự động
/// - Trigger TTS khi gần POI
/// </summary>
public partial class MainPage : ContentPage
{
    // =====================================================
    // SERVICES
    // =====================================================
    private readonly LocationService _locationService;
    private readonly TTSService _ttsService;
    private readonly APIService _apiService;
    private readonly GeofenceHelper _geofenceHelper;
    private readonly TTSCooldownHelper _ttsCooldown;
    private readonly CacheService _cacheService;
    private readonly AnalyticsService _analyticsService;
    private readonly GPSTrackingService _gpsTracking;

    // =====================================================
    // BIẾN TRẠNG THÁI
    // =====================================================
    private List<POI> _pois = new();
    private POI? _nearestPOI = null;
    private readonly System.Timers.Timer _uiUpdateTimer;

    public MainPage()
    {
        InitializeComponent();

        // =====================================================
        // KHỞI TẠO SERVICES
        // =====================================================
        _locationService = new LocationService();
        _ttsService = new TTSService();
        _apiService = new APIService();
        _geofenceHelper = new GeofenceHelper();
        _ttsCooldown = new TTSCooldownHelper(cooldownSeconds: 30);
        _cacheService = new CacheService(cacheExpiryHours: 24);
        _analyticsService = new AnalyticsService(_cacheService);
        _gpsTracking = new GPSTrackingService();

        // =====================================================
        // TIMER: Cập nhật UI định kỳ (mỗi 2 giây)
        // =====================================================
        _uiUpdateTimer = new System.Timers.Timer(2000);
        _uiUpdateTimer.Elapsed += OnUIUpdateTimerTick;

        // Converter
        Resources.Add("NearToColorConverter", new NearToColorConverter());

        // =====================================================
        // ĐĂNG KÝ SỰ KIỆN GPS TRACKING
        // =====================================================
        _gpsTracking.LocationChanged += OnGPSLocationChanged;
        _gpsTracking.LocationError += OnGPSError;
        _gpsTracking.TrackingStateChanged += OnTrackingStateChanged;

        // Load cache analytics
        LoadAnalyticsOnStart();

        // Tải POI
        LoadPOIsAsync();
    }

    // =====================================================
    // KHI TRANG HIỂN THỊ - BẮT ĐẦU GPS TRACKING
    // =====================================================
    protected override async void OnAppearing()
    {
        base.OnAppearing();

        // Bắt đầu tracking
        await _gpsTracking.StartTrackingAsync();

        // Bật timer cập nhật UI
        _uiUpdateTimer.Start();

        Debug.WriteLine("[MainPage] Đã bắt đầu GPS Tracking");
    }

    // =====================================================
    // KHI TRANG ẨN - DỪNG GPS TRACKING
    // =====================================================
    protected override void OnDisappearing()
    {
        base.OnDisappearing();

        // Dừng timer
        _uiUpdateTimer.Stop();

        // Dừng GPS tracking (app vẫn chạy nền nếu cần)
        // _gpsTracking.StopTracking();

        Debug.WriteLine("[MainPage] Timer dừng");
    }

    // =====================================================
    // SỰ KIỆN: GPS LOCATION THAY ĐỔI
    // =====================================================
    private async void OnGPSLocationChanged(object? sender, Location location)
    {
        try
        {
            // Cập nhật tọa độ hiển thị
            MainThread.BeginInvokeOnMainThread(() =>
            {
                LblLocation.Text = "📍 Đang theo dõi...";
                LblCoordinates.Text = $"{location.Latitude:F6}, {location.Longitude:F6}";
                LoadingIndicator.IsRunning = false;
                LoadingIndicator.IsVisible = false;
            });

            // Tính khoảng cách đến tất cả POI
            await UpdatePOIDistancesAsync(location);

            // Kiểm tra POI gần
            await CheckNearPOIAsync(location);
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[MainPage] Lỗi xử lý location: " + ex.Message);
        }
    }

    // =====================================================
    // TIMER: Cập nhật UI định kỳ
    // =====================================================
    private async void OnUIUpdateTimerTick(object? sender, System.Timers.ElapsedEventArgs e)
    {
        try
        {
            var location = _gpsTracking.CurrentLocation;
            if (location == null) return;

            // Chỉ cập nhật UI, không tính lại khoảng cách (đã tính ở event)
            MainThread.BeginInvokeOnMainThread(() =>
            {
                LblCoordinates.Text = $"{location.Latitude:F6}, {location.Longitude:F6}";

                // Cập nhật POI gần nhất
                if (_nearestPOI != null)
                {
                    NearestPOIFrame.IsVisible = true;
                    LblNearestName.Text = _nearestPOI.Name;
                    LblNearestDistance.Text = _nearestPOI.IsNear
                        ? $"🎯 {_nearestPOI.Distance:F0} m (đang gần!)"
                        : $"{_nearestPOI.Distance:F0} m";
                }
            });
        }
        catch { }
    }

    // =====================================================
    // CẬP NHẬT KHOẢNG CÁCH POI
    // =====================================================
    private Task UpdatePOIDistancesAsync(Location location)
    {
        if (_pois.Count == 0) return Task.CompletedTask;

        foreach (var poi in _pois)
        {
            poi.Distance = _geofenceHelper.CalculateDistance(
                location.Latitude, location.Longitude,
                poi.Latitude, poi.Longitude);
            poi.IsNear = poi.Distance < 50;
        }

        // Sắp xếp theo khoảng cách
        _pois = _pois.OrderBy(p => p.Distance).ToList();

        // Cập nhật UI
        MainThread.BeginInvokeOnMainThread(() =>
        {
            POIListView.ItemsSource = null;
            POIListView.ItemsSource = _pois;
        });

        return Task.CompletedTask;
    }

    // =====================================================
    // KIỂM TRA POI GẦN - AUTO TTS
    // =====================================================
    private async Task CheckNearPOIAsync(Location location)
    {
        if (_pois.Count == 0) return;

        _nearestPOI = _pois.FirstOrDefault(p => p.IsNear);

        if (_nearestPOI != null)
        {
            MainThread.BeginInvokeOnMainThread(() =>
            {
                NearestPOIFrame.IsVisible = true;
                LblNearestName.Text = _nearestPOI!.Name;
                LblNearestDistance.Text = $"🎯 {_nearestPOI.Distance:F0} m (đang gần!)";
            });

            // Kiểm tra cooldown trước khi phát
            if (_ttsCooldown.CanPlay(_nearestPOI.Id))
            {
                _ttsCooldown.MarkAsPlayed(_nearestPOI.Id);
                await _analyticsService.RecordListenAsync(_nearestPOI);

                // Phát TTS
                await _ttsService.SpeakAsync(
                    $"Bạn đang ở gần {_nearestPOI.Name}. {_nearestPOI.Description}");

                Debug.WriteLine($"[MainPage] Auto TTS: {_nearestPOI.Name}");
            }
        }
    }

    // =====================================================
    // SỰ KIỆN GPS ERROR
    // =====================================================
    private void OnGPSError(object? sender, string error)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            LblLocation.Text = "⚠️ Lỗi GPS";
            LblCoordinates.Text = error;
        });
    }

    // =====================================================
    // SỰ KIỆN TRACKING STATE
    // =====================================================
    private void OnTrackingStateChanged(object? sender, bool isTracking)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            if (isTracking)
            {
                LblLocation.Text = "📍 Đang theo dõi...";
                BtnTracking.Text = "⏹️ TẮT";
                BtnTracking.BackgroundColor = Color.FromArgb("#F44336");
            }
            else
            {
                LblLocation.Text = "⏸️ Đã dừng tracking";
                BtnTracking.Text = "🚀 BẬT";
                BtnTracking.BackgroundColor = Color.FromArgb("#4CAF50");
            }
        });
    }

    // =====================================================
    // SỰ KIỆN: NÚT BẬT/TẮT GPS TRACKING
    // =====================================================
    private async void OnToggleTrackingClicked(object? sender, EventArgs e)
    {
        if (_gpsTracking.IsTracking)
        {
            // Tắt GPS
            _gpsTracking.StopTracking();
            _uiUpdateTimer.Stop();
        }
        else
        {
            // Bật GPS
            _uiUpdateTimer.Start();
            await _gpsTracking.StartTrackingAsync();
        }
    }

    // =====================================================
    // SỰ KIỆN: NÚT LẤY VỊ TRÍ (MANUAL)
    // =====================================================
    private async void OnGetLocationClicked(object? sender, EventArgs e)
    {
        try
        {
            LoadingIndicator.IsRunning = true;
            LoadingIndicator.IsVisible = true;

            // Lấy vị trí 1 lần
            var location = await _locationService.GetCurrentLocationAsync();

            if (location != null)
            {
                OnGPSLocationChanged(this, location);
            }
            else
            {
                LblLocation.Text = "❌ Không lấy được vị trí";
                LoadingIndicator.IsRunning = false;
                LoadingIndicator.IsVisible = false;
            }
        }
        catch (Exception ex)
        {
            LblLocation.Text = "❌ Lỗi: " + ex.Message;
        }
    }

    // =====================================================
    // SỰ KIỆN: NÚT THUYẾT MINH (MANUAL)
    // =====================================================
    private async void OnThuyetMinhClicked(object? sender, EventArgs e)
    {
        if (sender is Button button && button.CommandParameter is POI poi)
        {
            if (!_ttsCooldown.CanPlay(poi.Id))
            {
                double remaining = _ttsCooldown.GetRemainingCooldownSeconds(poi.Id);
                ShowNotification($"⏳ Chờ {remaining:F0}s trước khi nghe lại");
                return;
            }

            _ttsCooldown.MarkAsPlayed(poi.Id);
            await _analyticsService.RecordListenAsync(poi);
            await _ttsService.SpeakAsync(poi.Name + ". " + poi.Description);
        }
    }

    // =====================================================
    // SỰ KIỆN: MỞ BẢN ĐỒ
    // =====================================================
    private async void OnOpenMapClicked(object? sender, EventArgs e)
    {
        var location = _gpsTracking.CurrentLocation;
        double userLat = location?.Latitude ?? 10.7798;
        double userLon = location?.Longitude ?? 106.6980;

        // Cập nhật khoảng cách
        if (_pois.Count > 0)
        {
            foreach (var poi in _pois)
            {
                poi.Distance = _geofenceHelper.CalculateDistance(
                    userLat, userLon, poi.Latitude, poi.Longitude);
                poi.IsNear = poi.Distance < 50;
            }
        }

        var mapPage = new MapPage(_pois, userLat, userLon);
        await Navigation.PushAsync(mapPage);
    }

    // =====================================================
    // SỰ KIỆN: TẢI LẠI POI
    // =====================================================
    private async void OnReloadPOIClicked(object? sender, EventArgs e)
    {
        _cacheService.ClearPOICache();
        await LoadPOIsAsync();
    }

    // =====================================================
    // TẢI POI TỪ API/CACHE
    // =====================================================
    private async Task LoadPOIsAsync()
    {
        try
        {
            LoadingIndicator.IsRunning = true;
            LoadingIndicator.IsVisible = true;

            // Thử đọc cache trước
            var cached = await _cacheService.GetPOICacheAsync();
            if (cached != null && cached.Count > 0)
            {
                _pois = cached;
                UpdatePOIDisplay();
                ShowNotification($"📌 {_pois.Count} địa điểm (từ cache)");
                LoadingIndicator.IsRunning = false;
                LoadingIndicator.IsVisible = false;
                return;
            }

            // Gọi API
            _pois = await _apiService.GetPOIsAsync();

            // Lưu cache
            if (_pois.Count > 0)
            {
                await _cacheService.SavePOICacheAsync(_pois);
            }

            UpdatePOIDisplay();
            ShowNotification($"📌 Đã tải {_pois.Count} địa điểm");

            // Cập nhật khoảng cách nếu có location
            var loc = _gpsTracking.CurrentLocation;
            if (loc != null)
            {
                await UpdatePOIDistancesAsync(loc);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[MainPage] Lỗi tải POI: " + ex.Message);
            ShowNotification("❌ Lỗi tải POI");
        }
        finally
        {
            LoadingIndicator.IsRunning = false;
            LoadingIndicator.IsVisible = false;
        }
    }

    private void UpdatePOIDisplay()
    {
        POIListView.ItemsSource = null;
        POIListView.ItemsSource = _pois;
    }

    private async void LoadAnalyticsOnStart()
    {
        try
        {
            await _analyticsService.LoadFromCacheAsync();
        }
        catch { }
    }

    // =====================================================
    // HIỂN THỊ THÔNG BÁO
    // =====================================================
    private void ShowNotification(string message)
    {
        NotificationFrame.IsVisible = true;
        LblNotification.Text = message;

        Task.Delay(5000).ContinueWith(_ =>
        {
            MainThread.BeginInvokeOnMainThread(() =>
            {
                NotificationFrame.IsVisible = false;
            });
        });
    }
}

// =====================================================
// CONVERTER
// =====================================================
public class NearToColorConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, System.Globalization.CultureInfo culture)
    {
        if (value is bool isNear && isNear)
            return Color.FromArgb("#C8E6C9");
        return Color.FromArgb("#FFFFFF");
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, System.Globalization.CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

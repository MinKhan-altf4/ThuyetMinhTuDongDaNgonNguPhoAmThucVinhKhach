using System.Diagnostics;
using Microsoft.Maui.Devices.Sensors;

namespace POIApp.Services;

/// <summary>
/// Service GPS Tracking - Lấy vị trí liên tục theo thời gian thực
/// Tối ưu pin: chỉ notify khi di chuyển > 5m
/// </summary>
public class GPSTrackingService : IDisposable
{
    // =====================================================
    // CẤU HÌNH - Tối ưu pin
    // =====================================================
    // Khoảng cách tối thiểu để notify (mét)
    private const double MIN_DISTANCE_METERS = 5;

    // Khoảng thời gian tối thiểu giữa 2 lần cập nhật (ms)
    private const int MIN_TIME_BETWEEN_UPDATES_MS = 3000;

    // =====================================================
    // BIẾN
    // =====================================================
    private bool _isTracking = false;
    private Location? _lastLocation = null;
    private Location? _currentLocation = null;
    private DateTime _lastNotifyTime = DateTime.MinValue;

    // =====================================================
    // SỰ KIỆN
    // =====================================================
    public event EventHandler<Location>? LocationChanged;
    public event EventHandler<string>? LocationError;
    public event EventHandler<bool>? TrackingStateChanged;

    // =====================================================
    // PROPERTIES
    // =====================================================
    public bool IsTracking => _isTracking;
    public Location? CurrentLocation => _currentLocation;

    // =====================================================
    // BẮT ĐẦU TRACKING
    // =====================================================
    public async Task StartTrackingAsync()
    {
        if (_isTracking) return;

        try
        {
            // Kiểm tra quyền GPS
            var status = await Permissions.CheckStatusAsync<Permissions.LocationWhenInUse>();
            if (status != PermissionStatus.Granted)
            {
                status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
                if (status != PermissionStatus.Granted)
                {
                    Debug.WriteLine("[GPS] Không có quyền GPS!");
                    LocationError?.Invoke(this, "Không có quyền truy cập GPS");
                    return;
                }
            }

            _isTracking = true;
            TrackingStateChanged?.Invoke(this, true);
            Debug.WriteLine("[GPS] Bắt đầu tracking...");

            // Đăng ký sự kiện GPS
            Geolocation.LocationChanged += OnGeolocationChanged;

            // Lấy vị trí ban đầu
            await GetInitialLocationAsync();
        }
        catch (Exception ex)
        {
            _isTracking = false;
            Debug.WriteLine("[GPS] Lỗi start: " + ex.Message);
            LocationError?.Invoke(this, ex.Message);
        }
    }

    // =====================================================
    // DỪNG TRACKING
    // =====================================================
    public void StopTracking()
    {
        if (!_isTracking) return;

        _isTracking = false;
        Geolocation.LocationChanged -= OnGeolocationChanged;
        TrackingStateChanged?.Invoke(this, false);
        Debug.WriteLine("[GPS] Đã dừng tracking");
    }

    // =====================================================
    // LẤY VỊ TRÍ BAN ĐẦU
    // =====================================================
    private async Task GetInitialLocationAsync()
    {
        try
        {
            var location = await Geolocation.GetLocationAsync(new GeolocationRequest
            {
                DesiredAccuracy = GeolocationAccuracy.Medium,
                Timeout = TimeSpan.FromSeconds(10)
            });

            if (location != null)
            {
                ProcessNewLocation(location);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[GPS] Lỗi lấy vị trí ban đầu: " + ex.Message);
        }
    }

    // =====================================================
    // SỰ KIỆN GPS THAY ĐỔI
    // =====================================================
    private void OnGeolocationChanged(object? sender, GeolocationLocationChangedEventArgs e)
    {
        try
        {
            if (e.Location != null)
            {
                ProcessNewLocation(e.Location);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[GPS] Lỗi xử lý: " + ex.Message);
        }
    }

    // =====================================================
    // XỬ LÝ VỊ TRÍ MỚI - Tối ưu: chỉ notify khi di chuyển đáng kể
    // =====================================================
    private void ProcessNewLocation(Location location)
    {
        // Lọc accuracy quá kém
        if (location.Accuracy > 100)
        {
            Debug.WriteLine($"[GPS] Accuracy quá kém: {location.Accuracy}m, bỏ qua");
            return;
        }

        _currentLocation = location;

        // Kiểm tra thời gian giữa 2 lần notify
        var now = DateTime.Now;
        var elapsed = (now - _lastNotifyTime).TotalMilliseconds;
        if (elapsed < MIN_TIME_BETWEEN_UPDATES_MS && _lastLocation != null)
        {
            // Vẫn cập nhật current location, nhưng không notify
            Debug.WriteLine($"[GPS] Bỏ qua notify (thời gian < {MIN_TIME_BETWEEN_UPDATES_MS}ms)");
            return;
        }

        // Kiểm tra di chuyển đáng kể
        bool shouldNotify = false;

        if (_lastLocation == null)
        {
            // Lần đầu tiên - luôn notify
            shouldNotify = true;
        }
        else
        {
            double distance = CalculateDistance(
                _lastLocation.Latitude, _lastLocation.Longitude,
                location.Latitude, location.Longitude
            );

            if (distance >= MIN_DISTANCE_METERS)
            {
                shouldNotify = true;
            }
            else
            {
                Debug.WriteLine($"[GPS] Bỏ qua notify (khoảng cách {distance:F1}m < {MIN_DISTANCE_METERS}m)");
            }
        }

        // Notify nếu cần
        if (shouldNotify)
        {
            _lastLocation = location;
            _lastNotifyTime = now;
            LocationChanged?.Invoke(this, location);
            Debug.WriteLine($"[GPS] ✅ Vị trí mới: {location.Latitude:F6}, {location.Longitude:F6} (accuracy: {location.Accuracy:F0}m)");
        }
    }

    // =====================================================
    // CÔNG THỨC HAVERSINE
    // =====================================================
    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000;
        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double d) => d * Math.PI / 180;

    // =====================================================
    // DỌN DẸP
    // =====================================================
    public void Dispose()
    {
        StopTracking();
        GC.SuppressFinalize(this);
    }
}

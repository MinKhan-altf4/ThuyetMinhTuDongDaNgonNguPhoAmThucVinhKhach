using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Service xử lý GPS - Lấy vị trí và tính khoảng cách Haversine
/// </summary>
public class LocationService
{
    /// <summary>
    /// Lấy vị trí hiện tại của user
    /// </summary>
    public async Task<Location?> GetCurrentLocationAsync()
    {
        try
        {
            // =====================================================
            // KIỂM TRA QUYỀN GPS
            // =====================================================
            var status = await Permissions.CheckStatusAsync<Permissions.LocationWhenInUse>();

            if (status != PermissionStatus.Granted)
            {
                status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
                if (status != PermissionStatus.Granted)
                {
                    return null; // Không có quyền GPS
                }
            }

            // =====================================================
            // LẤY VỊ TRÍ
            // =====================================================
            var location = await Geolocation.GetLastKnownLocationAsync();

            if (location == null)
            {
                // Nếu không có last known, yêu cầu lấy mới
                location = await Geolocation.GetLocationAsync(
                    new GeolocationRequest
                    {
                        DesiredAccuracy = GeolocationAccuracy.Medium,
                        Timeout = TimeSpan.FromSeconds(10)
                    }
                );
            }

            return location;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Lỗi GPS: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Tính khoảng cách giữa 2 tọa độ bằng công thức Haversine
    /// Trả về khoảng cách tính bằng mét
    /// </summary>
    public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000; // Bán kính Trái Đất = 6371 km = 6371000 m

        // Chuyển đổi sang radians
        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);

        // Công thức Haversine
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        // Khoảng cách = R * c (mét)
        double distance = R * c;

        return distance;
    }

    /// <summary>
    /// Chuyển độ sang radians
    /// </summary>
    private double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }

    /// <summary>
    /// Tính khoảng cách từ Location đến POI
    /// </summary>
    public double DistanceToPOI(Location location, POI poi)
    {
        return CalculateDistance(
            location.Latitude,
            location.Longitude,
            poi.Latitude,
            poi.Longitude
        );
    }
}

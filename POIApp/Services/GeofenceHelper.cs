using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Helper xử lý Geofence - Tách riêng logic kiểm tra vùng lân cận POI
/// KHÔNG phụ thuộc vào code cũ, có thể gọi độc lập
/// </summary>
public class GeofenceHelper
{
    // =====================================================
    // CẤU HÌNH
    // =====================================================
    // Bán kính thuyết minh (mét)
    private const double GEOFENCE_RADIUS_METERS = 50;

    // =====================================================
    // Kiểm tra user có gần POI không
    // =====================================================
    /// <summary>
    /// Kiểm tra xem vị trí user có trong bán kính POI không
    /// </summary>
    /// <param name="userLat">Vĩ độ user</param>
    /// <param name="userLon">Kinh độ user</param>
    /// <param name="poiLat">Vĩ độ POI</param>
    /// <param name="poiLon">Kinh độ POI</param>
    /// <param name="radiusMeters">Bán kính (mặc định 50m)</param>
    public bool IsWithinRadius(double userLat, double userLon,
                                double poiLat, double poiLon,
                                double radiusMeters = GEOFENCE_RADIUS_METERS)
    {
        double distance = CalculateDistance(userLat, userLon, poiLat, poiLon);
        return distance < radiusMeters;
    }

    // =====================================================
    // Tìm POI gần nhất trong danh sách
    // =====================================================
    /// <summary>
    /// Tìm POI gần nhất từ danh sách
    /// </summary>
    /// <param name="userLat">Vĩ độ user</param>
    /// <param name="userLon">Kinh độ user</param>
    /// <param name="pois">Danh sách POI</param>
    /// <param name="radiusMeters">Bán kính để xem là "gần"</param>
    public POI? FindNearestPOI(double userLat, double userLon,
                               List<POI> pois,
                               double radiusMeters = GEOFENCE_RADIUS_METERS)
    {
        if (pois == null || pois.Count == 0)
            return null;

        POI? nearest = null;
        double minDistance = double.MaxValue;

        foreach (var poi in pois)
        {
            double distance = CalculateDistance(userLat, userLon, poi.Latitude, poi.Longitude);

            // Cập nhật khoảng cách cho POI
            poi.Distance = distance;

            // Tìm gần nhất
            if (distance < minDistance)
            {
                minDistance = distance;
                nearest = poi;
            }
        }

        // Đánh dấu IsNear cho tất cả
        foreach (var poi in pois)
        {
            poi.IsNear = poi.Distance < radiusMeters;
        }

        return nearest;
    }

    // =====================================================
    // Tìm TẤT CẢ POI trong bán kính (nếu user đứng giữa nhiều POI)
    // =====================================================
    /// <summary>
    /// Lấy danh sách tất cả POI trong bán kính
    /// </summary>
    public List<POI> GetPOIsInRadius(double userLat, double userLon,
                                      List<POI> pois,
                                      double radiusMeters = GEOFENCE_RADIUS_METERS)
    {
        if (pois == null || pois.Count == 0)
            return new List<POI>();

        var result = new List<POI>();

        foreach (var poi in pois)
        {
            poi.Distance = CalculateDistance(userLat, userLon, poi.Latitude, poi.Longitude);
            poi.IsNear = poi.Distance < radiusMeters;

            if (poi.IsNear)
            {
                result.Add(poi);
            }
        }

        return result;
    }

    // =====================================================
    // CÔNG THỨC HAVERSINE - Tính khoảng cách 2 điểm
    // =====================================================
    /// <summary>
    /// Tính khoảng cách giữa 2 tọa độ (Haversine)
    /// Trả về khoảng cách tính bằng mét
    /// </summary>
    public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000; // Bán kính Trái Đất = 6371 km = 6371000 m

        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }

    // =====================================================
    // Kiểm tra user có di chuyển đáng kể không (cho GPS tối ưu)
    // =====================================================
    /// <summary>
    /// Kiểm tra xem user đã di chuyển đủ xa so với vị trí cũ chưa
    /// </summary>
    /// <param name="oldLat">Vĩ độ cũ</param>
    /// <param name="oldLon">Kinh độ cũ</param>
    /// <param name="newLat">Vĩ độ mới</param>
    /// <param name="newLon">Kinh độ mới</param>
    /// <param name="minDistance">Khoảng cách tối thiểu để coi là di chuyển (mặc định 10m)</param>
    public bool HasMovedSignificantly(double oldLat, double oldLon,
                                       double newLat, double newLon,
                                       double minDistance = 10)
    {
        double distance = CalculateDistance(oldLat, oldLon, newLat, newLon);
        return distance >= minDistance;
    }

    // =====================================================
    // Chuyển độ sang radians
    // =====================================================
    private double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}

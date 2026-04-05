using System.Diagnostics;
using Microsoft.Maui.Devices.Sensors;

namespace POIApp.Services;

/// <summary>
/// Helper đọc/ghi cài đặt ứng dụng từ Preferences.
/// </summary>
public static class AppSettingsHelper
{
    private const string KeyGpsSensitivity = "gps_sensitivity";
    private const string KeyPoiRadius = "poi_radius";

    // ── GPS Sensitivity ──
    public static string GetGpsSensitivity()
    {
        try
        {
            var val = Preferences.Get(KeyGpsSensitivity, "medium");
            return val == "low" || val == "medium" || val == "high" ? val : "medium";
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Settings] GetGpsSensitivity error: {ex.Message}");
            return "medium";
        }
    }

    public static void SetGpsSensitivity(string value)
    {
        try
        {
            if (value == "low" || value == "medium" || value == "high")
                Preferences.Set(KeyGpsSensitivity, value);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Settings] SetGpsSensitivity error: {ex.Message}");
        }
    }

    /// <summary>Chuyển sensitivity string → GeolocationAccuracy.</summary>
    public static GeolocationAccuracy GetGpsAccuracy()
    {
        return GetGpsSensitivity() switch
        {
            "low" => GeolocationAccuracy.Medium,
            "high" => GeolocationAccuracy.Best,
            _ => GeolocationAccuracy.High
        };
    }

    /// <summary>Chuyển sensitivity string → interval (ms).</summary>
    public static int GetGpsIntervalMs()
    {
        return GetGpsSensitivity() switch
        {
            "low" => 8000,
            "high" => 2000,
            _ => 4000
        };
    }

    // ── POI Radius ──
    public static int GetRadius()
    {
        try
        {
            var val = Preferences.Get(KeyPoiRadius, 1000);
            return IsValidRadius(val) ? val : 1000;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Settings] GetRadius error: {ex.Message}");
            return 1000;
        }
    }

    public static void SetRadius(int value)
    {
        try
        {
            if (IsValidRadius(value))
                Preferences.Set(KeyPoiRadius, value);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Settings] SetRadius error: {ex.Message}");
        }
    }

    private static bool IsValidRadius(int v)
        => v == 200 || v == 500 || v == 1000 || v == 2000;

    // ── API Base URL ──
    private const string KeyApiBaseUrl = "api_base_url";
    private const string DefaultApiBaseUrl = "http://10.0.2.2/POIApi/api.php";

    public static string GetApiBaseUrl()
    {
        try
        {
            var url = Preferences.Get(KeyApiBaseUrl, DefaultApiBaseUrl);
            return string.IsNullOrWhiteSpace(url) ? DefaultApiBaseUrl : url;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Settings] GetApiBaseUrl error: {ex.Message}");
            return DefaultApiBaseUrl;
        }
    }

    public static void SetApiBaseUrl(string value)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(value))
                Preferences.Set(KeyApiBaseUrl, value);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Settings] SetApiBaseUrl error: {ex.Message}");
        }
    }

    // ── Offline Mode ──
    private const string KeyOfflineDataAvailable = "offline_data_available";

    public static bool IsOfflineDataAvailable()
    {
        try
        {
            return Preferences.Get(KeyOfflineDataAvailable, false);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Settings] IsOfflineDataAvailable error: {ex.Message}");
            return false;
        }
    }

    public static void SetOfflineDataAvailable(bool available)
    {
        try
        {
            Preferences.Set(KeyOfflineDataAvailable, available);
            Debug.WriteLine($"[Settings] Offline data flag set to: {available}");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Settings] SetOfflineDataAvailable error: {ex.Message}");
        }
    }
}

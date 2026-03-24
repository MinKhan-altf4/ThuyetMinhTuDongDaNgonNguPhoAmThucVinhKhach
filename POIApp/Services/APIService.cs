using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Json;
using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Service gọi API - Lấy danh sách POI từ MySQL
/// </summary>
public class APIService
{
    private readonly HttpClient _httpClient;

    // =====================================================
    // URL API - Sửa IP này cho đúng với máy tính của bạn
    // =====================================================
    // Khi chạy trên Emulator: dùng 10.0.2.2 (trỏ đến localhost của máy tính)
    // Khi chạy trên Device: dùng IP thật của máy tính (VD: 192.168.1.100)
    // =====================================================
    // =====>>> SỬA IP TẠI ĐÂY <<<=====
    private const string BASE_URL = "http://10.0.2.2/POIApi/";

    public APIService()
    {
        var handler = new HttpClientHandler
        {
            // Cho phép chứng chỉ SSL tự ký (nếu dùng HTTPS)
            ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
        };

        _httpClient = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(10)
        };
    }

    /// <summary>
    /// Lấy danh sách POI từ API
    /// </summary>
    public async Task<List<POI>> GetPOIsAsync()
    {
        try
        {
            Debug.WriteLine($"[API] Đang gọi: {BASE_URL}api.php");

            var response = await _httpClient.GetAsync($"{BASE_URL}api.php");

            if (!response.IsSuccessStatusCode)
            {
                Debug.WriteLine($"[API] Lỗi HTTP: {response.StatusCode}");
                return GetHardcodedPOIs(); // Fallback về hardcode
            }

            var result = await response.Content.ReadFromJsonAsync<POIResponse>();

            if (result == null || !result.Success)
            {
                Debug.WriteLine($"[API] Lỗi: {result?.Error ?? "Không có phản hồi"}");
                return GetHardcodedPOIs(); // Fallback về hardcode
            }

            Debug.WriteLine($"[API] Thành công! Lấy được {result.Count} POI");
            return result.Data;
        }
        catch (HttpRequestException ex)
        {
            Debug.WriteLine($"[API] Lỗi kết nối: {ex.Message}");
            Debug.WriteLine("[API] => Dùng dữ liệu hardcode thay thế");
            return GetHardcodedPOIs(); // Fallback về hardcode
        }
        catch (TaskCanceledException)
        {
            Debug.WriteLine("[API] Timeout! Dùng dữ liệu hardcode");
            return GetHardcodedPOIs(); // Fallback về hardcode
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[API] Lỗi không xác định: {ex.Message}");
            return GetHardcodedPOIs(); // Fallback về hardcode
        }
    }

    /// <summary>
    /// Dữ liệu POI hardcode - Dùng khi API không hoạt động
    /// 3 địa điểm tại TP.HCM
    /// </summary>
    private List<POI> GetHardcodedPOIs()
    {
        return new List<POI>
        {
            new POI
            {
                Id = 1,
                Name = "Nhà thờ Đức Bà",
                Description = "Nhà thờ Đức Bà là một nhà thờ Công giáo nằm trong khu vực quy hoạch của Tòa Đô chính Thành phố Hồ Chí Minh.",
                Latitude = 10.7798,
                Longitude = 106.6980
            },
            new POI
            {
                Id = 2,
                Name = "Dinh Độc Lập",
                Description = "Dinh Độc Lập là trụ sở của Tổng thống Chính phủ Việt Nam Cộng hòa trước năm 1975.",
                Latitude = 10.7731,
                Longitude = 106.6955
            },
            new POI
            {
                Id = 3,
                Name = "Bưu điện Trung tâm TP.HCM",
                Description = "Bưu điện Trung tâm Thành phố Hồ Chí Minh là một công trình kiến trúc Pháp nằm tại Quận 1.",
                Latitude = 10.7800,
                Longitude = 106.6995
            }
        };
    }
}

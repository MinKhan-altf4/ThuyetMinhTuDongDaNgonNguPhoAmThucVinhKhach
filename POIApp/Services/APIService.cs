using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using POIApp.Models;

namespace POIApp.Services;

public class APIService
{
    private readonly HttpClient _httpClient;

    // API base URL - đổi sang food_app
    // Emulator: 10.0.2.2 → máy thật: IP thực
    private const string BASE_URL = "http://10.0.2.2/POIApi/api.php";

    public APIService()
    {
        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true
        };

        _httpClient = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(15)
        };
    }

    // ──────────────────────────────────────────────
    // Lấy tất cả POI (legacy, backward-compatible)
    // ──────────────────────────────────────────────
    public async Task<List<POI>> GetPOIsAsync()
    {
        try
        {
            Debug.WriteLine($"[API] Đang gọi: {BASE_URL}");
            var response = await _httpClient.GetAsync(BASE_URL);

            if (!response.IsSuccessStatusCode)
            {
                Debug.WriteLine($"[API] Lỗi HTTP: {response.StatusCode}");
                return GetHardcodedPOIs();
            }

            var result = await response.Content.ReadFromJsonAsync<POIResponse>();

            if (result == null || !result.Success)
            {
                Debug.WriteLine($"[API] Lỗi: {result?.Error ?? "null"}");
                return GetHardcodedPOIs();
            }

            Debug.WriteLine($"[API] Thành công! {result.Data.Count} POI");
            return result.Data;
        }
        catch (HttpRequestException ex)
        {
            Debug.WriteLine($"[API] Lỗi kết nối: {ex.Message}");
            return GetHardcodedPOIs();
        }
        catch (TaskCanceledException)
        {
            Debug.WriteLine("[API] Timeout!");
            return GetHardcodedPOIs();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[API] Lỗi không xác định: {ex.Message}");
            return GetHardcodedPOIs();
        }
    }

    // ──────────────────────────────────────────────
    // Tìm kiếm autocomplete
    // ──────────────────────────────────────────────
    public async Task<List<POI>> SearchRestaurantsAsync(string query, double? userLat = null, double? userLon = null)
    {
        try
        {
            var url = $"{BASE_URL}?action=search&q={Uri.EscapeDataString(query)}";
            if (userLat.HasValue && userLon.HasValue)
            {
                url += $"&lat={userLat.Value}&lng={userLon.Value}";
            }

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return new List<POI>();

            var json = await response.Content.ReadFromJsonAsync<SearchResponse>();
            return json?.Data ?? new List<POI>();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[API] Lỗi search: {ex.Message}");
            return new List<POI>();
        }
    }

    // ──────────────────────────────────────────────
    // Lấy audio URL theo ngôn ngữ
    // ──────────────────────────────────────────────
    public async Task<AudioInfo?> GetAudioAsync(int restaurantId, string languageCode)
    {
        try
        {
            var url = $"{BASE_URL}?action=audio&restaurant_id={restaurantId}&lang={languageCode}";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return null;

            var result = await response.Content.ReadFromJsonAsync<AudioResponse>();
            return result?.Success == true ? result.Data : null;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[API] Lỗi get audio: {ex.Message}");
            return null;
        }
    }

    // ──────────────────────────────────────────────
    // Lấy danh sách món ăn
    // ──────────────────────────────────────────────
    public async Task<List<Dish>> GetDishesAsync(int restaurantId)
    {
        try
        {
            var url = $"{BASE_URL}?action=dishes&restaurant_id={restaurantId}";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return new List<Dish>();

            var result = await response.Content.ReadFromJsonAsync<DishesResponse>();
            return result?.Data ?? new List<Dish>();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[API] Lỗi get dishes: {ex.Message}");
            return new List<Dish>();
        }
    }

    // ──────────────────────────────────────────────
    // Dữ liệu mẫu (fallback khi API lỗi)
    // ──────────────────────────────────────────────
    private static List<POI> GetHardcodedPOIs()
    {
        return
        [
            new POI
            {
                Id = 1, Name = "Nhà hàng Ngon Quận 1",
                Description = "Nhà hàng chuyên các món Việt Nam truyền thống.",
                Address = "159 Pasteur, Quận 1, TP.HCM",
                Latitude = 10.7769, Longitude = 106.6982,
                Rating = 4.5f, Phone = "028 3822 1234",
                OpenHour = "07:00", CloseHour = "22:00"
            },
            new POI
            {
                Id = 2, Name = "Cơm Tấm Kiều Giang",
                Description = "Quán cơm tấm nổi tiếng với món cơm tấm sườn bì chả.",
                Address = "251 Nguyễn Trãi, Quận 1, TP.HCM",
                Latitude = 10.7803, Longitude = 106.6921,
                Rating = 4.3f, Phone = "028 3823 4567",
                OpenHour = "06:00", CloseHour = "21:00"
            },
            new POI
            {
                Id = 3, Name = "Bún Chả Hà Nội 1968",
                Description = "Chuyên món Bún chả Hà Nội truyền thống từ năm 1968.",
                Address = "48 Lê Lai, Quận 1, TP.HCM",
                Latitude = 10.7879, Longitude = 106.6977,
                Rating = 4.6f, Phone = "028 3824 8888",
                OpenHour = "10:00", CloseHour = "21:30"
            },
            new POI
            {
                Id = 4, Name = "Phở Thìn - Lò Đúc",
                Description = "Phở bò gân đặc trưng Hà Nội, nước dùng trong veo.",
                Address = "10 Lê Thánh Tôn, Quận 1, TP.HCM",
                Latitude = 10.7832, Longitude = 106.7015,
                Rating = 4.7f, Phone = "028 3825 9999",
                OpenHour = "06:30", CloseHour = "20:00"
            },
            new POI
            {
                Id = 5, Name = "Bánh Mì Huỳnh Hoa",
                Description = "Quán bánh mì nổi tiếng nhất Sài Gòn.",
                Address = "26 Lê Thị Riêng, Quận 1, TP.HCM",
                Latitude = 10.7755, Longitude = 106.6944,
                Rating = 4.8f, Phone = "028 3826 1111",
                OpenHour = "06:00", CloseHour = "22:00"
            }
        ];
    }
}

// ──────────────────────────────────────────────
// Response DTOs
// ──────────────────────────────────────────────
public class SearchResponse
{
    [JsonPropertyName("success")] public bool Success { get; set; }
    [JsonPropertyName("data")] public List<POI> Data { get; set; } = new();
    [JsonPropertyName("error")] public string? Error { get; set; }
}

public class AudioResponse
{
    [JsonPropertyName("success")] public bool Success { get; set; }
    [JsonPropertyName("data")] public AudioInfo? Data { get; set; }
    [JsonPropertyName("error")] public string? Error { get; set; }
}

public class DishesResponse
{
    [JsonPropertyName("success")] public bool Success { get; set; }
    [JsonPropertyName("data")] public List<Dish> Data { get; set; } = new();
    [JsonPropertyName("error")] public string? Error { get; set; }
}

public class AudioInfo
{
    [JsonPropertyName("restaurant_id")] public int RestaurantId { get; set; }
    [JsonPropertyName("language")] public string Language { get; set; } = string.Empty;
    [JsonPropertyName("audio_url")] public string AudioUrl { get; set; } = string.Empty;
    [JsonPropertyName("duration")] public int Duration { get; set; }
    [JsonPropertyName("version")] public int Version { get; set; }
}

public class Dish
{
    [JsonPropertyName("id")] public int Id { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
    [JsonPropertyName("price")] public double Price { get; set; }
    [JsonPropertyName("image_url")] public string? ImageUrl { get; set; }
}

using System.Diagnostics;
using System.Globalization;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using POIApp.Models;

namespace POIApp.Services;

public class APIService
{
    private readonly HttpClient _httpClient;

    // API base URL
    // Emulator: 10.0.2.2 → máy thật: IP thực (chạy ipconfig để lấy)
    private const string BASE_URL = "http://10.0.2.2:8080/POIApi/api.php";

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
    // Lấy tất cả POI
    // ──────────────────────────────────────────────
    public async Task<List<POI>> GetPOIsAsync()
    {
        try
        {
            Debug.WriteLine($"[API] ▶ GET {BASE_URL}");

            var response = await _httpClient.GetAsync(BASE_URL);

            // ── BƯỚC 1: Log HTTP status ──
            Debug.WriteLine($"[API] HTTP {(int)response.StatusCode} {response.StatusCode}");

            if (!response.IsSuccessStatusCode)
            {
                Debug.WriteLine($"[API] ❌ HTTP error → KHÔNG dùng hardcode.");
                return new List<POI>();
            }

            // ── BƯỚC 2: Log raw JSON response (QUAN TRỌNG NHẤT) ──
            var rawJson = await response.Content.ReadAsStringAsync();
            Debug.WriteLine($"[API] Raw JSON ({rawJson.Length} bytes):");
            // In tối đa 500 ký tự đầu tiên để dễ đọc
            Debug.WriteLine($"[API]   {rawJson.Substring(0, Math.Min(500, rawJson.Length))}");

            // ── BƯỚC 3: Parse JSON — case-insensitive để khớp với API trả "success" (lowercase) ──
            POIResponse? result;
            try
            {
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,  // ← API trả "success":true (lowercase) → Success (PascalCase) phải khớp
                    Converters = {
                        new Models.StringToIntConverter(),    // "10" → 10
                        new Models.StringToFloatConverter(),   // "4.5" → 4.5f
                        // LatConverter / LngConverter được apply qua [JsonConverter] attribute trên property
                    }
                };
                result = JsonSerializer.Deserialize<POIResponse>(rawJson, options);
            }
            catch (JsonException ex)
            {
                Debug.WriteLine($"[API] ❌ JSON Parse Error: {ex.Message}");
                Debug.WriteLine($"[API]   Raw: {rawJson.Substring(0, Math.Min(200, rawJson.Length))}");
                return new List<POI>();
            }

            // ── BƯỚC 4: Kiểm tra result ──
            if (result == null)
            {
                Debug.WriteLine("[API] ❌ result == null sau deserialize → Trả rỗng.");
                return new List<POI>();
            }

            Debug.WriteLine($"[API] Success={result.Success}, Data count={result.Data.Count}");

            if (!result.Success)
            {
                Debug.WriteLine($"[API] ❌ API success=false: {result.Error ?? "unknown"}");
                return new List<POI>();
            }

            // ── BƯỚC 5: Log raw JSON POI đầu tiên để kiểm tra key ──
            try
            {
                using var doc = JsonDocument.Parse(rawJson);
                var data = doc.RootElement.GetProperty("data");
                if (data.GetArrayLength() > 0)
                {
                    var first = data[0];
                    Debug.WriteLine("[API] 📋 RAW JSON POI đầu tiên:");
                    foreach (var prop in first.EnumerateObject())
                    {
                        Debug.WriteLine($"[API]   key=\"{prop.Name}\" value={prop.Value}");
                    }
                }
            }
            catch (Exception dex)
            {
                Debug.WriteLine($"[API] ⚠️  Lỗi debug log raw JSON: {dex.Message}");
            }

            // ── BƯỚC 5b: Parse lat/lng/audio TỪ RAW JSON (JsonDocument) — khớp mọi key name ──
            try
            {
                using var doc2 = JsonDocument.Parse(rawJson);
                var dataArr = doc2.RootElement.GetProperty("data");
                for (int i = 0; i < dataArr.GetArrayLength(); i++)
                {
                    var elem = dataArr[i];
                    var poi = result.Data[i];

                    // ── lat ──
                    double parsedLat = 0;
                    string latKey = "";
                    try
                    {
                        if (elem.TryGetProperty("latitude", out var latProp))
                        {
                            latKey = "latitude";
                            parsedLat = latProp.ValueKind == JsonValueKind.String
                                ? double.Parse(latProp.GetString()!, CultureInfo.InvariantCulture)
                                : latProp.GetDouble();
                        }
                        else if (elem.TryGetProperty("lat", out var lat2))
                        {
                            latKey = "lat";
                            parsedLat = lat2.ValueKind == JsonValueKind.String
                                ? double.Parse(lat2.GetString()!, CultureInfo.InvariantCulture)
                                : lat2.GetDouble();
                        }
                        poi.Latitude = parsedLat;
                        Debug.WriteLine($"[API]   lat(\"{latKey}\")={parsedLat}");
                    }
                    catch (FormatException fex)
                    {
                        string rawLatVal = elem.TryGetProperty("lat", out var tmp) ? tmp.ToString() ?? "N/A" : (elem.TryGetProperty("latitude", out var tmp2) ? tmp2.ToString() ?? "N/A" : "N/A");
                        Debug.WriteLine($"[API] ❌ Parse lat lỗi format: \"{rawLatVal}\" → {fex.Message}");
                    }

                    // ── lng ──
                    double parsedLng = 0;
                    string lngKey = "";
                    try
                    {
                        if (elem.TryGetProperty("longitude", out var lngProp))
                        {
                            lngKey = "longitude";
                            parsedLng = lngProp.ValueKind == JsonValueKind.String
                                ? double.Parse(lngProp.GetString()!, CultureInfo.InvariantCulture)
                                : lngProp.GetDouble();
                        }
                        else if (elem.TryGetProperty("lng", out var lng2))
                        {
                            lngKey = "lng";
                            parsedLng = lng2.ValueKind == JsonValueKind.String
                                ? double.Parse(lng2.GetString()!, CultureInfo.InvariantCulture)
                                : lng2.GetDouble();
                        }
                        poi.Longitude = parsedLng;
                        Debug.WriteLine($"[API]   lng(\"{lngKey}\")={parsedLng}");
                    }
                    catch (FormatException fex)
                    {
                        string rawLngVal = elem.TryGetProperty("lng", out var tmp) ? tmp.ToString() ?? "N/A" : (elem.TryGetProperty("longitude", out var tmp2) ? tmp2.ToString() ?? "N/A" : "N/A");
                        Debug.WriteLine($"[API] ❌ Parse lng lỗi format: \"{rawLngVal}\" → {fex.Message}");
                    }

                    // ── audio ──
                    string? audioVal = null;
                    string audioKey = "";
                    try
                    {
                        if (elem.TryGetProperty("audio_url", out var au1) && au1.ValueKind != JsonValueKind.Null)
                        {
                            audioKey = "audio_url";
                            audioVal = au1.GetString();
                        }
                        else if (elem.TryGetProperty("audio", out var au2) && au2.ValueKind != JsonValueKind.Null)
                        {
                            audioKey = "audio";
                            audioVal = au2.GetString();
                        }
                        poi.AudioUrl = audioVal;
                        Debug.WriteLine($"[API]   audio(\"{audioKey}\")={audioVal ?? "(null)"}");
                    }
                    catch (Exception aex)
                    {
                        Debug.WriteLine($"[API] ❌ Parse audio lỗi: {aex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[API] ⚠️  Lỗi bước parse lat/lng/audio: {ex.Message}");
            }

            // ── BƯỚC 6: Log từng POI sau parse ──
            Debug.WriteLine($"[API] ✅ Nhận {result.Data.Count} POI từ database.");
            for (int i = 0; i < result.Data.Count; i++)
            {
                var p = result.Data[i];
                Debug.WriteLine(
                    $"[API]   [{i + 1}] #{p.Id}: \"{p.Name}\"" +
                    $" | lat={p.Latitude:F6}, lng={p.Longitude:F6}" +
                    $" | audio={p.AudioUrl ?? "(null)"}");
            }
            return result.Data;
        }
        catch (HttpRequestException ex)
        {
            Debug.WriteLine($"[API] ❌ HttpRequestException: {ex.Message}");
            Debug.WriteLine("[API]   → KHÔNG fallback hardcode. Trả danh sách rỗng.");
            Debug.WriteLine("[API]   → Kiểm tra: (1) Apache/PHP chạy? (2) emulator truy cập 10.0.2.2?");
            return new List<POI>();
        }
        catch (TaskCanceledException)
        {
            Debug.WriteLine("[API] ❌ Timeout (>15s) — KHÔNG fallback hardcode.");
            Debug.WriteLine("[API]   → Kiểm tra: (1) XAMPP Apache có đang chạy port 8080? (2) Database food_app đã import?");
            return new List<POI>();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[API] ❌ {ex.GetType().Name}: {ex.Message}");
            Debug.WriteLine("[API]   → KHÔNG fallback hardcode. Trả danh sách rỗng.");
            return new List<POI>();
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

            Debug.WriteLine($"[API] ▶ SearchAsync: {url}");

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                Debug.WriteLine($"[API] ❌ Search HTTP {(int)response.StatusCode}");
                return new List<POI>();
            }

            var rawJson = await response.Content.ReadAsStringAsync();
            Debug.WriteLine($"[API] Search raw ({rawJson.Length} bytes): {rawJson.Substring(0, Math.Min(200, rawJson.Length))}");

            // ── B1: Deserialize (case-insensitive vì API trả "success" lowercase) ──
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, Converters = { new Models.StringToIntConverter(), new Models.StringToFloatConverter() } };
            var result = JsonSerializer.Deserialize<SearchResponse>(rawJson, options);

            // ── B2: Log từng giá trị để debug ──
            Debug.WriteLine($"[API] Search deserialize: result is {(result == null ? "NULL" : "OK")}");
            if (result != null)
            {
                Debug.WriteLine($"[API] Search deserialize: Success={result.Success}, Data={result.Data?.Count.ToString() ?? "NULL"}");

                if (!result.Success)
                {
                    Debug.WriteLine($"[API] ❌ Search: API trả success=false → error={result.Error ?? "null"}");
                    return new List<POI>();
                }

                if (result.Data == null || result.Data.Count == 0)
                {
                    Debug.WriteLine($"[API] ⚠️  Search '{query}': 0 kết quả (API success=true nhưng data rỗng)");
                    return new List<POI>();
                }

                Debug.WriteLine($"[API] ✅ Search '{query}': {result.Data.Count} kết quả");
                foreach (var p in result.Data)
                    Debug.WriteLine($"[API]   → #{p.Id}: \"{p.Name}\"");
                return result.Data;
            }

            Debug.WriteLine($"[API] ❌ Search: result == null sau deserialize");
            return new List<POI>();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[API] ❌ Lỗi search: {ex.Message}");
            return new List<POI>();
        }
    }

    // ──────────────────────────────────────────────
    // Lấy 1 POI theo ID (dùng cho POI Detail page)
    // ──────────────────────────────────────────────
    public async Task<POI?> GetPOIByIdAsync(int id)
    {
        try
        {
            // B1: Log id
            Debug.WriteLine($"[API] ▶ GetPOIById(#{id})");

            // B2: URL
            var url = $"{BASE_URL}?id={id}";
            Debug.WriteLine($"[API] ▶ URL = {url}");

            // B3: HTTP
            var response = await _httpClient.GetAsync(url);
            Debug.WriteLine($"[API] HTTP {(int)response.StatusCode} {response.StatusCode}");

            if (!response.IsSuccessStatusCode)
            {
                Debug.WriteLine($"[API] ❌ HTTP error {(int)response.StatusCode}");
                return null;
            }

            // B4: Raw JSON
            var rawJson = await response.Content.ReadAsStringAsync();
            Debug.WriteLine($"[API] Raw JSON ({rawJson.Length} bytes): {rawJson.Substring(0, Math.Min(300, rawJson.Length))}");

            // B5: Deserialize (case-insensitive vì API trả "success" lowercase)
            POIDetailResponse? result;
            try
            {
                var detailOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, Converters = { new Models.StringToIntConverter(), new Models.StringToFloatConverter() } };
                result = JsonSerializer.Deserialize<POIDetailResponse>(rawJson, detailOptions);
            }
            catch (JsonException ex)
            {
                Debug.WriteLine($"[API] ❌ JSON Parse Error: {ex.Message}");
                Debug.WriteLine($"[API]   Raw: {rawJson.Substring(0, Math.Min(200, rawJson.Length))}");
                return null;
            }

            // B6: Log từng giá trị
            Debug.WriteLine($"[API] Deserialize: result is {(result == null ? "NULL" : "OK")}");
            if (result == null)
            {
                Debug.WriteLine($"[API] ❌ result == null sau deserialize → KHÔNG parse được JSON");
                return null;
            }

            Debug.WriteLine($"[API] Deserialize: Success={result.Success}, Error={result.Error ?? "null"}");

            if (!result.Success)
            {
                Debug.WriteLine($"[API] ❌ API trả success=false: {result.Error}");
                return null;
            }

            // B7: Log POI
            var poi = result.Data;
            Debug.WriteLine(
                $"[API] ✅ Find POI #{poi.Id}: \"{poi.Name}\"" +
                $" | lat={poi.Latitude:F6}, lng={poi.Longitude:F6}");

            return poi;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[API] ❌ GetPOIById: {ex.Message}");
            return null;
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

/// <summary>
/// Response cho endpoint ?id=X → trả 1 POI object (không phải list)
/// </summary>
public class POIDetailResponse
{
    [JsonPropertyName("success")] public bool Success { get; set; }

    [JsonPropertyName("data")]
    public POI Data { get; set; } = new();  // ← OBJECT, không phải List!

    [JsonPropertyName("error")] public string? Error { get; set; }
}

public class POIListResponse
{
    [JsonPropertyName("success")] public bool Success { get; set; }
    [JsonPropertyName("data")] public List<POI>? Data { get; set; }
    [JsonPropertyName("error")] public string? Error { get; set; }
}

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

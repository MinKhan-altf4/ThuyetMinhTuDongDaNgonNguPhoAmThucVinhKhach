using System.Text.Json.Serialization;
using POIApp.Models;

namespace POIApp.Models;

/// <summary>
/// Response DTO cho API lấy danh sách món ăn.
/// </summary>
public class DishResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("data")]
    public List<Dish> Data { get; set; } = new();

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

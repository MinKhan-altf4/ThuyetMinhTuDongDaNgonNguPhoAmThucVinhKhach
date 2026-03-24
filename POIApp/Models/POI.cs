using System.Text.Json.Serialization;

namespace POIApp.Models;

/// <summary>
/// Model POI - Lưu trữ thông tin địa điểm
/// </summary>
public class POI
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("latitude")]
    public double Latitude { get; set; }

    [JsonPropertyName("longitude")]
    public double Longitude { get; set; }

    /// <summary>
    /// Khoảng cách từ user đến POI (tính bằng mét)
    /// </summary>
    [JsonIgnore]
    public double Distance { get; set; }

    /// <summary>
    /// Có đang ở gần POI không (&lt; 50m)
    /// </summary>
    [JsonIgnore]
    public bool IsNear { get; set; }
}

/// <summary>
/// Response từ API
/// </summary>
public class POIResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("data")]
    public List<POI> Data { get; set; } = new();

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

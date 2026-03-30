using System.Text.Json.Serialization;

namespace POIApp.Models;

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

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("open_hour")]
    public string? OpenHour { get; set; }

    [JsonPropertyName("close_hour")]
    public string? CloseHour { get; set; }

    [JsonPropertyName("rating")]
    public float Rating { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("audio_url")]
    public string? AudioUrl { get; set; }

    // ── Multi-language ──
    [JsonPropertyName("name_en")]
    public string? NameEn { get; set; }

    [JsonPropertyName("description_en")]
    public string? DescriptionEn { get; set; }

    [JsonPropertyName("name_zh")]
    public string? NameZh { get; set; }

    [JsonPropertyName("description_zh")]
    public string? DescriptionZh { get; set; }

    [JsonPropertyName("audio_en_base64")]
    public string? AudioEnBase64 { get; set; }

    [JsonPropertyName("audio_en_file")]
    public string? AudioEnFile { get; set; }

    // ── Display (computed, language-aware) ──
    [JsonIgnore]
    public string DisplayName => Name;

    [JsonIgnore]
    public string DisplayDescription => Description;

    // ── Navigation helpers ──
    [JsonIgnore]
    public double Distance { get; set; }

    [JsonIgnore]
    public bool IsNear { get; set; }
}

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

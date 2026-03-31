using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using POIApp.Services;

namespace POIApp.Models;

public class POI
{
    [JsonPropertyName("id")]
    [JsonConverter(typeof(StringToIntConverter))]
    public int Id { get; set; }

    // Tiếng Việt (mặc định / fallback)
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
    [JsonConverter(typeof(StringToFloatConverter))]
    public float Rating { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("audio_url")]
    public string? AudioUrl { get; set; }

    // ── Multi-language (map từ API: translations.name_<lang>, translations.description_<lang>) ──
    // Format: { "vi": { "name": "...", "description": "..." }, "en": { "name": "...", "description": "..." }, ... }
    [JsonPropertyName("translations")]
    public Dictionary<string, TranslationSet>? Translations { get; set; }

    // Legacy: fallback trường riêng (vẫn giữ tương thích ngược)
    [JsonPropertyName("name_en")]
    public string? NameEn { get; set; }

    [JsonPropertyName("description_en")]
    public string? DescriptionEn { get; set; }

    [JsonPropertyName("name_zh")]
    public string? NameZh { get; set; }

    [JsonPropertyName("description_zh")]
    public string? DescriptionZh { get; set; }

    [JsonPropertyName("name_jp")]
    public string? NameJp { get; set; }

    [JsonPropertyName("description_jp")]
    public string? DescriptionJp { get; set; }

    [JsonPropertyName("name_kr")]
    public string? NameKr { get; set; }

    [JsonPropertyName("description_kr")]
    public string? DescriptionKr { get; set; }

    // ── Display (computed, language-aware — sử dụng TranslationSet) ──
    [JsonIgnore]
    public string DisplayName
    {
        get
        {
            var lang = LocalizationService.Instance.CurrentLanguage;
            return GetLocalizedText(lang, Name, static p => p.Name);
        }
    }

    [JsonIgnore]
    public string DisplayDescription
    {
        get
        {
            var lang = LocalizationService.Instance.CurrentLanguage;
            return GetLocalizedText(lang, Description, static p => p.Description);
        }
    }

    /// <summary>
    /// Lấy text theo ngôn ngữ ưu tiên, fallback về tiếng Việt, cuối cùng là default.
    /// Ưu tiên: TranslationSet (từ API) → legacy field → default
    /// </summary>
    private string GetLocalizedText(string lang, string defaultVal, Func<POI, string?> legacySelector)
    {
        // 1. Thử Translations (từ API mới)
        if (Translations != null && Translations.TryGetValue(lang, out var ts))
            return !string.IsNullOrWhiteSpace(ts.Name) ? ts.Name : defaultVal;

        // 2. Fallback legacy field (backward-compatible)
        return lang switch
        {
            "en" => legacySelector(this) ?? defaultVal,
            "zh" => legacySelector(this) ?? defaultVal,
            "jp" => legacySelector(this) ?? defaultVal,
            "kr" => legacySelector(this) ?? defaultVal,  // thống nhất: "kr" (ko fallback để tương thích)
            _ => defaultVal
        };
    }

    // ── Navigation helpers ──
    [JsonIgnore]
    public double Distance { get; set; }

    [JsonIgnore]
    public bool IsNear { get; set; }
}

/// <summary>
/// Bộ name + description cho 1 ngôn ngữ, map từ JSON: translations["vi"] = { name, description }
/// </summary>
public class TranslationSet
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }
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

public class StringToDoubleConverter : JsonConverter<double>
{
    public override double Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.Number => reader.GetDouble(),
            JsonTokenType.String => double.TryParse(reader.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : 0,
            JsonTokenType.Null => 0,
            _ => 0
        };
    }

    public override void Write(Utf8JsonWriter writer, double value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue(value);
    }
}

public class StringToFloatConverter : JsonConverter<float>
{
    public override float Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.Number => reader.GetSingle(),
            JsonTokenType.String => float.TryParse(reader.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : 0f,
            JsonTokenType.Null => 0f,
            _ => 0f
        };
    }

    public override void Write(Utf8JsonWriter writer, float value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue(value);
    }
}

public class StringToIntConverter : JsonConverter<int>
{
    public override int Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.Number => reader.GetInt32(),
            JsonTokenType.String => int.TryParse(reader.GetString(), out var v) ? v : 0,
            JsonTokenType.Null => 0,
            _ => 0
        };
    }

    public override void Write(Utf8JsonWriter writer, int value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue(value);
    }
}

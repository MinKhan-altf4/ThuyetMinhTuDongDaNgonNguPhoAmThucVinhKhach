using System.Text.Json.Serialization;

namespace POIApp.Models;

/// <summary>
/// Món ăn (Dish) - mô tả chi tiết từ menu nhà hàng.
/// </summary>
public class Dish
{
    [JsonPropertyName("dish_id")]
    [JsonConverter(typeof(StringToIntConverter))]
    public int DishId { get; set; }

    [JsonPropertyName("restaurant_id")]
    [JsonConverter(typeof(StringToIntConverter))]
    public int RestaurantId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("price")]
    [JsonConverter(typeof(StringToDecimalConverter))]
    public decimal Price { get; set; }

    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("is_active")]
    [JsonConverter(typeof(StringToIntConverter))]
    public int IsActive { get; set; } = 1;

    /// <summary>
    /// Format giá theo chuẩn Việt.
    /// </summary>
    [JsonIgnore]
    public string FormattedPrice
    {
        get => Price.ToString("#,0", System.Globalization.CultureInfo.GetCultureInfo("vi-VN")) + " đ";
    }
}

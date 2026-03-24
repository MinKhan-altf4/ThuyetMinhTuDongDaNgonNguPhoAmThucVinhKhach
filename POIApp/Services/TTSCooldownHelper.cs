using System.Diagnostics;

namespace POIApp.Services;

/// <summary>
/// Helper chống phát lặp audio trong X giây
/// Đơn giản, KHÔNG cần queue phức tạp
/// </summary>
public class TTSCooldownHelper
{
    // =====================================================
    // CẤU HÌNH
    // =====================================================
    // Thời gian chờ giữa 2 lần phát cùng 1 POI (giây)
    private readonly int _cooldownSeconds;

    // =====================================================
    // LƯU TRỮ TRẠNG THÁI
    // =====================================================
    // POI vừa phát gần nhất
    private int? _lastPlayedPOIId = null;

    // Thời điểm phát cuối cùng
    private DateTime? _lastPlayedTime = null;

    // POI đang trong cooldown (đã phát rồi, chưa hết thời gian chờ)
    private readonly HashSet<int> _cooldownPOIs = new();

    // =====================================================
    // CONSTRUCTOR
    // =====================================================
    /// <summary>
    /// Khởi tạo với thời gian cooldown mặc định 30 giây
    /// </summary>
    /// <param name="cooldownSeconds">Số giây chờ trước khi phát lại (mặc định 30)</param>
    public TTSCooldownHelper(int cooldownSeconds = 30)
    {
        _cooldownSeconds = cooldownSeconds;
    }

    // =====================================================
    // KIỂM TRA: Có được phát audio không?
    // =====================================================
    /// <summary>
    /// Kiểm tra xem POI này có được phát audio hay không
    /// </summary>
    /// <param name="poiId">ID của POI</param>
    /// <returns>true = được phát, false = đang trong cooldown</returns>
    public bool CanPlay(int poiId)
    {
        // Nếu chưa phát bao giờ → được phát
        if (_lastPlayedPOIId == null)
            return true;

        // Nếu là POI khác → được phát
        if (_lastPlayedPOIId != poiId)
            return true;

        // Nếu là cùng POI → kiểm tra thời gian
        if (_lastPlayedTime == null)
            return true;

        var elapsed = DateTime.Now - _lastPlayedTime.Value;
        bool canPlay = elapsed.TotalSeconds >= _cooldownSeconds;

        Debug.WriteLine($"[TTS Cooldown] POI {poiId}: {(canPlay ? "Được phát" : $"Chờ {elapsed.TotalSeconds:F0}s / {_cooldownSeconds}s")}");

        return canPlay;
    }

    // =====================================================
    // ĐÁNH DẤU: Đã phát POI này rồi
    // =====================================================
    /// <summary>
    /// Đánh dấu đã phát POI này (bắt đầu cooldown)
    /// </summary>
    /// <param name="poiId">ID của POI vừa phát</param>
    public void MarkAsPlayed(int poiId)
    {
        _lastPlayedPOIId = poiId;
        _lastPlayedTime = DateTime.Now;
        _cooldownPOIs.Add(poiId);

        Debug.WriteLine($"[TTS Cooldown] Đánh dấu POI {poiId} đã phát. Cooldown {_cooldownSeconds}s");
    }

    // =====================================================
    // LẤY THÔNG TIN
    // =====================================================
    /// <summary>
    /// Lấy số giây còn lại trước khi có thể phát lại
    /// </summary>
    public double GetRemainingCooldownSeconds(int poiId)
    {
        if (_lastPlayedPOIId != poiId || _lastPlayedTime == null)
            return 0;

        var elapsed = DateTime.Now - _lastPlayedTime.Value;
        double remaining = _cooldownSeconds - elapsed.TotalSeconds;

        return Math.Max(0, remaining);
    }

    /// <summary>
    /// Reset cooldown cho tất cả POI
    /// </summary>
    public void ResetAll()
    {
        _lastPlayedPOIId = null;
        _lastPlayedTime = null;
        _cooldownPOIs.Clear();
        Debug.WriteLine("[TTS Cooldown] Đã reset tất cả");
    }

    /// <summary>
    /// Reset cooldown cho 1 POI cụ thể
    /// </summary>
    public void ResetPOI(int poiId)
    {
        if (_lastPlayedPOIId == poiId)
        {
            _lastPlayedPOIId = null;
            _lastPlayedTime = null;
        }
        _cooldownPOIs.Remove(poiId);
    }
}

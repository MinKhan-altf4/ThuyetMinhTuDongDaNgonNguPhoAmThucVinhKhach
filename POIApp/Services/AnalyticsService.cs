using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using POIApp.Models;

namespace POIApp.Services;

/// <summary>
/// Tracks local listen analytics and sends app/session analytics to the backend.
/// </summary>
public class AnalyticsService
{
    private Dictionary<int, int> _listenCounts = new();
    private int _totalListens = 0;
    private readonly CacheService? _cache;
    private readonly HttpClient _httpClient;
    private string? _onlineSessionId;
    private CancellationTokenSource? _heartbeatCts;

    public AnalyticsService(CacheService cacheService)
    {
        _cache = cacheService;
        _httpClient = CreateHttpClient();
    }

    public AnalyticsService()
    {
        _cache = null;
        _httpClient = CreateHttpClient();
    }

    public async Task RecordListenAsync(POI poi)
    {
        if (poi is null) return;
        await RecordListenAsync(poi.Id, poi.Name);
    }

    public async Task RecordListenAsync(int poiId, string poiName)
    {
        _listenCounts.TryGetValue(poiId, out int current);
        _listenCounts[poiId] = current + 1;
        _totalListens++;

        Debug.WriteLine($"[Analytics] POI {poiId} ({poiName}): {_listenCounts[poiId]} listens");

        if (_cache is not null)
            await _cache.SaveAnalyticsAsync(_listenCounts);
    }

    public int GetListenCount(int poiId) => _listenCounts.GetValueOrDefault(poiId);
    public int GetTotalListens() => _totalListens;
    public Dictionary<int, int> GetAllStats() => new(_listenCounts);

    public string GetStatsSummary()
    {
        if (_listenCounts.Count == 0) return "Chua co du lieu";
        var lines = new List<string> { $"Tong lan nghe: {_totalListens}", "---" };
        lines.AddRange(_listenCounts.OrderByDescending(x => x.Value).Select(x => $"POI #{x.Key}: {x.Value} lan"));
        return string.Join("\n", lines);
    }

    public async Task LoadFromCacheAsync()
    {
        if (_cache is null)
        {
            Debug.WriteLine("[Analytics] Skip LoadFromCache because CacheService is not available");
            return;
        }

        _listenCounts = await _cache.GetAnalyticsAsync();
        _totalListens = _listenCounts.Values.Sum();
        Debug.WriteLine($"[Analytics] Loaded {_listenCounts.Count} POI stats from cache, total {_totalListens} listens");
    }

    public async Task ResetAsync()
    {
        _listenCounts.Clear();
        _totalListens = 0;
        if (_cache is not null) await _cache.SaveAnalyticsAsync(_listenCounts);
        Debug.WriteLine("[Analytics] Reset all local stats");
    }

    public async Task RecordAppOpenAsync()
    {
        try
        {
            await PostJsonAsync("/api/app-opens", await BuildAppPayloadAsync());
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Analytics] RecordAppOpenAsync error: {ex.Message}");
        }
    }

    public async Task StartOnlineSessionAsync()
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(_onlineSessionId))
                return;

            _onlineSessionId = Guid.NewGuid().ToString("N");
            await PostJsonAsync("/api/online-sessions/start", await BuildAppPayloadAsync(_onlineSessionId));
            StartHeartbeatLoop();

            Debug.WriteLine($"[Analytics] Online session started: {_onlineSessionId}");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Analytics] StartOnlineSessionAsync error: {ex.Message}");
        }
    }

    public async Task EndOnlineSessionAsync()
    {
        try
        {
            _heartbeatCts?.Cancel();
            _heartbeatCts?.Dispose();
            _heartbeatCts = null;

            if (string.IsNullOrWhiteSpace(_onlineSessionId))
                return;

            await PostJsonAsync("/api/online-sessions/end", new
            {
                session_id = _onlineSessionId,
                device_id = await GetOrCreateDeviceIdAsync()
            });

            Debug.WriteLine($"[Analytics] Online session ended: {_onlineSessionId}");
            _onlineSessionId = null;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Analytics] EndOnlineSessionAsync error: {ex.Message}");
        }
    }

    private static HttpClient CreateHttpClient()
    {
        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true
        };

        var client = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(10)
        };
        client.DefaultRequestHeaders.Add("Accept", "application/json, text/plain, */*");
        client.DefaultRequestHeaders.Add("User-Agent", "POIApp-Mobile");
        return client;
    }

    private void StartHeartbeatLoop()
    {
        _heartbeatCts?.Cancel();
        _heartbeatCts?.Dispose();
        _heartbeatCts = new CancellationTokenSource();
        var token = _heartbeatCts.Token;

        _ = Task.Run(async () =>
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), token);
                    if (token.IsCancellationRequested || string.IsNullOrWhiteSpace(_onlineSessionId))
                        break;

                    await PostJsonAsync("/api/online-sessions/heartbeat", new
                    {
                        session_id = _onlineSessionId,
                        device_id = await GetOrCreateDeviceIdAsync()
                    });
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"[Analytics] Heartbeat error: {ex.Message}");
                }
            }
        }, token);
    }

    private async Task<object> BuildAppPayloadAsync(string? sessionId = null)
    {
        var deviceType = $"{DeviceInfo.Platform} {DeviceInfo.Manufacturer} {DeviceInfo.Model}".Trim();
        return new
        {
            device_id = await GetOrCreateDeviceIdAsync(),
            device_type = deviceType,
            app_version = AppInfo.VersionString,
            language_code = LanguageService.Instance.CurrentLanguage,
            session_id = sessionId
        };
    }

    private static async Task<string> GetOrCreateDeviceIdAsync()
    {
        var deviceId = await SecureStorage.GetAsync("device_id");
        if (!string.IsNullOrWhiteSpace(deviceId))
            return deviceId;

        deviceId = Guid.NewGuid().ToString("N");
        await SecureStorage.SetAsync("device_id", deviceId);
        return deviceId;
    }

    private async Task PostJsonAsync(string path, object payload)
    {
        var url = $"{AppSettingsHelper.GetApiBaseUrl().TrimEnd('/')}{path}";
        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        using var response = await _httpClient.PostAsync(url, content);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            Debug.WriteLine($"[Analytics] POST {path} failed: {(int)response.StatusCode} {body}");
        }
    }
}

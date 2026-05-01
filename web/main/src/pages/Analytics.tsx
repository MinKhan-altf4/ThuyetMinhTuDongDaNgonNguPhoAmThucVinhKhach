import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search, Users, Eye, Volume2, Clock,
  Smartphone, MonitorSmartphone, Trash2, AlertTriangle
} from "lucide-react";
import { apiUrl } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────
interface VisitStats {
  total_visitors: number;
  total_visits: number;
  total_listens: number;
  last_visit_time: string | null;
}

interface AppOpenStats {
  total_opens: number;
  unique_devices: number;
  last_open: string | null;
  android_count: number;
  ios_count: number;
  windows_count: number;
}

interface Restaurant {
  restaurant_id: number;
  name: string;
}

// ── Helper ───────────────────────────────────────────────────────

// Rồi dùng:

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HTTP ${res.status}: ${(err as any)?.error || "Unknown error"}`);
  }
  return res.json();
}

// ── Component ────────────────────────────────────────────────────
export default function Analytics() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants]         = useState<Restaurant[]>([]);
  const [selected, setSelected]               = useState<Restaurant | null>(null);
  const [stats, setStats]                     = useState<VisitStats | null>(null);
  const [appStats, setAppStats]               = useState<AppOpenStats | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [statsLoading, setStatsLoading]       = useState(false);
  const [appStatsLoading, setAppStatsLoading] = useState(true);
  const [search, setSearch]                   = useState("");
  const [error, setError]                     = useState("");
  const [clearingVisits, setClearingVisits]   = useState(false);
  const [clearingApp, setClearingApp]         = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/login");
  };

  // Khởi tạo: lấy danh sách quán + thống kê app song song
  useEffect(() => {
    const init = async () => {
      try {
        setError("");
        const [restaurantList, appData] = await Promise.all([
          fetchJson<Restaurant[]>(apiUrl("/api/restaurants")),
          fetchJson<AppOpenStats>(apiUrl("/api/app-opens/stats")).catch(() => null),
        ]);
        setRestaurants(restaurantList);
        if (restaurantList.length > 0) setSelected(restaurantList[0]);
        if (appData) setAppStats(appData);
      } catch (e) {
        setError(`Lỗi lấy dữ liệu: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setLoading(false);
        setAppStatsLoading(false);
      }
    };
    init();
  }, []);

  // Lấy thống kê khi chọn quán
  useEffect(() => {
    if (!selected) return;
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setError("");
        const data = await fetchJson<any>(
          apiUrl(`/api/restaurants/${selected.restaurant_id}/visits/stats`)
        );
        setStats({
          total_visitors:  data?.total_visitors  ?? 0,
          total_visits:    data?.total_visits    ?? 0,
          total_listens:   data?.total_listens   ?? 0,
          last_visit_time: data?.last_visit_time ?? null,
        });
      } catch (e) {
        setError(`Lỗi lấy thống kê: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [selected]);

  // Xóa lịch sử truy cập của quán đang chọn
  const handleClearVisits = async () => {
    if (!selected) return;
    if (!confirm(`Xóa toàn bộ lịch sử truy cập của "${selected.name}"?\nThao tác này không thể hoàn tác.`))
      return;
    try {
      setClearingVisits(true);
      const res = await fetch(
        apiUrl(`/api/restaurants/${selected.restaurant_id}/visits`),
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi xóa");
      setStats({ total_visitors: 0, total_visits: 0, total_listens: 0, last_visit_time: null });
    } catch (e) {
      setError(`Lỗi xóa lịch sử: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setClearingVisits(false);
    }
  };

  // Xóa toàn bộ lịch sử mở app
  const handleClearAppOpens = async () => {
    if (!confirm("Xóa toàn bộ lịch sử mở ứng dụng?\nThao tác này không thể hoàn tác."))
      return;
    try {
      setClearingApp(true);
      const res = await fetch(apiUrl("/api/app-opens"), { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi xóa");
      setAppStats({
        total_opens: 0, unique_devices: 0, last_open: null,
        android_count: 0, ios_count: 0, windows_count: 0,
      });
    } catch (e) {
      setError(`Lỗi xóa lịch sử app: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setClearingApp(false);
    }
  };
// Xóa TOÀN BỘ dữ liệu thống kê (App & POI) của toàn hệ thống
  const handleClearAllSystemStats = async () => {
    if (!confirm("⚠️ NGUY HIỂM: Bạn có chắc chắn muốn xóa TOÀN BỘ lượt mở App VÀ lượt truy cập POI của TẤT CẢ gian hàng?\n\nThao tác này KHÔNG THỂ hoàn tác!"))
      return;
      
    try {
      setClearingApp(true);
      setClearingVisits(true);
      setError("");

      const [resApp, resVisits] = await Promise.all([
        fetch(apiUrl("/api/app-opens"), { method: "DELETE" }),
        fetch(apiUrl("/api/visits/all"), { method: "DELETE" })
      ]);

      if (!resApp.ok || !resVisits.ok) {
        throw new Error("Lỗi khi xóa dữ liệu từ máy chủ");
      }

      // Reset UI App Stats
      setAppStats({
        total_opens: 0, unique_devices: 0, last_open: null,
        android_count: 0, ios_count: 0, windows_count: 0,
      });

      // Reset UI POI Stats đang chọn
      if (selected) {
        setStats({ total_visitors: 0, total_visits: 0, total_listens: 0, last_visit_time: null });
      }
      
      alert("Đã xóa toàn bộ dữ liệu thống kê hệ thống thành công!");
    } catch (e) {
      setError(`Lỗi xóa toàn bộ hệ thống: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setClearingApp(false);
      setClearingVisits(false);
    }
  };
  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Thống kê truy cập" onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center">Đang tải dữ liệu...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Thống kê truy cập" onLogout={handleLogout}>
      <div className="space-y-8 animate-fade-in">

        {/* Lỗi */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">⚠️ {error}</p>
            <p className="text-xs mt-1 opacity-75">Kiểm tra console để xem chi tiết</p>
          </div>
        )}

        {/* ── Lượt mở app ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            {/* Nút xóa toàn bộ (Danger Zone) */}
        <div className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/5 rounded-xl">
          <div>
            <h3 className="font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Làm sạch dữ liệu hệ thống
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Xóa toàn bộ.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleClearAllSystemStats}
            disabled={clearingApp || clearingVisits}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {clearingApp || clearingVisits ? "Đang xóa..." : "Xóa tất cả"}
          </Button>
        </div>
            <h2 className="text-lg font-semibold">📱 Lượt mở ứng dụng</h2>
            {appStats && appStats.total_opens > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAppOpens}
                disabled={clearingApp}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {clearingApp ? "Đang xóa..." : "Xóa lịch sử"}
              </Button>
            )}
          </div>

          {appStatsLoading ? (
            <div className="flex h-32 items-center justify-center rounded-xl border bg-muted/30">
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : appStats ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-purple-500" />
                    Tổng lượt mở app
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{appStats.total_opens}</div>
                  <p className="text-xs text-muted-foreground mt-1">Từ trước đến nay</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MonitorSmartphone className="h-4 w-4 text-blue-500" />
                    Thiết bị độc nhất
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{appStats.unique_devices}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unique devices</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    Mở app gần nhất
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {appStats.last_open
                      ? new Date(appStats.last_open).toLocaleString("vi-VN")
                      : "Chưa có"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Thời gian</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-amber-500" />
                    Nền tảng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {(["Android", "iOS", "Windows"] as const).map((platform) => {
                    const key = `${platform.toLowerCase()}_count` as keyof AppOpenStats;
                    return (
                      <div key={platform} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{platform}</span>
                        <span className="font-semibold">{appStats[key] as number}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border bg-muted/30">
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu mở app</p>
            </div>
          )}
        </section>

        {/* ── Chọn gian hàng ──────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">📊 Chọn gian hàng để xem thống kê</h2>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm gian hàng..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground">Không có gian hàng nào</p>
            ) : (
              filtered.map((r) => (
                <div
                  key={r.restaurant_id}
                  onClick={() => setSelected(r)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selected?.restaurant_id === r.restaurant_id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <h3 className="font-medium">{r.name}</h3>
                  <p className="text-xs text-muted-foreground">ID: #{r.restaurant_id}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Chi tiết thống kê quán được chọn ────────────────────── */}
        {selected && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                📈 Thống kê: <span className="text-primary">{selected.name}</span>
              </h2>
              {stats && stats.total_visits > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearVisits}
                  disabled={clearingVisits}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  {clearingVisits ? "Đang xóa..." : "Xóa lịch sử truy cập"}
                </Button>
              )}
            </div>

            {statsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
                  <p className="text-muted-foreground">Đang tải thống kê...</p>
                </div>
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        Khách truy cập
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.total_visitors}</div>
                      <p className="text-xs text-muted-foreground mt-1">Khách độc nhất</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4 text-green-500" />
                        Lần truy cập
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.total_visits}</div>
                      <p className="text-xs text-muted-foreground mt-1">Tổng số lần</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-amber-500" />
                        Lần nghe audio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.total_listens}</div>
                      <p className="text-xs text-muted-foreground mt-1">Tổng lần nghe</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-500" />
                        Truy cập gần nhất
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">
                        {stats.last_visit_time
                          ? new Date(stats.last_visit_time).toLocaleString("vi-VN")
                          : "Chưa có"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Thời gian</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">📌 Thông tin chi tiết</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        label: "Trung bình lần truy cập/khách",
                        value: stats.total_visitors > 0
                          ? (stats.total_visits / stats.total_visitors).toFixed(2) : "0",
                      },
                      {
                        label: "Trung bình lần nghe/khách",
                        value: stats.total_visitors > 0
                          ? (stats.total_listens / stats.total_visitors).toFixed(2) : "0",
                      },
                      {
                        label: "Engagement rate",
                        value: stats.total_visits > 0
                          ? `${((stats.total_listens / stats.total_visits) * 100).toFixed(1)}%` : "0%",
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}:</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border bg-muted/50">
                <div className="text-center">
                  <p className="text-muted-foreground font-medium mb-2">📊 Chưa có dữ liệu thống kê</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Gian hàng "{selected.name}" chưa có khách truy cập.<br />
                    Dữ liệu sẽ xuất hiện khi khách tap POI này trong ứng dụng POIApp.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </AdminLayout>
  );
}

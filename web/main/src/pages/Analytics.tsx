import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, BarChart3, Users, Eye, Volume2, Clock } from "lucide-react";

interface VisitStats {
  total_visitors: number;
  total_visits: number;
  total_listens: number;
  last_visit_time: string | null;
}

interface Restaurant {
  restaurant_id: number;
  name: string;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string>("");

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/login");
  };

  // Lấy danh sách quán
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setError("");
        const res = await fetch("http://localhost:3000/api/restaurants");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        console.log("[Analytics] Fetched restaurants:", data);
        setRestaurants(data);
        if (data.length > 0) {
          setSelectedRestaurant(data[0]);
        }
      } catch (error) {
        const msg = `Lỗi lấy quán: ${error instanceof Error ? error.message : String(error)}`;
        console.error("[Analytics]", msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Lấy thống kê khi chọn quán
  useEffect(() => {
    if (!selectedRestaurant) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setError("");
        const url = `http://localhost:3000/api/restaurants/${selectedRestaurant.restaurant_id}/visits/stats`;
        console.log("[Analytics] Fetching stats from:", url);
        
        const res = await fetch(url);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`HTTP ${res.status}: ${errorData?.error || 'Unknown error'}`);
        }
        
        const data = await res.json();
        console.log("[Analytics] Fetched stats:", data);
        
        // Ensure all fields exist
        const safeStats: VisitStats = {
          total_visitors: data?.total_visitors ?? 0,
          total_visits: data?.total_visits ?? 0,
          total_listens: data?.total_listens ?? 0,
          last_visit_time: data?.last_visit_time ?? null,
        };
        
        setStats(safeStats);
      } catch (error) {
        const msg = `Lỗi lấy thống kê: ${error instanceof Error ? error.message : String(error)}`;
        console.error("[Analytics]", msg);
        setError(msg);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [selectedRestaurant]);

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
      <div className="space-y-6 animate-fade-in">
        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">⚠️ {error}</p>
            <p className="text-xs mt-1 opacity-75">Kiểm tra console để xem chi tiết lỗi</p>
          </div>
        )}

        {/* Chọn quán */}
        <div className="space-y-4">
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
            {restaurants.length === 0 && !loading ? (
              <p className="text-muted-foreground">Không có gian hàng nào</p>
            ) : (
              filtered.map((restaurant) => (
                <div
                  key={restaurant.restaurant_id}
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRestaurant?.restaurant_id === restaurant.restaurant_id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <h3 className="font-medium">{restaurant.name}</h3>
                  <p className="text-xs text-muted-foreground">ID: #{restaurant.restaurant_id}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Thống kê */}
        {selectedRestaurant && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">
              📈 Thống kê: <span className="text-primary">{selectedRestaurant.name}</span>
            </h2>

            {statsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <p className="text-muted-foreground">Đang tải thống kê...</p>
                </div>
              </div>
            ) : stats ? (
              <>
                {/* Cards thống kê */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Tổng khách truy cập */}
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

              {/* Tổng lần truy cập */}
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

              {/* Tổng lần nghe */}
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

              {/* Lần truy cập gần nhất */}
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

            {/* Thông tin bổ sung */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📌 Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trung bình lần truy cập/khách:</span>
                  <span className="font-semibold">
                    {stats.total_visitors > 0 ? (stats.total_visits / stats.total_visitors).toFixed(2) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trung bình lần nghe/khách:</span>
                  <span className="font-semibold">
                    {stats.total_visitors > 0 ? (stats.total_listens / stats.total_visitors).toFixed(2) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engagement rate:</span>
                  <span className="font-semibold">
                    {stats.total_visits > 0
                      ? ((stats.total_listens / stats.total_visits) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border bg-muted/50">
                <div className="text-center">
                  <p className="text-muted-foreground font-medium mb-2">📊 Chưa có dữ liệu thống kê</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Gian hàng "{selectedRestaurant.name}" chưa có khách truy cập. <br/>
                    Dữ liệu sẽ xuất hiện khi khách tap POI này trong ứng dụng POIApp.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedRestaurant && restaurants.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-xl border bg-muted/50">
            <p className="text-muted-foreground">Chưa có gian hàng nào</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

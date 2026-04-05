import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatCard } from "@/components/StatCard";
import { Store, UtensilsCrossed, Eye } from "lucide-react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardData {
  stats: {
    stores: number;
    dishes: number;
    totalVisits: number;
  };
  topRestaurants: { name: string; rating: number; dish_count: number }[];
  activities: { name: string; created_at: string }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra đăng nhập
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [navigate]);

  // Gọi API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/stats");
        const result = await response.json();
        // Giả sử API trả về { stats: { stores, dishes, totalVisits }, ... }
        // Nếu API chưa có totalVisits, bạn có thể gán mặc định 0 hoặc tính từ dữ liệu khác
        setData({
          stats: {
            stores: result.stats.stores || 0,
            dishes: result.stats.dishes || 0,
            totalVisits: result.stats.totalVisits || 12580, // Ví dụ, thay bằng số thực tế
          },
          topRestaurants: result.topRestaurants || [],
          activities: result.activities || [],
        });
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/login");
  };

  if (loading) {
    return (
      <AdminLayout title="Đang tải..." onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Đang lấy dữ liệu từ hệ thống...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tổng quan" onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Hiển thị 3 thẻ thống kê */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Gian hàng"
            value={data?.stats.stores || 0}
            change="Khu vực Vĩnh Khánh"
            changeType="positive"
            icon={Store}
            color="emerald"
          />
          <StatCard
            title="Món ăn"
            value={data?.stats.dishes || 0}
            change="Đang kinh doanh"
            changeType="positive"
            icon={UtensilsCrossed}
            color="amber"
          />
          <StatCard
            title="Tổng lượt truy cập"
            value={data?.stats.totalVisits || 0}
            change="Hôm nay: +245"
            changeType="positive"
            icon={Eye}
            color="blue"
          />
        </div>

        {/* Phần còn lại giữ nguyên */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Top gian hàng rating cao nhất */}
          <div className="col-span-2 rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Top gian hàng đánh giá cao nhất
            </h3>
            <div className="space-y-3">
              {(data?.topRestaurants || []).map((r, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-6 shrink-0 text-center text-xs font-bold text-muted-foreground">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {r.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.dish_count} món ăn
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${(r.rating / 5) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1 w-10">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-500">
                        {r.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.topRestaurants || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Chưa có dữ liệu
                </p>
              )}
            </div>
          </div>

          {/* Gian hàng mới thêm gần đây */}
          <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Gian hàng mới thêm
            </h3>
            <div className="space-y-4">
              {(data?.activities || []).map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {(data?.activities || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Chưa có dữ liệu
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
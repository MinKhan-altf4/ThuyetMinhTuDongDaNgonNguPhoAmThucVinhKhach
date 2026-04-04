import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Store, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

interface DashboardData {
  stats: {
    owners: number;
    stores: number;
    dishes: number;
    ordersToday: number;
  };
  chartData: { name: string; revenue: number }[];
  activities: { action: string; name: string; time: string }[];
}

export default function Dashboard() {
  const navigate = useNavigate(); // ✅ phải nằm TRONG component
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Kiểm tra đăng nhập
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, []);

  // Gọi API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/stats");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ✅ Hàm logout
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Chủ gian hàng"
            value={data?.stats.owners || 0}
            change="+1 mới"
            changeType="positive"
            icon={Users}
            color="blue"
          />
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
            title="Đơn hàng hôm nay"
            value={data?.stats.ordersToday || 0}
            change="Cần xử lý"
            changeType="neutral"
            icon={ShoppingCart}
            color="rose"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-2 rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">Doanh thu theo tuần (triệu VND)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">Hoạt động gần đây</h3>
            <div className="space-y-4">
              {(data?.activities || []).map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="text-sm text-card-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.name} · {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

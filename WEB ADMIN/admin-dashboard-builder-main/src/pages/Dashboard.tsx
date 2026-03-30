import { AdminLayout } from "@/components/AdminLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Store, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { name: "T1", revenue: 4200 },
  { name: "T2", revenue: 3800 },
  { name: "T3", revenue: 5100 },
  { name: "T4", revenue: 4600 },
  { name: "T5", revenue: 6200 },
  { name: "T6", revenue: 5800 },
  { name: "T7", revenue: 7100 },
];

const recentActivities = [
  { action: "Chủ gian hàng mới đăng ký", name: "Nguyễn Văn A", time: "5 phút trước" },
  { action: "Cập nhật thực đơn", name: "Gian hàng Phở Hà Nội", time: "15 phút trước" },
  { action: "Đơn hàng mới", name: "#ORD-2024-0891", time: "32 phút trước" },
  { action: "Phê duyệt tài khoản", name: "Trần Thị B", time: "1 giờ trước" },
  { action: "Báo cáo doanh thu", name: "Gian hàng Bún Bò", time: "2 giờ trước" },
];

export default function Dashboard() {
  return (
    <AdminLayout title="Tổng quan">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Chủ gian hàng" value={128} change="+12 tháng này" changeType="positive" icon={Users} color="blue" />
          <StatCard title="Gian hàng" value={156} change="+8 tháng này" changeType="positive" icon={Store} color="emerald" />
          <StatCard title="Món ăn" value={1243} change="+45 tháng này" changeType="positive" icon={UtensilsCrossed} color="amber" />
          <StatCard title="Đơn hàng hôm nay" value={89} change="-5% so với hôm qua" changeType="negative" icon={ShoppingCart} color="rose" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-2 rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">Doanh thu theo tuần (triệu VND)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
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
              {recentActivities.map((activity, i) => (
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

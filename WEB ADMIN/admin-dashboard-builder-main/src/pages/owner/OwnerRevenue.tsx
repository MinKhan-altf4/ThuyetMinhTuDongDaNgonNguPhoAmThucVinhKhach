import { StallOwnerLayout } from "@/components/StallOwnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react";

const weeklyData = [
  { name: "T2", revenue: 2800 },
  { name: "T3", revenue: 3200 },
  { name: "T4", revenue: 2900 },
  { name: "T5", revenue: 4100 },
  { name: "T6", revenue: 5200 },
  { name: "T7", revenue: 6800 },
  { name: "CN", revenue: 7100 },
];

const topDishes = [
  { name: "Phở Bò Đặc Biệt", sold: 89, revenue: "4,895,000₫" },
  { name: "Phở Gà", sold: 67, revenue: "3,350,000₫" },
  { name: "Phở Bò Tái", sold: 54, revenue: "2,430,000₫" },
  { name: "Gỏi cuốn", sold: 43, revenue: "1,075,000₫" },
  { name: "Chè ba màu", sold: 31, revenue: "620,000₫" },
];

export default function OwnerRevenue() {
  return (
    <StallOwnerLayout title="Báo cáo Doanh thu">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Doanh thu tuần</p>
                  <p className="mt-1 text-2xl font-bold">32.1M ₫</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">+15%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Doanh thu tháng</p>
                  <p className="mt-1 text-2xl font-bold">128.5M ₫</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">+8%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Đơn trung bình/ngày</p>
                  <p className="mt-1 text-2xl font-bold">47</p>
                </div>
                <ShoppingCart className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Doanh thu theo ngày (nghìn VND)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData}>
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
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Món bán chạy nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDishes.map((dish, i) => (
                <div key={dish.name} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                      i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm">{dish.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{dish.sold} phần</span>
                    <span className="font-semibold text-orange-600">{dish.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </StallOwnerLayout>
  );
}

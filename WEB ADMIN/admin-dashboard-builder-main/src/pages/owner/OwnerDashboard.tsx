import { StallOwnerLayout } from "@/components/StallOwnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Users, TrendingUp } from "lucide-react";

const stats = [
  { title: "Tổng đơn hàng", value: "156", change: "+12 hôm nay", icon: ShoppingCart, color: "bg-orange-500" },
  { title: "Doanh thu (TMTD)", value: "12.5M ₫", change: "+8% tuần này", icon: DollarSign, color: "bg-emerald-500" },
  { title: "Khách hàng hôm nay", value: "43", change: "+5 so với hôm qua", icon: Users, color: "bg-blue-500" },
  { title: "Tỷ lệ hoàn thành", value: "97%", change: "+2% tháng này", icon: TrendingUp, color: "bg-violet-500" },
];

const recentActivities = [
  { text: "Đơn hàng #1234 đã hoàn thành", time: "2 phút trước", type: "success" },
  { text: "Khách hàng Nguyễn Văn A đặt 2 món", time: "10 phút trước", type: "order" },
  { text: "Đơn hàng #1233 đang giao", time: "25 phút trước", type: "info" },
  { text: "Cập nhật giá Phở Bò Đặc Biệt", time: "1 giờ trước", type: "update" },
  { text: "Khách hàng Trần B để lại đánh giá 5⭐", time: "2 giờ trước", type: "review" },
  { text: "Đơn hàng #1230 bị huỷ", time: "3 giờ trước", type: "cancel" },
];

export default function OwnerDashboard() {
  return (
    <StallOwnerLayout title="Tổng quan">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="mt-1 text-xs text-emerald-600">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} flex h-10 w-10 items-center justify-center rounded-xl text-white`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    activity.type === "success" ? "bg-emerald-500" :
                    activity.type === "cancel" ? "bg-red-500" :
                    activity.type === "review" ? "bg-amber-500" : "bg-orange-500"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
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

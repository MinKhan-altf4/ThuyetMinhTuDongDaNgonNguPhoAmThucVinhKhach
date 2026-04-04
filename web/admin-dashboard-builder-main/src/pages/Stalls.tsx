import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star } from "lucide-react";

const stalls = [
  { id: 1, name: "Phở Hà Nội", owner: "Nguyễn Văn A", location: "Khu A - Số 12", rating: 4.8, dishes: 24, status: "open" },
  { id: 2, name: "Bún Bò Huế", owner: "Trần Thị B", location: "Khu B - Số 5", rating: 4.5, dishes: 18, status: "open" },
  { id: 3, name: "Cơm Tấm Sài Gòn", owner: "Lê Hoàng C", location: "Khu A - Số 8", rating: 4.7, dishes: 32, status: "open" },
  { id: 4, name: "Bánh Mì 24h", owner: "Phạm Minh D", location: "Khu C - Số 1", rating: 4.3, dishes: 12, status: "closed" },
  { id: 5, name: "Chè Thái", owner: "Hoàng Thị E", location: "Khu B - Số 9", rating: 4.6, dishes: 15, status: "maintenance" },
  { id: 6, name: "Hủ Tiếu Nam Vang", owner: "Võ Đức F", location: "Khu C - Số 3", rating: 4.4, dishes: 20, status: "open" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Đang mở", variant: "default" },
  closed: { label: "Đóng cửa", variant: "secondary" },
  maintenance: { label: "Bảo trì", variant: "outline" },
};

export default function Stalls() {
  return (
    <AdminLayout title="Quản lý Gian Hàng">
      <div className="space-y-4 animate-fade-in">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm gian hàng..." className="pl-9" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stalls.map((stall) => (
            <div key={stall.id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-card-foreground">{stall.name}</h3>
                <Badge variant={statusConfig[stall.status].variant}>
                  {statusConfig[stall.status].label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{stall.owner}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {stall.location}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-stat-amber text-stat-amber" /> {stall.rating}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{stall.dishes} món ăn</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

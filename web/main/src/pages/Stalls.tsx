import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Phone, Clock, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Restaurant {
  restaurant_id: number;
  name: string;
  description: string;
  phone: string;
  address: string;
  open_hour: string;
  close_hour: string;
  rating: number;
  dish_count: number;
  image_url: string;
  owner_name: string;
}

export default function Stalls() {
  const { handleLogout } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/restaurants");
        const data = await res.json();
        setRestaurants(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách nhà hàng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (openHour: string, closeHour: string) => {
    if (!openHour || !closeHour) return { label: "Không rõ", variant: "secondary" as const };
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + currentMinute / 60;
    
    const parseHour = (timeStr: string) => {
      const match = timeStr.match(/(\d+):(\d+)/);
      if (match) {
        return parseInt(match[1]) + parseInt(match[2]) / 60;
      }
      return 0;
    };
    
    const open = parseHour(openHour);
    const close = parseHour(closeHour);
    
    if (currentTime >= open && currentTime < close) {
      return { label: "Đang mở", variant: "default" as const };
    }
    return { label: "Đóng cửa", variant: "secondary" as const };
  };

  if (loading) {
    return (
      <AdminLayout title="Quản lý Gian Hàng" onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý Gian Hàng" onLogout={handleLogout}>
      <div className="space-y-4 animate-fade-in">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Tìm theo tên hoặc địa chỉ..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((stall) => {
            const status = getStatus(stall.open_hour, stall.close_hour);
            return (
              <div key={stall.restaurant_id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground">{stall.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{stall.owner_name || "Chưa có chủ"}</p>
                  </div>
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                </div>
                
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{stall.address}</span>
                  </div>
                  {stall.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{stall.phone}</span>
                    </div>
                  )}
                  {stall.open_hour && stall.close_hour && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{stall.open_hour} - {stall.close_hour}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-stat-amber text-stat-amber" />
                    <span>{stall.rating || "Chưa có đánh giá"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UtensilsCrossed className="h-3 w-3" />
                    <span>{stall.dish_count || 0} món ăn</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filtered.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-xl border bg-card">
            <p className="text-muted-foreground">Không tìm thấy gian hàng nào</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
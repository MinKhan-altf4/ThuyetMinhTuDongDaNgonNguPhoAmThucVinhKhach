import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Phone, Clock, UtensilsCrossed } from "lucide-react";

// Định nghĩa Interface khớp với database food_app
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
  status: string; // 'open', 'closed', 'maintenance'
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Đang mở cửa", variant: "default" },
  closed: { label: "Đóng cửa", variant: "destructive" },
  maintenance: { label: "Bảo trì", variant: "secondary" },
};

export default function Stalls() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Lấy dữ liệu từ server.js
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/restaurants"); // Port của server.js
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

  // Logic tìm kiếm
  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.owner_name && r.owner_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout title="Gian hàng">
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Tìm gian hàng..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((stall) => (
              <div key={stall.restaurant_id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-card-foreground">{stall.name}</h3>
                    <p className="text-sm text-muted-foreground italic">Chủ: {stall.owner_name || "Chưa xác định"}</p>
                  </div>
                  <Badge variant={statusConfig[stall.status]?.variant || "outline"}>
                    {statusConfig[stall.status]?.label || "Ngoại tuyến"}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{stall.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-foreground">{stall.rating || "0"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UtensilsCrossed className="h-3 w-3" />
                      <span>{stall.dish_count || 0} món ăn</span>
                    </div>
                  </div>

                  {(stall.open_hour && stall.close_hour) && (
                    <div className="flex items-center gap-2 pt-1 border-t mt-2">
                      <Clock className="h-3 w-3" />
                      <span>{stall.open_hour} - {stall.close_hour}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filtered.length === 0 && !loading && (
          <div className="flex h-64 items-center justify-center rounded-xl border bg-card">
            <p className="text-muted-foreground">Không tìm thấy gian hàng nào</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
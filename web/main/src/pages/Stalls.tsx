import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Clock, UtensilsCrossed, Edit2, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Fix Leaflet icon ────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Map click handler ───────────────────────────────────────────
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// ── Reverse geocoding ───────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
      { headers: { "Accept-Language": "vi" } }
    );
    const data = await res.json();
    return data.display_name || "";
  } catch { return ""; }
}

// ── MapPicker component ─────────────────────────────────────────
function MapPicker({
  lat, lng, onPick
}: {
  lat: string;
  lng: string;
  onPick: (lat: string, lng: string, address: string) => void;
}) {
  const [geocoding, setGeocoding] = useState(false);
  const hasPos = lat && lng && parseFloat(lat) !== 0 && parseFloat(lng) !== 0;
  const center: [number, number] = hasPos
    ? [parseFloat(lat), parseFloat(lng)]
    : [10.7609, 106.7034]; // mặc định: Quận 4, HCM

  const handleClick = useCallback(async (clat: number, clng: number) => {
    setGeocoding(true);
    const address = await reverseGeocode(clat, clng);
    onPick(clat.toFixed(6), clng.toFixed(6), address);
    setGeocoding(false);
  }, [onPick]);

  return (
    <div className="space-y-2">
      <Label>📍 Chọn vị trí trên bản đồ</Label>
      <div className="rounded-lg overflow-hidden border h-64">
        <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <MapClickHandler onMapClick={handleClick} />
          {hasPos && (
            <Marker position={[parseFloat(lat), parseFloat(lng)]}>
              <Popup>
                <span className="text-xs">
                  Lat: {parseFloat(lat).toFixed(6)}<br />
                  Lng: {parseFloat(lng).toFixed(6)}
                </span>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        {geocoding
          ? "⏳ Đang tra địa chỉ..."
          : hasPos
            ? `✅ ${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`
            : "⬆️ Click lên bản đồ để chọn vị trí"}
      </p>
    </div>
  );
}

// ── Interfaces ──────────────────────────────────────────────────
interface Restaurant {
  restaurant_id: number;
  name: string;
  description: string;
  phone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  open_hour: string;
  close_hour: string;
  rating: number;
  dish_count: number;
  image_url: string;
  owner_name: string | null;
  owner_locked: boolean;
  status: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open:        { label: "Đang mở cửa", variant: "default" },
  closed:      { label: "Đóng cửa",    variant: "destructive" },
  maintenance: { label: "Bảo trì",     variant: "secondary" },
};

function resolveStatus(stall: Restaurant) {
  if (stall.owner_locked) return { label: "Ngưng hoạt động", variant: "outline" as const };
  return statusConfig[stall.status] ?? { label: "Không xác định", variant: "outline" as const };
}

// ── Main Component ──────────────────────────────────────────────
export default function Stalls() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  // formData giờ có thêm lat, lng
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    lat: "",
    lng: "",
    open_hour: "",
    close_hour: "",
    rating: "0",
    status: "open",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/login");
  };

  // Load lat/lng vào form khi bấm Edit
  const handleEditRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name:        restaurant.name,
      description: restaurant.description || "",
      address:     restaurant.address,
      phone:       restaurant.phone || "",
      lat:         restaurant.lat != null ? String(restaurant.lat) : "",
      lng:         restaurant.lng != null ? String(restaurant.lng) : "",
      open_hour:   restaurant.open_hour || "",
      close_hour:  restaurant.close_hour || "",
      rating:      String(restaurant.rating || "0"),
      status:      restaurant.status,
    });
    setError("");
  };

  // Gửi PUT bao gồm lat/lng
  const handleSubmitRestaurant = async () => {
    if (!editingRestaurant) return;
    if (!formData.name.trim() || !formData.address.trim()) {
      setError("Vui lòng nhập tên và địa chỉ");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/restaurants/${editingRestaurant.restaurant_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        formData.name,
          description: formData.description || null,
          address:     formData.address,
          phone:       formData.phone || null,
          lat:         formData.lat ? parseFloat(formData.lat) : null,
          lng:         formData.lng ? parseFloat(formData.lng) : null,
          open_hour:   formData.open_hour || null,
          close_hour:  formData.close_hour || null,
          rating:      parseFloat(formData.rating) || 0,
          status:      formData.status,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Lỗi cập nhật gian hàng");
        return;
      }

      // Cập nhật local state
      setRestaurants(prev => prev.map(r =>
        r.restaurant_id === editingRestaurant.restaurant_id
          ? {
              ...r,
              ...formData,
              rating: parseFloat(formData.rating),
              lat: formData.lat ? parseFloat(formData.lat) : null,
              lng: formData.lng ? parseFloat(formData.lng) : null,
            }
          : r
      ));
      setEditingRestaurant(null);
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

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

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.owner_name && r.owner_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout title="Gian hàng" onLogout={handleLogout}>
      <div className="flex flex-col gap-4 animate-fade-in">

        {/* Tìm kiếm */}
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
          <>
            {/* Form chỉnh sửa */}
            {editingRestaurant && (
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Chỉnh sửa: {editingRestaurant.name}</h3>
                  <button onClick={() => setEditingRestaurant(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Tên gian hàng *</Label>
                    <Input
                      placeholder="Tên gian hàng"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Địa chỉ *</Label>
                    <Input
                      placeholder="Địa chỉ (tự động điền khi chọn map)"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Số điện thoại</Label>
                    <Input
                      placeholder="Số điện thoại"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Giờ mở cửa</Label>
                    <Input
                      type="time"
                      value={formData.open_hour}
                      onChange={(e) => setFormData({ ...formData, open_hour: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Giờ đóng cửa</Label>
                    <Input
                      type="time"
                      value={formData.close_hour}
                      onChange={(e) => setFormData({ ...formData, close_hour: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rating</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Trạng thái</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Mở cửa</SelectItem>
                        <SelectItem value="closed">Đóng cửa</SelectItem>
                        <SelectItem value="maintenance">Bảo trì</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Mô tả</Label>
                    <textarea
                      placeholder="Mô tả gian hàng"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* MapPicker — click map → tự cập nhật lat/lng và địa chỉ */}
                <MapPicker
                  lat={formData.lat}
                  lng={formData.lng}
                  onPick={(lat, lng, address) => setFormData(prev => ({
                    ...prev,
                    lat,
                    lng,
                    address: address || prev.address,
                  }))}
                />

                {/* Hiển thị kinh vĩ độ hiện tại */}
                {formData.lat && formData.lng && parseFloat(formData.lat) !== 0 && (
                  <div className="flex gap-4">
                    <div className="space-y-1.5 flex-1">
                      <Label>Vĩ độ (Lat)</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <Label>Kinh độ (Lng)</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button onClick={handleSubmitRestaurant} disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingRestaurant(null)}>Hủy</Button>
                </div>
              </div>
            )}

            {/* Danh sách gian hàng */}
            {filtered.map((stall) => {
              const displayStatus = resolveStatus(stall);
              const hasCoords = stall.lat && stall.lng && stall.lat !== 0 && stall.lng !== 0;
              return (
                <div key={stall.restaurant_id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-card-foreground">{stall.name}</h3>
                      <p className="text-sm text-muted-foreground italic">
                        Chủ: {stall.owner_name || "Chưa xác định"}
                        {stall.owner_locked && <span className="ml-1 text-destructive">(đã khóa)</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditRestaurant(stall)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Badge variant={displayStatus.variant}>{displayStatus.label}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{stall.address}</span>
                    </div>

                    {/* Hiển thị tọa độ nếu có */}
                    {hasCoords && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                        <span>📡 {Number(stall.lat).toFixed(6)}, {Number(stall.lng).toFixed(6)}</span>
                      </div>
                    )}
                    {!hasCoords && (
                      <div className="flex items-center gap-2 text-[10px] text-amber-500">
                        <span>⚠️ Chưa có tọa độ — POI sẽ không hiển thị trên map</span>
                      </div>
                    )}

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

                    {stall.open_hour && stall.close_hour && (
                      <div className="flex items-center gap-2 pt-1 border-t mt-2">
                        <Clock className="h-3 w-3" />
                        <span>{stall.open_hour} - {stall.close_hour}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
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
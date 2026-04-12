import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Phone, Clock, UtensilsCrossed, Plus, Edit2, Trash2, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Fix Leaflet icon ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// --- Interfaces ---
interface Restaurant {
  restaurant_id: number;
  name: string;
  description: string;
  phone: string;
  address: string;
  open_hour: string;
  close_hour: string;
  rating: number;
  lat?: number;
  lng?: number;
  dish_count: number;
  owner_name: string | null;
  owner_locked: boolean;
  status: string;
}

interface RestaurantFormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  lat: string;
  lng: string;
  open_hour: string;
  close_hour: string;
  rating: string;
  status: string;
}

const EMPTY_FORM: RestaurantFormData = {
  name: "", description: "", address: "", phone: "",
  lat: "", lng: "", open_hour: "", close_hour: "", rating: "0", status: "open"
};

// --- Map Components ---
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
    const data = await res.json();
    return data.display_name || "";
  } catch { return ""; }
}

function MapPicker({ lat, lng, onPick }: { lat: string, lng: string, onPick: (lat: string, lng: string, addr: string) => void }) {
  const [loading, setLoading] = useState(false);
  const center: [number, number] = lat && lng ? [parseFloat(lat), parseFloat(lng)] : [10.7769, 106.7009];

  return (
    <div className="space-y-2">
      <Label>Vị trí bản đồ</Label>
      <div className="rounded-lg overflow-hidden border h-64">
        <MapContainer center={center} zoom={15} style={{ height: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onMapClick={async (la, ln) => {
            setLoading(true);
            const addr = await reverseGeocode(la, ln);
            onPick(la.toFixed(6), ln.toFixed(6), addr);
            setLoading(false);
          }} />
          {lat && lng && <Marker position={[parseFloat(lat), parseFloat(lng)]} />}
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">{loading ? "Đang lấy địa chỉ..." : "Click bản đồ để chọn tọa độ"}</p>
    </div>
  );
}

export default function Stalls() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/restaurants");
      const data = await res.json();
      setRestaurants(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRestaurants(); }, []);

  const handleSubmit = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `http://localhost:3000/api/restaurants/${editingId}` : "http://localhost:3000/api/restaurants";
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    setShowForm(false);
    fetchRestaurants();
  };

  const handleEdit = (r: Restaurant) => {
    setEditingId(r.restaurant_id);
    setFormData({
      name: r.name, description: r.description || "", address: r.address,
      phone: r.phone || "", lat: r.lat?.toString() || "", lng: r.lng?.toString() || "",
      open_hour: r.open_hour || "", close_hour: r.close_hour || "",
      rating: r.rating.toString(), status: r.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Xóa gian hàng này?")) {
      await fetch(`http://localhost:3000/api/restaurants/${id}`, { method: "DELETE" });
      fetchRestaurants();
    }
  };

  const filtered = restaurants.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Quản lý Gian hàng" onLogout={() => navigate("/login")}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm gian hàng..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setEditingId(null); setFormData(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Thêm mới
          </Button>
        </div>

        {showForm && (
          <div className="border rounded-xl p-6 bg-card shadow-sm space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{editingId ? "Sửa gian hàng" : "Tạo gian hàng mới"}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên gian hàng</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Mở cửa</SelectItem>
                    <SelectItem value="closed">Đóng cửa</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <MapPicker lat={formData.lat} lng={formData.lng} onPick={(la, ln, ad) => setFormData({...formData, lat: la, lng: ln, address: ad})} />
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>Lưu thay đổi</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(stall => (
            <div key={stall.restaurant_id} className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg">{stall.name}</h4>
                  <p className="text-sm text-muted-foreground">Chủ: {stall.owner_name || "Trống"}</p>
                </div>
                <Badge variant={stall.status === 'open' ? 'default' : 'destructive'}>{stall.status}</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /><span className="truncate">{stall.address}</span></div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{stall.rating}</div>
                  <div className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3" />{stall.dish_count} món</div>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(stall)}><Edit2 className="h-4 w-4 mr-1" /> Sửa</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(stall.restaurant_id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
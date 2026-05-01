import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Lock, X, Edit2, RotateCcw, Trash2, MapPin, Clock, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiUrl } from "@/lib/api";

// ── Fix Leaflet icon bị mất khi dùng với Vite/Webpack ──────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Component xử lý click trên map ─────────────────────────────
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Reverse geocoding: lat/lng → địa chỉ (Nominatim) ───────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
      { headers: { "Accept-Language": "vi" } }
    );
    const data = await res.json();
    return data.display_name || "";
  } catch {
    return "";
  }
}

// ── Map Picker Component tái sử dụng ───────────────────────────
interface MapPickerProps {
  lat: string;
  lng: string;
  onPick: (lat: string, lng: string, address: string) => void;
  label?: string;
}

function MapPicker({ lat, lng, onPick, label = "📍 Chọn vị trí trên bản đồ" }: MapPickerProps) {
  const [geocoding, setGeocoding] = useState(false);

  // 👉 FIX: ép kiểu tuple chuẩn
  const center: [number, number] = (lat && lng
    ? [parseFloat(lat), parseFloat(lng)]
    : [10.7769, 106.7009]) as [number, number];

  // 👉 helper chuẩn hóa latlng
  const toLatLng = (lat: string, lng: string): [number, number] => [
    parseFloat(lat),
    parseFloat(lng),
  ];

  const handleClick = useCallback(async (clat: number, clng: number) => {
    setGeocoding(true);
    const address = await reverseGeocode(clat, clng);
    onPick(clat.toFixed(6), clng.toFixed(6), address);
    setGeocoding(false);
  }, [onPick]);

  return (
    <div className="space-y-2">
      <Label className="block">{label}</Label>

      <div className="rounded-lg overflow-hidden border h-72">
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          <MapClickHandler onMapClick={handleClick} />

          {/* 👉 FIX: ép kiểu Marker */}
          {lat && lng && (
            <Marker position={toLatLng(lat, lng)}>
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
          : lat && lng
            ? `✅ Đã chọn: ${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`
            : "⬆️ Chưa chọn vị trí"}
      </p>
    </div>
  );
}

// ── Interfaces ──────────────────────────────────────────────────
interface Restaurant {
  restaurant_id: number;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  lat?: number;
  lng?: number;
  open_hour?: string;
  close_hour?: string;
  rating: number;
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

interface POI {
  link_id: number;
  restaurant_id: number;
  name: string;
  address: string;
  rating: number;
  status: string;
  added_at: string;
}

interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  restaurant_name: string;
  restaurant_id: number;
  created_at: string;
}

interface DeletedUser {
  deleted_id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  restaurant_name: string;
  restaurant_id?: number;
  deleted_at: string;
  deleted_by: string;
}

const EMPTY_USER_FORM = {
  name: "", email: "", phone: "", password: "",
  restaurant_name: "", restaurant_address: "", restaurant_phone: "",
  restaurant_lat: "", restaurant_lng: "",
  restaurant_open_hour: "", restaurant_close_hour: "",
  restaurant_rating: "0", restaurant_description: ""
};

// ── Main Component ──────────────────────────────────────────────
export default function StallOwners() {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  // User form
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(EMPTY_USER_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");



  // POI
  const [showPoiModal, setShowPoiModal] = useState(false);
  const [currentUserForPoi, setCurrentUserForPoi] = useState<User | null>(null);
  const [userPois, setUserPois] = useState<POI[]>([]);
  const [selectedPoiId, setSelectedPoiId] = useState<string>("null");
  const [addingPoi, setAddingPoi] = useState(false);
  const [poiError, setPoiError] = useState("");

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState("");

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const data = await fetch(apiUrl("/api/users")).then(r => r.json());
      setUsers(data);
    } catch { console.error("Lỗi lấy users"); }
    finally { setLoading(false); }
  };
  const fetchDeletedUsers = async () => {
    try {
      const data = await fetch(apiUrl("/api/users/deleted")).then(r => r.json());
      setDeletedUsers(data);
    } catch { console.error("Lỗi lấy deleted users"); }
  };
  const fetchRestaurants = async () => {
    try {
      const data = await fetch(apiUrl("/api/restaurants")).then(r => r.json());
      setRestaurants(data);
    } catch { console.error("Lỗi lấy restaurants"); }
  };
  const fetchUserPois = async (userId: number) => {
    try {
      const data = await fetch(
        `http://localhost/ThuyetMinhTuDongDaNgonNguPhoAmThucVinhKhach/POIApi/owner_api.php?action=user_pois&user_id=${userId}`
      ).then(r => r.json());
      if (data.success) setUserPois(data.data.pois);
    } catch { console.error("Lỗi lấy POI"); }
  };

  useEffect(() => {
    fetchUsers();
    fetchDeletedUsers();
    fetchRestaurants();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────
  const showSuccess = (msg: string) => {
    setSuccessModalMessage(msg);
    setShowSuccessModal(true);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("vi-VN");

  const resetUserForm = () => {
    setFormData(EMPTY_USER_FORM);
    setEditingUser(null);
    setShowForm(false);
    setError("");
  };

  const closePoiModal = () => {
    setShowPoiModal(false);
    setCurrentUserForPoi(null);
    setUserPois([]);
    setSelectedPoiId("null");
    setPoiError("");
    fetchUsers();
  };

  // ── User Handlers ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name.trim()) { setError("Vui lòng nhập tên"); return; }
    if (!editingUser && !formData.password.trim()) { setError("Vui lòng nhập mật khẩu"); return; }
    if (!editingUser && !formData.restaurant_name.trim()) { setError("Vui lòng nhập tên gian hàng"); return; }
    if (!editingUser && !formData.restaurant_address.trim()) { setError("Vui lòng nhập địa chỉ gian hàng"); return; }

    setSaving(true);
    setError("");
    try {
      let restaurantId: number | null = null;

      if (!editingUser) {
        const rRes = await fetch(apiUrl("/api/restaurants"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.restaurant_name,
            description: formData.restaurant_description || null,
            address: formData.restaurant_address,
            phone: formData.restaurant_phone || null,
            lat: formData.restaurant_lat || null,
            lng: formData.restaurant_lng || null,
            open_hour: formData.restaurant_open_hour || null,
            close_hour: formData.restaurant_close_hour || null,
            rating: formData.restaurant_rating || "0",
            status: "open"
          })
        });
        if (!rRes.ok) { const e = await rRes.json(); setError("Lỗi tạo gian hàng: " + (e.error || "?")); setSaving(false); return; }
        const rResult = await rRes.json();
        restaurantId = rResult.data.restaurant_id;
      }

      const uRes = await fetch(
        editingUser ? apiUrl(`/api/users/${editingUser.user_id}`) : apiUrl("/api/users"),
        {
          method: editingUser ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            restaurant_id: restaurantId,
            ...(!editingUser && { password: formData.password })
          })
        }
      );
      if (!uRes.ok) { const e = await uRes.json(); setError(e.error || "Lỗi khi lưu"); return; }

      showSuccess(`✅ ${editingUser ? "Cập nhật" : "Tạo quản trị viên và gian hàng"} thành công!`);
      resetUserForm();
      fetchUsers();
      fetchRestaurants();
    } catch { setError("Không thể kết nối server"); }
    finally { setSaving(false); }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ ...EMPTY_USER_FORM, name: user.name, email: user.email || "", phone: user.phone || "" });
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Khóa tài khoản "${name}" và gian hàng của họ?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/users/${id}`), { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); alert("Lỗi: " + (e.error || "?")); return; }
      showSuccess("✅ Đã khóa tài khoản và gian hàng thành công");
      fetchUsers(); fetchDeletedUsers(); fetchRestaurants();
    } catch (e) { alert("❌ Lỗi: " + (e instanceof Error ? e.message : "?")); }
  };

  const handleRestore = async (deletedId: number, userName: string) => {
    if (!confirm(`Khôi phục tài khoản "${userName}"?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/users/restore/${deletedId}`), { method: "POST" });
      if (!res.ok) { const e = await res.json(); alert("Lỗi: " + (e.error || "?")); return; }
      showSuccess("✅ Khôi phục tài khoản thành công");
      fetchUsers(); fetchDeletedUsers(); fetchRestaurants();
    } catch { alert("❌ Lỗi khi khôi phục"); }
  };

  const handlePermanentDelete = async (deletedId: number, userName: string) => {
    if (!confirm(`Xóa vĩnh viễn tài khoản "${userName}"?\nNếu xóa, toàn bộ dữ liệu liên quan sẽ mất khỏi database.`)) return;
    try {
      const res = await fetch(apiUrl(`/api/users/permanent/${deletedId}`), { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); alert("Lỗi: " + (e.error || "?")); return; }
      showSuccess("✅ Đã xóa vĩnh viễn tài khoản và dữ liệu liên quan");
      fetchDeletedUsers(); fetchRestaurants();
    } catch { alert("❌ Lỗi khi xóa vĩnh viễn"); }
  };

  // ── POI Handlers ──────────────────────────────────────────────
  const handleAddPoi = async () => {
    if (!currentUserForPoi || selectedPoiId === "null") { setPoiError("Vui lòng chọn POI"); return; }
    setAddingPoi(true); setPoiError("");
    try {
      const data = await fetch(
        "http://localhost/ThuyetMinhTuDongDaNgonNguPhoAmThucVinhKhach/POIApi/owner_api.php?action=add_poi_to_user",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: currentUserForPoi.user_id, restaurant_id: parseInt(selectedPoiId), admin_email: "admin@system.local" }) }
      ).then(r => r.json());
      if (data.success) { await fetchUserPois(currentUserForPoi.user_id); setSelectedPoiId("null"); }
      else setPoiError(data.error || "Lỗi khi thêm POI");
    } catch { setPoiError("Không thể kết nối server"); }
    finally { setAddingPoi(false); }
  };

  const handleRemovePoi = async (poiLinkId: number, restaurantId: number) => {
    if (!currentUserForPoi || !confirm("Bạn chắc chắn muốn xóa POI này?")) return;
    try {
      const data = await fetch(
        "http://localhost/ThuyetMinhTuDongDaNgonNguPhoAmThucVinhKhach/POIApi/owner_api.php?action=remove_poi_from_user",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: currentUserForPoi.user_id, restaurant_id: restaurantId }) }
      ).then(r => r.json());
      if (data.success) await fetchUserPois(currentUserForPoi.user_id);
      else alert("Lỗi: " + (data.error || "?"));
    } catch { alert("Lỗi khi xóa POI"); }
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

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
    <AdminLayout title="Quản lý Chủ Gian Hàng" onLogout={handleLogout}>
      <div className="space-y-4 animate-fade-in">

        {/* ── Tabs ── */}
        <div className="flex gap-2 border-b">
          {[
            { key: "active", label: `Quản trị viên (${users.length})` },
            { key: "deleted", label: `Ngưng hoạt động (${deletedUsers.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.key ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            TAB: QUẢN TRỊ VIÊN
        ══════════════════════════════════════════ */}
        {activeTab === "active" && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Tìm theo tên..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Button onClick={() => { setShowForm(true); setEditingUser(null); setFormData(EMPTY_USER_FORM); setError(""); }}>
                <Plus className="mr-2 h-4 w-4" /> Thêm mới
              </Button>
            </div>

            {/* Form thêm/sửa user */}
            {showForm && (
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">{editingUser ? "Chỉnh sửa quản trị viên" : "Thêm quản trị viên & gian hàng"}</h3>
                  <button onClick={resetUserForm}><X className="h-4 w-4" /></button>
                </div>

                {/* Thông tin chủ */}
                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-3">👤 Thông tin chủ gian hàng</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Họ tên *</Label>
                      <Input placeholder="Nguyễn Văn A" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" placeholder="email@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Số điện thoại</Label>
                      <Input placeholder="090xxxxxxx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    {!editingUser && (
                      <div className="space-y-1.5">
                        <Label>Mật khẩu *</Label>
                        <Input type="password" placeholder="Tối thiểu 6 ký tự" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Thông tin gian hàng — chỉ khi thêm mới */}
                {!editingUser && (
                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-semibold text-sm">🏪 Thông tin gian hàng</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Tên gian hàng *</Label>
                        <Input placeholder="Tên gian hàng" value={formData.restaurant_name} onChange={e => setFormData({ ...formData, restaurant_name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Địa chỉ *</Label>
                        <Input
                          placeholder="Chọn vị trí trên bản đồ hoặc nhập tay"
                          value={formData.restaurant_address}
                          onChange={e => setFormData({ ...formData, restaurant_address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Số điện thoại gian hàng</Label>
                        <Input placeholder="Số điện thoại" value={formData.restaurant_phone} onChange={e => setFormData({ ...formData, restaurant_phone: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Rating</Label>
                        <Input type="number" placeholder="0" min="0" max="5" step="0.1" value={formData.restaurant_rating} onChange={e => setFormData({ ...formData, restaurant_rating: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Giờ mở cửa</Label>
                        <Input type="time" value={formData.restaurant_open_hour} onChange={e => setFormData({ ...formData, restaurant_open_hour: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Giờ đóng cửa</Label>
                        <Input type="time" value={formData.restaurant_close_hour} onChange={e => setFormData({ ...formData, restaurant_close_hour: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mô tả gian hàng</Label>
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                        rows={3}
                        placeholder="Mô tả gian hàng"
                        value={formData.restaurant_description}
                        onChange={e => setFormData({ ...formData, restaurant_description: e.target.value })}
                      />
                    </div>

                    {/* Map picker */}
                    <MapPicker
                      lat={formData.restaurant_lat}
                      lng={formData.restaurant_lng}
                      onPick={(lat, lng, address) => setFormData(prev => ({
                        ...prev,
                        restaurant_lat: lat,
                        restaurant_lng: lng,
                        restaurant_address: address || prev.restaurant_address
                      }))}
                    />
                  </div>
                )}

                {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleSubmit} disabled={saving}>{saving ? "Đang lưu..." : editingUser ? "Cập nhật" : "Lưu"}</Button>
                  <Button variant="outline" onClick={resetUserForm}>Hủy</Button>
                </div>
              </div>
            )}

            {/* Bảng users */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Gian hàng</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Không tìm thấy kết quả</TableCell></TableRow>
                  ) : filtered.map(user => (
                    <TableRow key={user.user_id}>
                      <TableCell className="text-muted-foreground">#{user.user_id}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>{user.phone || "—"}</TableCell>
                      <TableCell>
                        {user.restaurant_name
                          ? <Badge variant="outline">{user.restaurant_name}</Badge>
                          : <Badge variant="secondary">Chưa phân công</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(user)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(user.user_id, user.name)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Khóa">
                            <Lock className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            TAB: NGƯNG HOẠT ĐỘNG
        ══════════════════════════════════════════ */}
        {activeTab === "deleted" && (
          <div className="space-y-4">
            {deletedUsers.length === 0 ? (
              <div className="rounded-lg border bg-muted/50 p-6 text-center"><p className="text-muted-foreground">Không có tài khoản bị khóa nào</p></div>
            ) : (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Gian hàng</TableHead>
                      <TableHead>Ngày khóa</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedUsers.map(user => (
                      <TableRow key={user.deleted_id}>
                        <TableCell className="text-muted-foreground">#{user.user_id}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                        <TableCell>{user.restaurant_name ? <Badge variant="outline">{user.restaurant_name}</Badge> : <Badge variant="secondary">Không có</Badge>}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(user.deleted_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button onClick={() => handleRestore(user.deleted_id, user.name)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-green-50 hover:text-green-600 transition-colors" title="Khôi phục">
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            <button onClick={() => handlePermanentDelete(user.deleted_id, user.name)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Xóa vĩnh viễn">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ══ Modal: POI ══ */}
        {showPoiModal && currentUserForPoi && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl animate-in fade-in zoom-in duration-300 overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
                <h3 className="text-xl font-bold">🏪 Thêm POI cho: {currentUserForPoi.name}</h3>
                <button onClick={closePoiModal}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Thêm POI mới</h4>
                  <div className="flex gap-2">
                    <Select value={selectedPoiId} onValueChange={setSelectedPoiId}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="-- Chọn POI --" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">-- Chọn POI --</SelectItem>
                        {restaurants.map(r => <SelectItem key={r.restaurant_id} value={r.restaurant_id.toString()}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddPoi} disabled={addingPoi}>{addingPoi ? "Thêm..." : "✓ Thêm"}</Button>
                  </div>
                  {poiError && <p className="text-xs text-destructive">{poiError}</p>}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">POI của User ({userPois.length})</h4>
                  {userPois.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">User chưa có POI nào</div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userPois.map(poi => (
                        <div key={poi.link_id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{poi.name}</p>
                            <p className="text-xs text-muted-foreground">{poi.address}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">⭐ {poi.rating}</Badge>
                              <Badge variant="secondary" className="text-xs">{poi.status}</Badge>
                            </div>
                          </div>
                          <button onClick={() => handleRemovePoi(poi.link_id, poi.restaurant_id)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={closePoiModal} className="w-full bg-gradient-to-r from-blue-500 to-blue-600">Hoàn tất</Button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Modal: Thành công ══ */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Thành công!</h3>
              <p className="text-center text-slate-600 mb-6">{successModalMessage}</p>
              <button onClick={() => setShowSuccessModal(false)} className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all">
                Đóng
              </button>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

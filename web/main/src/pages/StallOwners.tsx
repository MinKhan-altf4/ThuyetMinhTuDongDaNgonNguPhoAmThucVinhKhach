import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, X, Edit2, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Restaurant {
  restaurant_id: number;
  name: string;
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
  deleted_at: string;
  deleted_by: string;
}

export default function StallOwners() {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    restaurant_id: "null"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/users");
      const data = await res.json();
      setUsers(data);
    } catch {
      console.error("Lỗi khi lấy danh sách users");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedUsers = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/users/deleted");
      const data = await res.json();
      setDeletedUsers(data);
    } catch {
      console.error("Lỗi khi lấy danh sách deleted users");
    }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/restaurants");
      const data = await res.json();
      setRestaurants(data);
    } catch {
      console.error("Lỗi khi lấy danh sách nhà hàng");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDeletedUsers();
    fetchRestaurants();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên");
      return;
    }
    
    if (!editingUser && !formData.password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const url = editingUser 
        ? `http://localhost:3000/api/users/${editingUser.user_id}`
        : "http://localhost:3000/api/users";
      
      const method = editingUser ? "PUT" : "POST";
      
      const body: any = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        restaurant_id: formData.restaurant_id && formData.restaurant_id !== "null" ? parseInt(formData.restaurant_id) : null
      };
      
      if (!editingUser) {
        body.password = formData.password;
      }
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Lỗi khi lưu");
        return;
      }
      
      const result = await res.json();
      const message = editingUser ? "✅ Cập nhật thông tin thành công" : "✅ Thêm tài khoản thành công";
      setSuccessModalMessage(message);
      setShowSuccessModal(true);
      
      resetForm();
      fetchUsers();
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Xóa tài khoản "${name}"? Dữ liệu sẽ được backup.`)) return;
    try {
      const res = await fetch(`http://localhost:3000/api/users/${id}`, { 
        method: "DELETE" 
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert("Lỗi: " + (err.error || "Không thể xóa"));
        return;
      }

      setSuccessModalMessage("✅ Đã xóa và backup dữ liệu thành công");
      setShowSuccessModal(true);
      
      fetchUsers();
      fetchDeletedUsers();
    } catch (err) {
      alert("❌ Lỗi khi xóa: " + (err instanceof Error ? err.message : "Không xác định"));
    }
  };

  const handleRestore = async (deletedId: number, userName: string) => {
    if (!confirm(`Khôi phục tài khoản "${userName}"?`)) return;
    try {
      const res = await fetch(`http://localhost:3000/api/users/restore/${deletedId}`, {
        method: "POST"
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Lỗi: " + (err.error || "Không thể khôi phục"));
        return;
      }

      setSuccessModalMessage("✅ Khôi phục tài khoản thành công");
      setShowSuccessModal(true);
      
      fetchUsers();
      fetchDeletedUsers();
    } catch (err) {
      alert("❌ Lỗi khi khôi phục");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      restaurant_id: user.restaurant_id ? user.restaurant_id.toString() : "null"
    });
    setShowForm(true);
    setError("");
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", password: "", restaurant_id: "null" });
    setEditingUser(null);
    setShowForm(false);
    setError("");
    setSuccessMessage("");
    setShowSuccessModal(false);
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN");

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

        {successMessage && (
          <div className="rounded-lg border border-green-600 bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 font-medium ${activeTab === "active" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            Hoạt động ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("deleted")}
            className={`px-4 py-2 font-medium ${activeTab === "deleted" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            Ngưng hoạt động ({deletedUsers.length})
          </button>
        </div>

        {activeTab === "active" && (
          <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        


         <Button onClick={() => navigate("/stall-owners/add")}> 
  <Plus className="mr-2 h-4 w-4" />
  Thêm mới
</Button>


        </div>

        {showForm && (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-card-foreground">
                {editingUser ? "Chỉnh sửa quản trị viên" : "Thêm quản trị viên mới"}
              </h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Họ tên *</Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input
                  placeholder="090xxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Gian hàng quản lý</Label>
                <Select 
                  value={formData.restaurant_id} 
                  onValueChange={(val) => setFormData({ ...formData, restaurant_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn gian hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">-- Không quản lý gian hàng --</SelectItem>
                    {restaurants.map((r) => (
                      <SelectItem key={r.restaurant_id} value={r.restaurant_id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!editingUser && (
                <div className="space-y-1.5">
                  <Label>Mật khẩu *</Label>
                  <Input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}
            </div>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Đang lưu..." : editingUser ? "Cập nhật" : "Lưu"}
              </Button>
              <Button variant="outline" onClick={resetForm}>Hủy</Button>
            </div>
          </div>
        )}

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
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    Không tìm thấy kết quả
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="text-muted-foreground">#{user.user_id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>{user.phone || "—"}</TableCell>
                    <TableCell>
                      {user.restaurant_name ? (
                        <Badge variant="outline">{user.restaurant_name}</Badge>
                      ) : (
                        <Badge variant="secondary">Chưa phân công</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id, user.name)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
          </>
        )}

        {activeTab === "deleted" && (
          <div className="space-y-4">
            {deletedUsers.length === 0 ? (
              <div className="rounded-lg border bg-muted/50 p-6 text-center">
                <p className="text-muted-foreground">Không có tài khoản bị xóa nào</p>
              </div>
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
                      <TableHead>Ngày xóa</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedUsers.map((user) => (
                      <TableRow key={user.deleted_id}>
                        <TableCell className="text-muted-foreground">#{user.user_id}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                        <TableCell>
                          {user.restaurant_name ? (
                            <Badge variant="outline">{user.restaurant_name}</Badge>
                          ) : (
                            <Badge variant="secondary">Không có</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(user.deleted_at)}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleRestore(user.deleted_id, user.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-green-50 hover:text-green-600 transition-colors"
                            title="Khôi phục"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Modal thành công */}
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
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
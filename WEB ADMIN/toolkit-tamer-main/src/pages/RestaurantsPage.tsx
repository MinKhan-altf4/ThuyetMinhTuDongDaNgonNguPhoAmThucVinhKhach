import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { initialRestaurants, initialDistricts, initialCategories, type Restaurant } from "@/data/mock-data";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const defaultForm = { name: "", address: "", district_id: 1, category_id: 1, founded_year: 2024, open_time: "06:00", close_time: "22:00", price_min_vnd: 0, price_max_vnd: 0, description: "", is_active: true };

export default function RestaurantsPage() {
  const [items, setItems] = useState<Restaurant[]>(initialRestaurants);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filtered = items.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.address.toLowerCase().includes(search.toLowerCase()));
  const districtName = (id: number) => initialDistricts.find((d) => d.id === id)?.name ?? "—";
  const categoryInfo = (id: number) => initialCategories.find((c) => c.id === id);

  const openNew = () => { setEditing(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (r: Restaurant) => {
    setEditing(r);
    setForm({ name: r.name, address: r.address, district_id: r.district_id, category_id: r.category_id, founded_year: r.founded_year ?? 2024, open_time: r.open_time, close_time: r.close_time, price_min_vnd: r.price_min_vnd, price_max_vnd: r.price_max_vnd, description: r.description, is_active: r.is_active });
    setDialogOpen(true);
  };

  const toggleActive = (id: number) => {
    setItems((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !r.is_active } : r));
    toast.success("Đã cập nhật trạng thái");
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Tên quán không được để trống"); return; }
    if (editing) {
      setItems((prev) => prev.map((r) => r.id === editing.id ? { ...r, ...form } : r));
      toast.success("Đã cập nhật");
    } else {
      const newId = Math.max(0, ...items.map((r) => r.id)) + 1;
      setItems((prev) => [...prev, { id: newId, latitude: 0, longitude: 0, phone: null, rating: 0, review_count: 0, ...form } as Restaurant]);
      toast.success("Đã thêm mới");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => { setItems((prev) => prev.filter((r) => r.id !== id)); toast.success("Đã xóa"); };

  const formatPrice = (v: number) => v.toLocaleString("vi-VN") + "đ";

  return (
    <AdminLayout title="Quán ăn" subtitle="Quản lý danh sách quán ăn và điểm POI">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input placeholder="Tìm theo tên hoặc địa chỉ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={14} /> Thêm quán
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Tên</th><th>Loại</th><th>Quận</th><th>Giờ mở</th><th>Giá</th><th>Rating</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((r) => {
                  const cat = categoryInfo(r.category_id);
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td className="font-medium max-w-[200px] truncate">{r.name}</td>
                      <td><span className="inline-flex items-center gap-1">{cat?.icon} <span className="text-muted-foreground">{cat?.name}</span></span></td>
                      <td className="text-muted-foreground">{districtName(r.district_id)}</td>
                      <td className="slug-text">{r.open_time}–{r.close_time}</td>
                      <td className="slug-text">{formatPrice(r.price_min_vnd)}–{formatPrice(r.price_max_vnd)}</td>
                      <td className="slug-text">⭐ {r.rating}</td>
                      <td><button onClick={() => toggleActive(r.id)}><StatusBadge active={r.is_active} /></button></td>
                      <td className="text-right space-x-1">
                        <button onClick={() => openEdit(r)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(r.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">Không tìm thấy kết quả</div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Sửa quán ăn" : "Thêm quán mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tên quán</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Địa chỉ</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quận</Label>
                <Select value={String(form.district_id)} onValueChange={(v) => setForm({ ...form, district_id: Number(v) })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{initialDistricts.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Loại ẩm thực</Label>
                <Select value={String(form.category_id)} onValueChange={(v) => setForm({ ...form, category_id: Number(v) })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{initialCategories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Năm thành lập</Label><Input type="number" value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Giờ mở</Label><Input type="time" value={form.open_time} onChange={(e) => setForm({ ...form, open_time: e.target.value })} className="mt-1" /></div>
              <div><Label>Giờ đóng</Label><Input type="time" value={form.close_time} onChange={(e) => setForm({ ...form, close_time: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Giá thấp nhất (VNĐ)</Label><Input type="number" value={form.price_min_vnd} onChange={(e) => setForm({ ...form, price_min_vnd: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Giá cao nhất (VNĐ)</Label><Input type="number" value={form.price_max_vnd} onChange={(e) => setForm({ ...form, price_max_vnd: Number(e.target.value) })} className="mt-1" /></div>
            </div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Đang hoạt động</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">{editing ? "Cập nhật" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

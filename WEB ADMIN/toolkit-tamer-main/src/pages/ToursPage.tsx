import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { initialTours, initialDistricts, type Tour } from "@/data/mock-data";
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

export default function ToursPage() {
  const [items, setItems] = useState<Tour[]>(initialTours);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tour | null>(null);
  const [form, setForm] = useState({ name: "", description: "", district_id: 1, duration_hrs: 2, distance_km: 2, price_vnd: 0, is_active: true });

  const filtered = items.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const districtName = (id: number) => initialDistricts.find((d) => d.id === id)?.name ?? "—";

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", district_id: 1, duration_hrs: 2, distance_km: 2, price_vnd: 0, is_active: true }); setDialogOpen(true); };
  const openEdit = (t: Tour) => { setEditing(t); setForm({ name: t.name, description: t.description, district_id: t.district_id, duration_hrs: t.duration_hrs, distance_km: t.distance_km, price_vnd: t.price_vnd ?? 0, is_active: t.is_active }); setDialogOpen(true); };

  const toggleActive = (id: number) => {
    setItems((prev) => prev.map((t) => t.id === id ? { ...t, is_active: !t.is_active } : t));
    toast.success("Đã cập nhật trạng thái");
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Tên tour không được để trống"); return; }
    if (editing) {
      setItems((prev) => prev.map((t) => t.id === editing.id ? { ...t, ...form } : t));
      toast.success("Đã cập nhật");
    } else {
      const newId = Math.max(0, ...items.map((t) => t.id)) + 1;
      setItems((prev) => [...prev, { id: newId, ...form }]);
      toast.success("Đã thêm mới");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => { setItems((prev) => prev.filter((t) => t.id !== id)); toast.success("Đã xóa"); };

  return (
    <AdminLayout title="Tours" subtitle="Quản lý các tour ẩm thực">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={14} /> Thêm tour
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="admin-table">
          <thead><tr><th>Tên tour</th><th>Quận</th><th>Thời gian</th><th>Khoảng cách</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((t) => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td className="font-medium max-w-xs truncate">{t.name}</td>
                  <td className="text-muted-foreground">{districtName(t.district_id)}</td>
                  <td className="slug-text">{t.duration_hrs}h</td>
                  <td className="slug-text">{t.distance_km} km</td>
                  <td><button onClick={() => toggleActive(t.id)}><StatusBadge active={t.is_active} /></button></td>
                  <td className="text-right space-x-1">
                    <button onClick={() => openEdit(t)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(t.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">Không tìm thấy kết quả</div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Sửa tour" : "Thêm tour mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tên tour</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Quận</Label>
              <Select value={String(form.district_id)} onValueChange={(v) => setForm({ ...form, district_id: Number(v) })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{initialDistricts.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Thời gian (giờ)</Label><Input type="number" step="0.5" value={form.duration_hrs} onChange={(e) => setForm({ ...form, duration_hrs: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Khoảng cách (km)</Label><Input type="number" step="0.1" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: Number(e.target.value) })} className="mt-1" /></div>
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

import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { initialDistricts, type District } from "@/data/mock-data";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function DistrictsPage() {
  const [items, setItems] = useState<District[]>(initialDistricts);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<District | null>(null);
  const [form, setForm] = useState({ name: "", city: "Hồ Chí Minh", description: "" });

  const filtered = items.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setForm({ name: "", city: "Hồ Chí Minh", description: "" }); setDialogOpen(true); };
  const openEdit = (d: District) => { setEditing(d); setForm({ name: d.name, city: d.city, description: d.description }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Tên quận không được để trống"); return; }
    if (editing) {
      setItems((prev) => prev.map((d) => (d.id === editing.id ? { ...d, ...form } : d)));
      toast.success("Đã cập nhật");
    } else {
      const newId = Math.max(0, ...items.map((d) => d.id)) + 1;
      setItems((prev) => [...prev, { id: newId, ...form }]);
      toast.success("Đã thêm mới");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setItems((prev) => prev.filter((d) => d.id !== id));
    toast.success("Đã xóa");
  };

  return (
    <AdminLayout title="Quận / Khu vực" subtitle="Quản lý danh sách quận và khu vực">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={14} /> Thêm quận
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Thành phố</th>
              <th>Mô tả</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((d) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td className="slug-text">{d.id}</td>
                  <td className="font-medium">{d.name}</td>
                  <td className="text-muted-foreground">{d.city}</td>
                  <td className="text-muted-foreground max-w-xs truncate">{d.description}</td>
                  <td className="text-right space-x-1">
                    <button onClick={() => openEdit(d)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(d.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">Không tìm thấy kết quả</div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Sửa quận" : "Thêm quận mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tên quận</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Thành phố</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} /></div>
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

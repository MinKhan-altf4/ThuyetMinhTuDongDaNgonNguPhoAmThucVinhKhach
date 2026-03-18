import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { initialCategories, type Category } from "@/data/mock-data";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ slug: "", name: "", icon: "", color_hex: "#000000" });

  const filtered = items.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setForm({ slug: "", name: "", icon: "", color_hex: "#000000" }); setDialogOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ slug: c.slug, name: c.name, icon: c.icon, color_hex: c.color_hex }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.slug.trim()) { toast.error("Slug và tên không được để trống"); return; }
    if (editing) {
      setItems((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
      toast.success("Đã cập nhật");
    } else {
      const newId = Math.max(0, ...items.map((c) => c.id)) + 1;
      setItems((prev) => [...prev, { id: newId, ...form }]);
      toast.success("Đã thêm mới");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => { setItems((prev) => prev.filter((c) => c.id !== id)); toast.success("Đã xóa"); };

  return (
    <AdminLayout title="Loại ẩm thực" subtitle="Quản lý danh mục phân loại ẩm thực">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={14} /> Thêm loại
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr><th>Icon</th><th>Tên</th><th>Slug</th><th>Màu</th><th></th></tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((c) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td className="text-lg">{c.icon}</td>
                  <td className="font-medium">{c.name}</td>
                  <td className="slug-text">{c.slug}</td>
                  <td><span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color_hex }} /><span className="slug-text">{c.color_hex}</span></span></td>
                  <td className="text-right space-x-1">
                    <button onClick={() => openEdit(c)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(c.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
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
          <DialogHeader><DialogTitle>{editing ? "Sửa loại ẩm thực" : "Thêm loại mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tên</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 font-mono" /></div>
            <div><Label>Icon (emoji)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="mt-1" /></div>
            <div><Label>Màu sắc</Label><div className="flex gap-2 mt-1"><Input type="color" value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} className="w-12 h-8 p-0.5" /><Input value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} className="flex-1 font-mono" /></div></div>
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

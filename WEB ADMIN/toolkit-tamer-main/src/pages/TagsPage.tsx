import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { initialTags, type Tag } from "@/data/mock-data";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function TagsPage() {
  const [items, setItems] = useState<Tag[]>(initialTags);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState("");

  const filtered = items.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setName(""); setDialogOpen(true); };
  const openEdit = (t: Tag) => { setEditing(t); setName(t.name); setDialogOpen(true); };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Tên tag không được để trống"); return; }
    if (editing) {
      setItems((prev) => prev.map((t) => (t.id === editing.id ? { ...t, name } : t)));
      toast.success("Đã cập nhật");
    } else {
      const newId = Math.max(0, ...items.map((t) => t.id)) + 1;
      setItems((prev) => [...prev, { id: newId, name }]);
      toast.success("Đã thêm mới");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => { setItems((prev) => prev.filter((t) => t.id !== id)); toast.success("Đã xóa"); };

  return (
    <AdminLayout title="Tags" subtitle="Quản lý nhãn phân loại bổ sung">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={14} /> Thêm tag
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Tên tag</th><th></th></tr></thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((t) => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td className="slug-text">{t.id}</td>
                  <td className="font-medium">{t.name}</td>
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Sửa tag" : "Thêm tag mới"}</DialogTitle></DialogHeader>
          <div><Label>Tên tag</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">{editing ? "Cập nhật" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

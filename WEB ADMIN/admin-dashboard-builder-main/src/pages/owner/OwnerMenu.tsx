import { useState } from "react";
import { StallOwnerLayout } from "@/components/StallOwnerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, ImagePlus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Dish {
  id: number;
  name: string;
  price: string;
  category: string;
  description: string;
  status: "available" | "unavailable";
  image: string;
}

const initialDishes: Dish[] = [
  { id: 1, name: "Phở Bò Đặc Biệt", price: "55,000₫", category: "Món chính", description: "Phở bò truyền thống với nước dùng thơm ngon", status: "available", image: "🍜" },
  { id: 2, name: "Phở Bò Tái", price: "45,000₫", category: "Món chính", description: "Phở bò tái lát mỏng", status: "available", image: "🍲" },
  { id: 3, name: "Phở Gà", price: "50,000₫", category: "Món chính", description: "Phở gà ta thả vườn", status: "available", image: "🐔" },
  { id: 4, name: "Gỏi cuốn", price: "25,000₫", category: "Ăn nhẹ", description: "Gỏi cuốn tôm thịt", status: "available", image: "🥗" },
  { id: 5, name: "Nước mía", price: "15,000₫", category: "Đồ uống", description: "Nước mía tươi ép", status: "unavailable", image: "🥤" },
  { id: 6, name: "Chè ba màu", price: "20,000₫", category: "Tráng miệng", description: "Chè ba màu thập cẩm", status: "available", image: "🍨" },
];

export default function OwnerMenu() {
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDish, setNewDish] = useState({ name: "", price: "", category: "", description: "" });
  const { toast } = useToast();

  const filteredDishes = dishes.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDish = () => {
    if (!newDish.name || !newDish.price || !newDish.category) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    const dish: Dish = {
      id: Date.now(),
      name: newDish.name,
      price: newDish.price,
      category: newDish.category,
      description: newDish.description,
      status: "available",
      image: "🍽️",
    };
    setDishes([dish, ...dishes]);
    setNewDish({ name: "", price: "", category: "", description: "" });
    setIsModalOpen(false);
    toast({ title: "Đã thêm món mới thành công!" });
  };

  const toggleStatus = (id: number) => {
    setDishes(dishes.map((d) =>
      d.id === id ? { ...d, status: d.status === "available" ? "unavailable" : "available" } : d
    ));
  };

  return (
    <StallOwnerLayout title="Quản lý Món ăn">
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm món ăn..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-1" /> Thêm món mới
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDishes.map((dish) => (
            <Card key={dish.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="h-32 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-5xl">
                {dish.image}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">{dish.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{dish.description}</p>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">{dish.category}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-orange-600">{dish.price}</span>
                  <div className="flex items-center gap-1">
                    <Badge
                      className="cursor-pointer text-[10px]"
                      variant={dish.status === "available" ? "default" : "secondary"}
                      onClick={() => toggleStatus(dish.id)}
                    >
                      {dish.status === "available" ? "Còn hàng" : "Hết hàng"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm món mới</DialogTitle>
              <DialogDescription>Nhập thông tin món ăn để thêm vào thực đơn.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên món ăn</Label>
                <Input placeholder="VD: Phở Bò Đặc Biệt" value={newDish.name} onChange={(e) => setNewDish({ ...newDish, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Giá</Label>
                  <Input placeholder="VD: 55,000₫" value={newDish.price} onChange={(e) => setNewDish({ ...newDish, price: e.target.value })} />
                </div>
                <div>
                  <Label>Phân loại</Label>
                  <Select value={newDish.category} onValueChange={(v) => setNewDish({ ...newDish, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Món chính">Món chính</SelectItem>
                      <SelectItem value="Ăn nhẹ">Ăn nhẹ</SelectItem>
                      <SelectItem value="Đồ uống">Đồ uống</SelectItem>
                      <SelectItem value="Tráng miệng">Tráng miệng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea placeholder="Mô tả món ăn..." value={newDish.description} onChange={(e) => setNewDish({ ...newDish, description: e.target.value })} />
              </div>
              <div>
                <Label>Hình ảnh</Label>
                <div className="mt-1 flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-orange-400 transition-colors">
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">Tải ảnh lên</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Huỷ</Button>
              <Button onClick={handleAddDish} className="bg-orange-500 hover:bg-orange-600 text-white">Thêm món</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StallOwnerLayout>
  );
}

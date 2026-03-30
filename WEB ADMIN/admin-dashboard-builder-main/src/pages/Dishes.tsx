import { AdminLayout } from "@/components/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const dishes = [
  { id: 1, name: "Phở Bò Đặc Biệt", stall: "Phở Hà Nội", price: "55,000₫", category: "Món chính", status: "available" },
  { id: 2, name: "Bún Bò Giò Heo", stall: "Bún Bò Huế", price: "60,000₫", category: "Món chính", status: "available" },
  { id: 3, name: "Cơm Tấm Sườn Bì Chả", stall: "Cơm Tấm Sài Gòn", price: "50,000₫", category: "Món chính", status: "available" },
  { id: 4, name: "Bánh Mì Thịt Nướng", stall: "Bánh Mì 24h", price: "30,000₫", category: "Ăn nhẹ", status: "unavailable" },
  { id: 5, name: "Chè Thái Thập Cẩm", stall: "Chè Thái", price: "25,000₫", category: "Tráng miệng", status: "available" },
  { id: 6, name: "Hủ Tiếu Khô", stall: "Hủ Tiếu Nam Vang", price: "45,000₫", category: "Món chính", status: "available" },
];

export default function Dishes() {
  return (
    <AdminLayout title="Quản lý Món Ăn">
      <div className="space-y-4 animate-fade-in">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm món ăn..." className="pl-9" />
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên món</TableHead>
                <TableHead>Gian hàng</TableHead>
                <TableHead>Phân loại</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes.map((dish) => (
                <TableRow key={dish.id}>
                  <TableCell className="font-medium">{dish.name}</TableCell>
                  <TableCell className="text-muted-foreground">{dish.stall}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dish.category}</Badge>
                  </TableCell>
                  <TableCell>{dish.price}</TableCell>
                  <TableCell>
                    <Badge variant={dish.status === "available" ? "default" : "secondary"}>
                      {dish.status === "available" ? "Còn hàng" : "Hết hàng"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

import { StallOwnerLayout } from "@/components/StallOwnerLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";

const customers = [
  { id: 1, name: "Nguyễn Văn An", phone: "0912***456", orders: 23, lastOrder: "Hôm nay", rating: 5, feedback: "Phở rất ngon, nước dùng đậm đà!" },
  { id: 2, name: "Trần Thị Bình", phone: "0987***321", orders: 18, lastOrder: "Hôm qua", rating: 4, feedback: "Món ăn ngon, giao hơi chậm." },
  { id: 3, name: "Lê Hoàng Cường", phone: "0901***789", orders: 15, lastOrder: "3 ngày trước", rating: 5, feedback: "Tuyệt vời! Sẽ quay lại." },
  { id: 4, name: "Phạm Minh Đức", phone: "0933***654", orders: 12, lastOrder: "Tuần trước", rating: 3, feedback: "Phần ăn hơi ít so với giá." },
  { id: 5, name: "Hoàng Thị Em", phone: "0978***111", orders: 9, lastOrder: "2 tuần trước", rating: 4, feedback: "Gỏi cuốn rất tươi ngon." },
  { id: 6, name: "Vũ Quốc Phong", phone: "0966***222", orders: 7, lastOrder: "Tháng trước", rating: 5, feedback: "Quán quen, luôn ủng hộ!" },
];

export default function OwnerCustomers() {
  return (
    <StallOwnerLayout title="Thông tin Khách hàng">
      <div className="space-y-4 animate-fade-in">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm khách hàng..." className="pl-9" />
        </div>

        <div className="rounded-xl border-0 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Khách hàng</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead className="text-center">Số đơn</TableHead>
                <TableHead>Đơn gần nhất</TableHead>
                <TableHead className="text-center">Đánh giá</TableHead>
                <TableHead>Phản hồi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.phone}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-semibold">{c.orders}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.lastOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: c.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.feedback}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </StallOwnerLayout>
  );
}

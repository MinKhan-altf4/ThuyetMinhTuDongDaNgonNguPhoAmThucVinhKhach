import { AdminLayout } from "@/components/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const customers = [
  { id: 1, name: "Lê Minh G", email: "minhg@email.com", orders: 45, spent: "2,150,000₫", lastOrder: "29/03/2024" },
  { id: 2, name: "Nguyễn Thị H", email: "thih@email.com", orders: 32, spent: "1,680,000₫", lastOrder: "28/03/2024" },
  { id: 3, name: "Trần Đức I", email: "duci@email.com", orders: 28, spent: "1,420,000₫", lastOrder: "27/03/2024" },
  { id: 4, name: "Phạm Thanh K", email: "thanhk@email.com", orders: 15, spent: "780,000₫", lastOrder: "25/03/2024" },
  { id: 5, name: "Đỗ Văn L", email: "vanl@email.com", orders: 8, spent: "420,000₫", lastOrder: "20/03/2024" },
];

export default function Customers() {
  return (
    <AdminLayout title="Quản lý Khách Hàng">
      <div className="space-y-4 animate-fade-in">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm khách hàng..." className="pl-9" />
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Tổng chi tiêu</TableHead>
                <TableHead>Đơn gần nhất</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell>{c.orders}</TableCell>
                  <TableCell>{c.spent}</TableCell>
                  <TableCell className="text-muted-foreground">{c.lastOrder}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

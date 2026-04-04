import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MoreHorizontal } from "lucide-react";

const owners = [
  { id: 1, name: "Nguyễn Văn A", email: "vana@email.com", stall: "Phở Hà Nội", status: "active", joined: "15/01/2024" },
  { id: 2, name: "Trần Thị B", email: "thib@email.com", stall: "Bún Bò Huế", status: "pending", joined: "20/02/2024" },
  { id: 3, name: "Lê Hoàng C", email: "hoangc@email.com", stall: "Cơm Tấm Sài Gòn", status: "active", joined: "05/03/2024" },
  { id: 4, name: "Phạm Minh D", email: "minhd@email.com", stall: "Bánh Mì 24h", status: "active", joined: "10/03/2024" },
  { id: 5, name: "Hoàng Thị E", email: "thie@email.com", stall: "Chè Thái", status: "suspended", joined: "12/03/2024" },
  { id: 6, name: "Võ Đức F", email: "ducf@email.com", stall: "—", status: "pending", joined: "25/03/2024" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Hoạt động", variant: "default" },
  pending: { label: "Chờ duyệt", variant: "secondary" },
  suspended: { label: "Tạm khóa", variant: "destructive" },
};

export default function StallOwners() {
  return (
    <AdminLayout title="Quản lý Chủ Gian Hàng">
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm chủ gian hàng..." className="pl-9" />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm mới
          </Button>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Gian hàng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell className="font-medium">{owner.name}</TableCell>
                  <TableCell className="text-muted-foreground">{owner.email}</TableCell>
                  <TableCell>{owner.stall}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[owner.status].variant}>
                      {statusConfig[owner.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{owner.joined}</TableCell>
                  <TableCell>
                    <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
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

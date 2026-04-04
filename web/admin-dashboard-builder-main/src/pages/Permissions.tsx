import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // ✅ import hook


const permissions = [
  { id: 1, owner: "Nguyễn Văn A", stall: "Phở Hà Nội", canEdit: true, canDelete: false, canViewReports: true, canManageMenu: true },
  { id: 2, owner: "Trần Thị B", stall: "Bún Bò Huế", canEdit: true, canDelete: false, canViewReports: true, canManageMenu: true },
  { id: 3, owner: "Lê Hoàng C", stall: "Cơm Tấm Sài Gòn", canEdit: true, canDelete: true, canViewReports: true, canManageMenu: true },
  { id: 4, owner: "Phạm Minh D", stall: "Bánh Mì 24h", canEdit: false, canDelete: false, canViewReports: false, canManageMenu: false },
];

export default function Permissions() {  const { handleLogout } = useAuth(); // ✅ dùng hook
  return (
    <AdminLayout title="Phân quyền" onLogout={handleLogout}>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 rounded-lg border bg-accent/50 p-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <p className="text-sm text-accent-foreground">
            Quản lý quyền truy cập của chủ gian hàng vào các chức năng hệ thống.
          </p>
        </div>

        <div className="space-y-3">
          {permissions.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground">{p.owner}</h3>
                  <p className="text-sm text-muted-foreground">{p.stall}</p>
                </div>
                <Badge variant="outline">Chủ gian hàng</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Chỉnh sửa thông tin", value: p.canEdit },
                  { label: "Xóa dữ liệu", value: p.canDelete },
                  { label: "Xem báo cáo", value: p.canViewReports },
                  { label: "Quản lý thực đơn", value: p.canManageMenu },
                ].map((perm) => (
                  <div key={perm.label} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <span className="text-xs text-muted-foreground">{perm.label}</span>
                    <Switch defaultChecked={perm.value} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

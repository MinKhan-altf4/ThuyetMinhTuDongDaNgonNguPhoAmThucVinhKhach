import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SystemSettings() {
  return (
    <AdminLayout title="Cài đặt Hệ thống">
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-card-foreground">Thông tin hệ thống</h3>
          <div className="space-y-4">
            <div>
              <Label>Tên hệ thống</Label>
              <Input defaultValue="Hệ thống Quản lý Gian Hàng" className="mt-1" />
            </div>
            <div>
              <Label>Email liên hệ</Label>
              <Input defaultValue="admin@stallsystem.vn" className="mt-1" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-card-foreground">Quy tắc hệ thống</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">Một tài khoản — Một gian hàng</p>
                <p className="text-xs text-muted-foreground">Mỗi chủ gian hàng chỉ được quản lý một gian hàng</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">Phê duyệt tài khoản mới</p>
                <p className="text-xs text-muted-foreground">Yêu cầu admin phê duyệt trước khi tài khoản hoạt động</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">Sao lưu dữ liệu tự động</p>
                <p className="text-xs text-muted-foreground">Tự động sao lưu dữ liệu hàng ngày lúc 2:00 AM</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <Button>Lưu thay đổi</Button>
      </div>
    </AdminLayout>
  );
}

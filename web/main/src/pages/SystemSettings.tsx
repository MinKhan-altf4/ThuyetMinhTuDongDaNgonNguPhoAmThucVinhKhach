import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Database, Lock, Bell, AlertCircle, CheckCircle, FileText } from "lucide-react";

export default function SystemSettings() {
  const { handleLogout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  const [settings, setSettings] = useState({
    system_name: "Hệ thống Quản lý Gian Hàng",
    system_email: "admin@stallsystem.vn",
    system_phone: "1800-1234",
    system_website: "www.stallsystem.vn",
    one_account_one_stall: true,
    require_account_approval: true,
    auto_backup: true,
    maintenance_mode: false,
    max_restaurants_per_admin: 10,
    max_users: 1000,
    session_timeout: 30,
    email_notifications: true,
  });

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSuccessMessage("✅ Cài đặt đã được lưu thành công");
      setSaving(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 1000);
  };

  return (
    <AdminLayout title="Cài đặt Hệ thống" onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-green-600 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "general" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            <Settings className="h-4 w-4" />
            Chung
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "security" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            <Lock className="h-4 w-4" />
            Bảo mật
          </button>
          <button
            onClick={() => setActiveTab("backup")}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "backup" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            <Database className="h-4 w-4" />
            Backup
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "notifications" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            <Bell className="h-4 w-4" />
            Thông báo
          </button>
        </div>

        {/* General Settings */}
        {activeTab === "general" && (
          <div className="max-w-3xl space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-card-foreground flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Thông tin hệ thống
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tên hệ thống</Label>
                  <Input
                    value={settings.system_name}
                    onChange={(e) => handleInputChange("system_name", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email liên hệ</Label>
                  <Input
                    type="email"
                    value={settings.system_email}
                    onChange={(e) => handleInputChange("system_email", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input
                    value={settings.system_phone}
                    onChange={(e) => handleInputChange("system_phone", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={settings.system_website}
                    onChange={(e) => handleInputChange("system_website", e.target.value)}
                    className="mt-1"
                  />
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
                  <Switch
                    checked={settings.one_account_one_stall}
                    onCheckedChange={(val) => handleInputChange("one_account_one_stall", val)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Phê duyệt tài khoản mới</p>
                    <p className="text-xs text-muted-foreground">Yêu cầu admin phê duyệt trước khi hoạt động</p>
                  </div>
                  <Switch
                    checked={settings.require_account_approval}
                    onCheckedChange={(val) => handleInputChange("require_account_approval", val)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-card-foreground">Giới hạn hệ thống</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tối đa gian hàng/admin</Label>
                  <Input
                    type="number"
                    value={settings.max_restaurants_per_admin}
                    onChange={(e) => handleInputChange("max_restaurants_per_admin", parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Tối đa người dùng</Label>
                  <Input
                    type="number"
                    value={settings.max_users}
                    onChange={(e) => handleInputChange("max_users", parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <div className="max-w-3xl space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-card-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Bảo mật
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Thời gian timeout session (phút)</Label>
                  <Input
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => handleInputChange("session_timeout", parseInt(e.target.value))}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">User sẽ bị logout sau thời gian không hoạt động</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Chế độ bảo trì</p>
                    <p className="text-xs text-muted-foreground">Tắt hiệu lực của tất cả tài khoản người dùng</p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(val) => handleInputChange("maintenance_mode", val)}
                  />
                </div>
              </div>
              {settings.maintenance_mode && (
                <div className="mt-4 flex gap-2 rounded-lg border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>⚠️ Chế độ bảo trì đang bật - Người dùng không thể đăng nhập</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Backup Settings */}
        {activeTab === "backup" && (
          <div className="max-w-3xl space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-card-foreground flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Sao lưu & Khôi phục
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Sao lưu tự động hàng ngày</p>
                    <p className="text-xs text-muted-foreground">Thực hiện lúc 02:00 AM mỗi ngày</p>
                  </div>
                  <Switch
                    checked={settings.auto_backup}
                    onCheckedChange={(val) => handleInputChange("auto_backup", val)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sao lưu thủ động</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" className="w-full">Tạo sao lưu ngay</Button>
                    <Button variant="outline" className="w-full">Tải sao lưu</Button>
                  </div>
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium text-card-foreground mb-2">📅 Sao lưu gần đây:</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>✓ 2024-04-06 02:00 AM - 1.2 GB</li>
                    <li>✓ 2024-04-05 02:00 AM - 1.1 GB</li>
                    <li>✓ 2024-04-04 02:00 AM - 1.15 GB</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === "notifications" && (
          <div className="max-w-3xl space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-card-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Thông báo
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Thông báo qua Email</p>
                    <p className="text-xs text-muted-foreground">Nhận thông báo hệ thống qua email</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(val) => handleInputChange("email_notifications", val)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Loại thông báo</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-muted-foreground">Tài khoản mới được tạo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-muted-foreground">Sao lưu hoàn thành</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-muted-foreground">Cảnh báo bảo mật</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-muted-foreground">Lỗi hệ thống</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="px-6">
            {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
          </Button>
          <Button variant="outline">Reset</Button>
        </div>
      </div>
    </AdminLayout>
  );
}

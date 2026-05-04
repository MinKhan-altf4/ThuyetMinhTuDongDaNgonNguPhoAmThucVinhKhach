import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Download, Share2, Smartphone, QrCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Thay đường dẫn này bằng ảnh QR thực tế của bạn ──
// Ví dụ: import qrImage from "@/assets/qr-code.png";
// Hoặc dùng URL public trong /public folder
const QR_IMAGE_URL = "/qrcode.png"; // ← đặt ảnh QR vào public/qr-code.png
const APK_DOWNLOAD_URL = "https://drive.google.com/file/d/1qxhWOVxIpmqtAd9blp0giXYXISn6Rqc2/view?usp=drivesdk"; // ← URL khi quét QR

export default function QRCodePage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/login");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(APK_DOWNLOAD_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = QR_IMAGE_URL;
    link.download = "qr-poiapp.png";
    link.click();
  };

  return (
    <AdminLayout title="Tải ứng dụng" onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Mã QR tải ứng dụng POIApp
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Chia sẻ mã QR này cho người dùng để tải ứng dụng
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* QR Card */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-sm text-card-foreground">Quét để tải app</h3>
            </div>

            {/* QR Image */}
            <div className="flex items-center justify-center p-8 bg-white">
              <div className="relative">
                {/* Decorative corners */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-md" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-md" />

                <img
                  src={QR_IMAGE_URL}
                  alt="QR Code tải POIApp"
                  className="w-56 h-56 object-contain"
                  onError={(e) => {
                    // Fallback nếu không tìm thấy ảnh
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />

                {/* Fallback placeholder nếu ảnh lỗi */}
                <div
                  id="qr-fallback"
                  className="w-56 h-56 flex flex-col items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30"
                  style={{ display: "none" }}
                >
                  <QrCode className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Đặt ảnh QR vào<br />
                    <code className="bg-muted px-1 rounded text-[10px]">public/qr-code.png</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-2 border-t bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDownloadQR}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Tải QR
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "Tải POIApp", url: APK_DOWNLOAD_URL });
                  }
                }}
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                Chia sẻ
              </Button>
            </div>
          </div>

          {/* Info Card */}
          <div className="space-y-4">

            {/* Hướng dẫn */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-sm text-card-foreground mb-4 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-500" />
                Hướng dẫn cài đặt
              </h3>
              <ol className="space-y-3">
                {[
                  "Mở camera điện thoại hoặc app quét QR",
                  "Quét mã QR bên cạnh",
                  "Nhấn vào link xuất hiện để tải file APK",
                  'Bật "Cài từ nguồn không rõ" trong Cài đặt > Bảo mật',
                  "Mở file APK vừa tải và cài đặt",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-card-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Link trực tiếp */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-sm text-card-foreground mb-3">
                Hoặc chia sẻ link trực tiếp
              </h3>
              <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border">
                <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
                  {APK_DOWNLOAD_URL}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 shrink-0"
                  onClick={handleCopy}
                >
                  {copied
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5" />
                  }
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-500 mt-1.5">✓ Đã sao chép!</p>
              )}
            </div>

            {/* Thông tin phiên bản */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-sm text-card-foreground mb-3">
                Thông tin ứng dụng
              </h3>
              <div className="space-y-2">
                {[
                  ["Tên app", "POIApp"],
                  ["Nền tảng", "Android (APK)"],
                  ["Phiên bản", "1.0.0"],
                  ["Yêu cầu", "Android 8.0+"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
import { StallOwnerLayout } from "@/components/StallOwnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, Save, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OwnerSettings() {
  const { toast } = useToast();

  return (
    <StallOwnerLayout title="Cập nhật Gian hàng">
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Hình ảnh gian hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Logo gian hàng</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl bg-orange-100 flex items-center justify-center text-3xl">🍜</div>
                <Button variant="outline" size="sm"><ImagePlus className="h-4 w-4 mr-1" /> Đổi logo</Button>
              </div>
            </div>
            <div>
              <Label>Banner gian hàng</Label>
              <div className="mt-2 h-32 rounded-xl bg-gradient-to-r from-orange-100 to-amber-50 flex items-center justify-center cursor-pointer hover:from-orange-200 hover:to-amber-100 transition-colors">
                <div className="text-center">
                  <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">Tải banner lên (1200x400)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tên gian hàng</Label>
              <Input defaultValue="Phở Hà Nội" />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input defaultValue="0912 345 678" />
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <Input defaultValue="Số 12, Đường Trần Hưng Đạo, Q.1, TP.HCM" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Giờ mở cửa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Giờ mở</Label>
                <Input type="time" defaultValue="06:00" />
              </div>
              <div>
                <Label>Giờ đóng</Label>
                <Input type="time" defaultValue="22:00" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
          onClick={() => toast({ title: "Đã lưu thông tin gian hàng!" })}
        >
          <Save className="h-4 w-4 mr-1" /> Lưu thay đổi
        </Button>
      </div>
    </StallOwnerLayout>
  );
}

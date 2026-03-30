import { StallOwnerLayout } from "@/components/StallOwnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OwnerDescription() {
  const { toast } = useToast();

  return (
    <StallOwnerLayout title="Thuyết minh Gian hàng">
      <div className="max-w-3xl space-y-6 animate-fade-in">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Giới thiệu gian hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tiêu đề</Label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="Phở Hà Nội - Hương vị truyền thống từ năm 1985"
              />
            </div>
            <div>
              <Label>Nội dung thuyết minh</Label>
              <Textarea
                className="min-h-[250px]"
                defaultValue={`Phở Hà Nội được thành lập từ năm 1985, với hơn 35 năm kinh nghiệm mang đến hương vị phở truyền thống Hà Nội chính hiệu giữa lòng Sài Gòn.\n\n🍜 Đặc biệt:\n- Nước dùng ninh xương trong 12 tiếng\n- Bánh phở tươi làm hàng ngày\n- Thịt bò nhập khẩu Úc chất lượng cao\n\n📍 Cam kết:\n- Nguyên liệu tươi sạch 100%\n- Không sử dụng bột ngọt\n- Phục vụ nhanh chóng, tận tâm`}
              />
            </div>
            <div>
              <Label>Câu chuyện thương hiệu</Label>
              <Textarea
                className="min-h-[120px]"
                placeholder="Kể câu chuyện về gian hàng của bạn... Điều gì làm nên sự khác biệt?"
                defaultValue="Từ một xe phở nhỏ trên đường phố Hà Nội, ông bà chúng tôi đã xây dựng nên thương hiệu Phở Hà Nội với tâm niệm: mỗi tô phở là một lời chào thân thương gửi đến thực khách."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => toast({ title: "Đã lưu thuyết minh gian hàng!" })}
          >
            <Save className="h-4 w-4 mr-1" /> Lưu thuyết minh
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-1" /> Xem trước
          </Button>
        </div>
      </div>
    </StallOwnerLayout>
  );
}

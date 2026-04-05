import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, MapPin, Clock, Phone, Mail, User, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AddStallOwner() {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Thông tin user
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  
  // Thông tin nhà hàng
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "",
    description: "",
    address: "",
    lat: "",
    lng: "",
    phone: "",
    open_hour: "",
    close_hour: ""
  });
  
  // Hình ảnh
  const [restaurantImage, setRestaurantImage] = useState<File | null>(null);
  const [restaurantImagePreview, setRestaurantImagePreview] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'restaurant' | 'avatar') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'restaurant') {
        setRestaurantImage(file);
        setRestaurantImagePreview(URL.createObjectURL(file));
      } else {
        setAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    }
  };
  
  const removeImage = (type: 'restaurant' | 'avatar') => {
    if (type === 'restaurant') {
      setRestaurantImage(null);
      setRestaurantImagePreview("");
    } else {
      setAvatar(null);
      setAvatarPreview("");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    // Validate
    if (!userInfo.name.trim()) {
      setError("Vui lòng nhập họ tên chủ gian hàng");
      setLoading(false);
      return;
    }
    
    if (!userInfo.password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      setLoading(false);
      return;
    }
    
    if (userInfo.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }
    
    if (!restaurantInfo.name.trim()) {
      setError("Vui lòng nhập tên gian hàng/nhà hàng");
      setLoading(false);
      return;
    }
    
    const formData = new FormData();
    
    // Thêm thông tin user
    formData.append("name", userInfo.name);
    formData.append("email", userInfo.email);
    formData.append("phone", userInfo.phone);
    formData.append("password", userInfo.password);
    
    // Thêm thông tin nhà hàng
    formData.append("restaurant_name", restaurantInfo.name);
    formData.append("description", restaurantInfo.description);
    formData.append("address", restaurantInfo.address);
    formData.append("lat", restaurantInfo.lat);
    formData.append("lng", restaurantInfo.lng);
    formData.append("phone_restaurant", restaurantInfo.phone);
    formData.append("open_hour", restaurantInfo.open_hour);
    formData.append("close_hour", restaurantInfo.close_hour);
    
    // Thêm hình ảnh
    if (restaurantImage) {
      formData.append("restaurant_image", restaurantImage);
    }
    if (avatar) {
      formData.append("avatar", avatar);
    }
    
    try {
      const res = await fetch("http://localhost:3000/api/owner/register", {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }
      
      setSuccess(data.message);
      setTimeout(() => {
        navigate("/stall-owners");
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AdminLayout title="Thêm mới Chủ Gian Hàng" onLogout={handleLogout}>
      <div className="container mx-auto py-6 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="user" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">
                <User className="mr-2 h-4 w-4" />
                Thông tin chủ gian hàng
              </TabsTrigger>
              <TabsTrigger value="restaurant">
                <Store className="mr-2 h-4 w-4" />
                Thông tin gian hàng
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="user">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>
                    Nhập thông tin của chủ gian hàng
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ tên *</Label>
                      <Input
                        id="name"
                        placeholder="Nguyễn Văn A"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="owner@example.com"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        placeholder="0901234567"
                        value={userInfo.phone}
                        onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Mật khẩu *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Tối thiểu 6 ký tự"
                        value={userInfo.password}
                        onChange={(e) => setUserInfo({ ...userInfo, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Avatar upload */}
                  <div className="space-y-2">
                    <Label>Ảnh đại diện (không bắt buộc)</Label>
                    <div className="flex items-center gap-4">
                      {avatarPreview ? (
                        <div className="relative">
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="w-20 h-20 rounded-full object-cover border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('avatar')}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button type="button" variant="outline" asChild>
                        <label className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Chọn ảnh
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageChange(e, 'avatar')}
                          />
                        </label>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="restaurant">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin gian hàng</CardTitle>
                  <CardDescription>
                    Nhập thông tin chi tiết về gian hàng/nhà hàng
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant_name">Tên gian hàng *</Label>
                    <Input
                      id="restaurant_name"
                      placeholder="Quán Ăn Ngon"
                      value={restaurantInfo.name}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      placeholder="Mô tả về gian hàng, món ăn đặc trưng, lịch sử..."
                      rows={4}
                      value={restaurantInfo.description}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, description: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      <MapPin className="inline mr-2 h-4 w-4" />
                      Địa chỉ
                    </Label>
                    <Input
                      id="address"
                      placeholder="Số nhà, đường, quận/huyện, thành phố"
                      value={restaurantInfo.address}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Vĩ độ (Latitude)</Label>
                      <Input
                        id="lat"
                        placeholder="10.7608"
                        value={restaurantInfo.lat}
                        onChange={(e) => setRestaurantInfo({ ...restaurantInfo, lat: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Kinh độ (Longitude)</Label>
                      <Input
                        id="lng"
                        placeholder="106.6985"
                        value={restaurantInfo.lng}
                        onChange={(e) => setRestaurantInfo({ ...restaurantInfo, lng: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone_restaurant">
                      <Phone className="inline mr-2 h-4 w-4" />
                      Số điện thoại gian hàng
                    </Label>
                    <Input
                      id="phone_restaurant"
                      placeholder="028 3830 1234"
                      value={restaurantInfo.phone}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, phone: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="open_hour">
                        <Clock className="inline mr-2 h-4 w-4" />
                        Giờ mở cửa
                      </Label>
                      <Input
                        id="open_hour"
                        placeholder="06:00"
                        value={restaurantInfo.open_hour}
                        onChange={(e) => setRestaurantInfo({ ...restaurantInfo, open_hour: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="close_hour">Giờ đóng cửa</Label>
                      <Input
                        id="close_hour"
                        placeholder="22:00"
                        value={restaurantInfo.close_hour}
                        onChange={(e) => setRestaurantInfo({ ...restaurantInfo, close_hour: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  {/* Restaurant Image upload */}
                  <div className="space-y-2">
                    <Label>Hình ảnh gian hàng (không bắt buộc)</Label>
                    <div className="flex items-center gap-4">
                      {restaurantImagePreview ? (
                        <div className="relative">
                          <img
                            src={restaurantImagePreview}
                            alt="Restaurant preview"
                            className="w-32 h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('restaurant')}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center border">
                          <Store className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button type="button" variant="outline" asChild>
                        <label className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Chọn ảnh
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageChange(e, 'restaurant')}
                          />
                        </label>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-4 mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Thêm mới"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/stall-owners")}>
              Hủy bỏ
            </Button>
          </div>
        </form>
      </div>
      
    </AdminLayout>
  );
}
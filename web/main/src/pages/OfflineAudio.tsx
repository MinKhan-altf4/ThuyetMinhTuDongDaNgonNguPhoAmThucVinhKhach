import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, AudioLines, RefreshCcw, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── Types ────────────────────────────────────────────────────────
type RestaurantOption = { restaurant_id: number; name: string };
type LanguageOption   = { language_id: number; language_code: string };

type AudioRow = {
  audio_id: number;
  restaurant_id: number;
  restaurant_name: string;
  language_id: number;
  language_code: string;
  audio_url: string;
  file_name: string;
  duration: number | null;
  version: number;
  is_active: number;
  last_updated: string;
  file_exists: boolean;
  preview_url: string | null;
};

type CatalogResponse = {
  restaurants: RestaurantOption[];
  languages: LanguageOption[];
  filesByLanguage: Record<string, string[]>;
  offlineAudioRoot: string;
};

const API_BASE = "http://localhost:3000";

// ── Component ────────────────────────────────────────────────────
export default function OfflineAudio() {
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [catalog, setCatalog]       = useState<CatalogResponse | null>(null);
  const [audios, setAudios]         = useState<AudioRow[]>([]);
  const [search, setSearch]         = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [form, setForm] = useState({ restaurantId: "", languageCode: "", fileName: "", duration: "" });

  useEffect(() => {
    if (!localStorage.getItem("isAdminLoggedIn")) navigate("/login");
  }, [navigate]);

  const fetchData = async (showRefresh = false) => {
    showRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [catalogRes, audioRes] = await Promise.all([
        fetch(`${API_BASE}/api/audio/catalog`),
        fetch(`${API_BASE}/api/audio`),
      ]);
      const [catalogData, audioData] = await Promise.all([catalogRes.json(), audioRes.json()]);
      setCatalog(catalogData);
      setAudios(audioData);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu audio:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/login");
  };

  const availableFiles = useMemo(() =>
    catalog && form.languageCode ? catalog.filesByLanguage[form.languageCode] ?? [] : [],
    [catalog, form.languageCode]
  );

  const filteredAudios = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return audios.filter((a) => {
      if (keyword && !`${a.restaurant_name} ${a.file_name} ${a.language_code}`.toLowerCase().includes(keyword))
        return false;
      if (languageFilter !== "all" && a.language_code !== languageFilter) return false;
      if (statusFilter === "exists"  && !a.file_exists) return false;
      if (statusFilter === "missing" &&  a.file_exists) return false;
      return true;
    });
  }, [audios, search, languageFilter, statusFilter]);

  const handleAddAudio = async () => {
    if (!form.restaurantId || !form.languageCode) {
      alert("Vui lòng chọn gian hàng và ngôn ngữ.");
      return;
    }
    setSubmitting(true);
    try {
      let response: Response;
      if (uploadFile) {
        const payload = new FormData();
        payload.append("restaurant_id", form.restaurantId);
        payload.append("language_code", form.languageCode);
        payload.append("duration", form.duration);
        payload.append("audio", uploadFile);
        response = await fetch(`${API_BASE}/api/audio/upload`, { method: "POST", body: payload });
      } else {
        if (!form.fileName) {
          alert("Vui lòng chọn file có sẵn hoặc tải file mới lên.");
          setSubmitting(false);
          return;
        }
        response = await fetch(`${API_BASE}/api/audio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurant_id: Number(form.restaurantId),
            language_code: form.languageCode,
            file_name: form.fileName,
            duration: form.duration ? Number(form.duration) : null,
            is_active: 1,
          }),
        });
      }

      const result = await response.json();
      if (!response.ok) { alert(result.error || "Không thể thêm audio"); return; }

      setForm({ restaurantId: "", languageCode: "", fileName: "", duration: "" });
      setUploadFile(null);
      await fetchData(true);
    } catch (err) {
      console.error("Lỗi thêm audio:", err);
      alert("Không thể kết nối đến server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAudio = async (audio: AudioRow) => {
    if (!confirm(`Xóa audio "${audio.file_name}" của "${audio.restaurant_name}" khỏi database?`))
      return;
    try {
      const res    = await fetch(`${API_BASE}/api/audio/${audio.audio_id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) { alert(result.error || "Không thể xóa audio"); return; }
      await fetchData(true);
    } catch (err) {
      console.error("Lỗi xóa audio:", err);
      alert("Không thể kết nối đến server");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Audio offline" onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Đang tải dữ liệu audio...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Audio offline" onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">

          {/* ── Form thêm audio ─────────────────────────────────── */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <AudioLines className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Thêm audio offline</h2>
            </div>

            <div className="space-y-4">
              {/* Gian hàng */}
              <div className="space-y-1.5">
                <Label>Gian hàng</Label>
                <Select
                  value={form.restaurantId}
                  onValueChange={(v) => setForm((f) => ({ ...f, restaurantId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn gian hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog?.restaurants.map((r) => (
                      <SelectItem key={r.restaurant_id} value={String(r.restaurant_id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ngôn ngữ */}
              <div className="space-y-1.5">
                <Label>Ngôn ngữ</Label>
                <Select
                  value={form.languageCode}
                  onValueChange={(v) => setForm((f) => ({ ...f, languageCode: v, fileName: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngôn ngữ" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog?.languages.map((l) => (
                      <SelectItem key={l.language_id} value={l.language_code}>
                        {l.language_code.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File có sẵn */}
              <div className="space-y-1.5">
                <Label>File có sẵn</Label>
                <Select
                  value={form.fileName}
                  onValueChange={(v) => setForm((f) => ({ ...f, fileName: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn file có sẵn" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFiles.map((fileName) => (
                      <SelectItem key={fileName} value={fileName}>{fileName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Nếu tải file mới, có thể bỏ qua mục này.
                </p>
              </div>

              {/* Tải file mới */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Tải file MP3 mới
                </Label>
                <Input
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  {uploadFile ? `✓ Đã chọn: ${uploadFile.name}` : "Chưa chọn file."}
                </p>
              </div>

              {/* Thời lượng */}
              <div className="space-y-1.5">
                <Label>Thời lượng (giây)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="Để trống nếu chưa biết"
                />
              </div>

              <Button onClick={handleAddAudio} disabled={submitting} className="w-full">
                {submitting ? "Đang thêm..." : "Thêm audio"}
              </Button>

              {/* Đường dẫn thư mục */}
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground break-all">
                <span className="font-medium">Thư mục audio:</span>{" "}
                <span className="font-mono">{catalog?.offlineAudioRoot}</span>
              </div>
            </div>
          </div>

          {/* ── Bảng audio ──────────────────────────────────────── */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold">Tất cả audio các gian hàng</h2>
                <p className="text-xs text-muted-foreground">
                  File thiếu vật lý sẽ được đánh dấu rõ ràng.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
                <RefreshCcw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Đang tải..." : "Tải lại"}
              </Button>
            </div>

            {/* Bộ lọc */}
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  placeholder="Tìm quán, file..."
                />
              </div>

              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc ngôn ngữ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả ngôn ngữ</SelectItem>
                  {catalog?.languages.map((l) => (
                    <SelectItem key={l.language_id} value={l.language_code}>
                      {l.language_code.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="exists">Có file vật lý</SelectItem>
                  <SelectItem value="missing">Thiếu file vật lý</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bảng */}
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quán</TableHead>
                    <TableHead>Ngôn ngữ</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Phiên bản</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Cập nhật</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Không có audio phù hợp với bộ lọc.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAudios.map((audio) => (
                      <TableRow key={audio.audio_id}>
                        <TableCell>
                          <div className="font-medium">{audio.restaurant_name}</div>
                          <div className="text-xs text-muted-foreground">ID #{audio.restaurant_id}</div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">{audio.language_code.toUpperCase()}</Badge>
                        </TableCell>

                        <TableCell className="max-w-[200px]">
                          <div className="truncate font-mono text-xs">{audio.file_name}</div>
                          <div className="truncate text-xs text-muted-foreground">{audio.audio_url}</div>
                          {audio.preview_url && (
                            <audio controls preload="none" className="mt-2 h-8 w-48">
                              <source src={`${API_BASE}${audio.preview_url}`} type="audio/mpeg" />
                            </audio>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">v{audio.version}</div>
                          <div className="text-xs text-muted-foreground">
                            {audio.duration ? `${audio.duration}s` : "—"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={audio.file_exists ? "default" : "destructive"}>
                              {audio.file_exists ? "Có file" : "Thiếu file"}
                            </Badge>
                            <Badge variant={audio.is_active ? "outline" : "secondary"}>
                              {audio.is_active ? "Đang dùng" : "Tắt"}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(audio.last_updated).toLocaleString("vi-VN")}
                        </TableCell>

                        <TableCell>
                          <button
                            onClick={() => handleDeleteAudio(audio)}
                            title="Xóa audio"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
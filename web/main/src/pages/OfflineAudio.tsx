import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, AudioLines, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

type RestaurantOption = {
  restaurant_id: number;
  name: string;
};

type LanguageOption = {
  language_id: number;
  language_code: string;
};

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

export default function OfflineAudio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [audios, setAudios] = useState<AudioRow[]>([]);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    restaurantId: "",
    languageCode: "",
    fileName: "",
    duration: "",
  });

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [catalogRes, audioRes] = await Promise.all([
        fetch(`${API_BASE}/api/audio/catalog`),
        fetch(`${API_BASE}/api/audio`),
      ]);

      const [catalogData, audioData] = await Promise.all([catalogRes.json(), audioRes.json()]);
      setCatalog(catalogData);
      setAudios(audioData);
    } catch (error) {
      console.error("Loi lay du lieu audio offline:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/login");
  };

  const availableFiles = useMemo(() => {
    if (!catalog || !form.languageCode) {
      return [];
    }
    return catalog.filesByLanguage[form.languageCode] || [];
  }, [catalog, form.languageCode]);

  const filteredAudios = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return audios.filter((audio) => {
      if (keyword) {
        const haystack = `${audio.restaurant_name} ${audio.file_name} ${audio.language_code}`.toLowerCase();
        if (!haystack.includes(keyword)) {
          return false;
        }
      }

      if (languageFilter !== "all" && audio.language_code !== languageFilter) {
        return false;
      }

      if (statusFilter === "exists" && !audio.file_exists) {
        return false;
      }

      if (statusFilter === "missing" && audio.file_exists) {
        return false;
      }

      return true;
    });
  }, [audios, search, languageFilter, statusFilter]);

  const handleAddAudio = async () => {
    if (!form.restaurantId || !form.languageCode) {
      alert("Chon gian hang va ngon ngu.");
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
        response = await fetch(`${API_BASE}/api/audio/upload`, {
          method: "POST",
          body: payload,
        });
      } else {
        if (!form.fileName) {
          alert("Chon file co san hoac tai file moi.");
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
      if (!response.ok) {
        alert(result.error || "Khong the them audio");
        return;
      }

      setForm({ restaurantId: "", languageCode: "", fileName: "", duration: "" });
      setUploadFile(null);
      await fetchData(true);
    } catch (error) {
      console.error("Loi them audio:", error);
      alert("Khong the ket noi server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAudio = async (audio: AudioRow) => {
    if (!confirm(`Xoa audio "${audio.file_name}" cua "${audio.restaurant_name}" khoi database?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/audio/${audio.audio_id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "Khong the xoa audio");
        return;
      }

      await fetchData(true);
    } catch (error) {
      console.error("Loi xoa audio:", error);
      alert("Khong the ket noi server");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Audio offline" onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Dang tai du lieu audio offline...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Audio offline" onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AudioLines className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Them audio offline</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Gian hang</Label>
                <Select value={form.restaurantId} onValueChange={(value) => setForm((prev) => ({ ...prev, restaurantId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chon gian hang" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog?.restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.restaurant_id} value={String(restaurant.restaurant_id)}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Ngon ngu</Label>
                <Select
                  value={form.languageCode}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, languageCode: value, fileName: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chon ngon ngu" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog?.languages.map((language) => (
                      <SelectItem key={language.language_id} value={language.language_code}>
                        {language.language_code.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>File audio</Label>
                <Select value={form.fileName} onValueChange={(value) => setForm((prev) => ({ ...prev, fileName: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chon file co san" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFiles.map((fileName) => (
                      <SelectItem key={fileName} value={fileName}>
                        {fileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Neu tai file moi, co the bo qua muc nay.</p>
              </div>

              <div className="space-y-1.5">
                <Label>Tai file mp3 moi</Label>
                <Input
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  {uploadFile ? `Da chon: ${uploadFile.name}` : "Chua chon file upload."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Thoi luong (giay)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.duration}
                  onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
                  placeholder="De trong neu chua biet"
                />
              </div>

              <Button onClick={handleAddAudio} disabled={submitting} className="w-full">
                {submitting ? "Dang them..." : "Them audio"}
              </Button>

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Thu muc audio hien tai: <span className="font-mono">{catalog?.offlineAudioRoot}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold">Tat ca audio cua cac quan</h2>
                <p className="text-xs text-muted-foreground">
                  Admin co the xem, them va xoa audio cua moi gian hang. File thieu se duoc danh dau ro rang.
                </p>
              </div>
              <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {refreshing ? "Dang tai..." : "Tai lai"}
              </Button>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Tim quan, file..." />
              </div>

              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Loc ngon ngu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tat ca ngon ngu</SelectItem>
                  {catalog?.languages.map((language) => (
                    <SelectItem key={language.language_id} value={language.language_code}>
                      {language.language_code.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Loc trang thai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tat ca trang thai</SelectItem>
                  <SelectItem value="exists">Co file vat ly</SelectItem>
                  <SelectItem value="missing">Thieu file vat ly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quan</TableHead>
                    <TableHead>Ngon ngu</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Trang thai</TableHead>
                    <TableHead>Cap nhat</TableHead>
                    <TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Khong co audio phu hop bo loc.
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
                        <TableCell>
                          <div className="font-mono text-xs">{audio.file_name}</div>
                          <div className="text-xs text-muted-foreground">{audio.audio_url}</div>
                          {audio.preview_url && (
                            <audio controls preload="none" className="mt-2 h-8 w-56">
                              <source src={`${API_BASE}${audio.preview_url}`} type="audio/mpeg" />
                            </audio>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">v{audio.version}</div>
                          <div className="text-xs text-muted-foreground">
                            {audio.duration ? `${audio.duration}s` : "Chua co duration"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={audio.file_exists ? "default" : "destructive"}>
                              {audio.file_exists ? "Co file" : "Thieu file"}
                            </Badge>
                            <Badge variant={audio.is_active ? "outline" : "secondary"}>
                              {audio.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(audio.last_updated).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleDeleteAudio(audio)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Xoa audio"
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

import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatCard } from "@/components/StatCard";
import { Store, UtensilsCrossed, Eye, Star, Map as MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { type LatLngExpression } from "leaflet";
import "leaflet.heat";

type HeatPoint = {
  lat: number | string | null;
  lng: number | string | null;
  weight?: number | string | null;
};

function HeatmapLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap();
  const layerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    if (!map || !points?.length) {
      return;
    }

    const heatData: L.HeatLatLngTuple[] = points
      .map((point) => {
        const lat = Number(point.lat);
        const lng = Number(point.lng);
        const weight = Number(point.weight ?? 1);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        return [lat, lng, Number.isFinite(weight) && weight > 0 ? weight : 1];
      })
      .filter((point): point is L.HeatLatLngTuple => point !== null);

    if (!heatData.length) {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
      }
      layerRef.current = null;
      return;
    }

    if (layerRef.current && map.hasLayer(layerRef.current)) {
      map.removeLayer(layerRef.current);
    }

    layerRef.current = L.heatLayer(heatData, {
      radius: 25,
      blur: 18,
      maxZoom: 17,
      minOpacity: 0.3,
      gradient: {
        0.15: "#2563eb",
        0.35: "#22c55e",
        0.55: "#facc15",
        0.78: "#f97316",
        1: "#dc2626",
      },
    }).addTo(map);

    const bounds = L.latLngBounds(heatData.map(([lat, lng]) => [lat, lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15));
    }

    map.invalidateSize();

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
      }
      layerRef.current = null;
    };
  }, [map, points]);

  return null;
}

interface DashboardData {
  stats: {
    stores: number;
    dishes: number;
    totalVisits: number;
  };
  topRestaurants: {
    name: string;
    rating: number;
    dish_count: number;
    total_views: number;
  }[];
  activities: { name: string; created_at: string }[];
  heatmapData: { name: string; lat: number; lng: number; weight: number }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/stats");
        const result = await response.json();

        setData({
          stats: {
            stores: result.stats?.stores || 0,
            dishes: result.stats?.dishes || 0,
            totalVisits: result.stats?.totalVisits || 0,
          },
          topRestaurants: result.topRestaurants || [],
          activities: result.activities || [],
          heatmapData: result.heatmapData || [],
        });
      } catch (error) {
        console.error("Loi khi lay du lieu dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/login");
  };

  if (loading) {
    return (
      <AdminLayout title="Dang tai..." onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Dang lay du lieu tu he thong...</p>
        </div>
      </AdminLayout>
    );
  }

  const defaultCenter: LatLngExpression = [10.761225, 106.702629];

  return (
    <AdminLayout title="Tong quan" onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Gian hang"
            value={data?.stats.stores || 0}
            change="Tong he thong"
            changeType="positive"
            icon={Store}
            color="emerald"
          />
          <StatCard
            title="Mon an"
            value={data?.stats.dishes || 0}
            change="Dang kinh doanh"
            changeType="positive"
            icon={UtensilsCrossed}
            color="amber"
          />
          <StatCard
            title="Tong luot truy cap POI"
            value={data?.stats.totalVisits || 0}
            change="Tu truoc den nay"
            changeType="positive"
            icon={Eye}
            color="blue"
          />
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <MapIcon className="h-4 w-4 text-primary" />
              Ban do nhiet: Mat do truy cap gian hang
            </h3>
          </div>
          <div className="h-[400px] w-full overflow-hidden rounded-lg border">
            {data?.heatmapData && data.heatmapData.length > 0 ? (
              <MapContainer
                center={defaultCenter}
                zoom={16}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HeatmapLayer points={data.heatmapData} />
              </MapContainer>
            ) : (
              <div className="flex h-full items-center justify-center bg-muted/20">
                <p className="text-sm text-muted-foreground">Chua co du lieu vi tri</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-2 rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Top gian hang thu hut nhat (Luot xem)
            </h3>
            <div className="space-y-4">
              {(data?.topRestaurants || []).map((r, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-6 shrink-0 text-center text-xs font-bold text-muted-foreground">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">{r.name}</p>
                    <p className="flex gap-2 text-xs text-muted-foreground">
                      <span>{r.dish_count} mon an</span>
                      <span>•</span>
                      <span className="text-blue-500">{r.total_views} luot xem</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${(r.rating / 5) * 100}%` }}
                      />
                    </div>
                    <div className="flex w-10 items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-500">{r.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.topRestaurants || []).length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">Chua co du lieu</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">Gian hang moi them</h3>
            <div className="space-y-4">
              {(data?.activities || []).map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-card-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


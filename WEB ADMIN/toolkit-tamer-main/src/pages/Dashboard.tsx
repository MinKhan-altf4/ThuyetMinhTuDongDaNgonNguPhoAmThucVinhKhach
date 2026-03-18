import { AdminLayout } from "@/components/AdminLayout";
import { initialDistricts, initialCategories, initialTours, initialRestaurants, initialTags } from "@/data/mock-data";
import { Store, Route, MapPin, UtensilsCrossed, TagIcon } from "lucide-react";

const stats = [
  { label: "Quận", value: initialDistricts.length, icon: MapPin },
  { label: "Loại ẩm thực", value: initialCategories.length, icon: UtensilsCrossed },
  { label: "Tours", value: initialTours.length, icon: Route },
  { label: "Quán ăn", value: initialRestaurants.length, icon: Store },
  { label: "Tags", value: initialTags.length, icon: TagIcon },
];

export default function Dashboard() {
  return (
    <AdminLayout title="Tổng quan" subtitle="Hệ thống quản lý Tour Ẩm Thực Sài Gòn">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <s.icon size={14} />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <h2 className="text-sm font-semibold mb-3">Quán ăn mới nhất</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Địa chỉ</th>
              <th>Rating</th>
              <th>Reviews</th>
            </tr>
          </thead>
          <tbody>
            {initialRestaurants.slice(0, 5).map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td className="text-muted-foreground">{r.address}</td>
                <td className="font-mono">⭐ {r.rating}</td>
                <td className="font-mono text-muted-foreground">{r.review_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

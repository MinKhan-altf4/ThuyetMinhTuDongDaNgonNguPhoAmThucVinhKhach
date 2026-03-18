import { MapPin, UtensilsCrossed, Route, Store, TagIcon, LayoutDashboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Tổng quan", url: "/", icon: LayoutDashboard },
  { title: "Quận / Khu vực", url: "/districts", icon: MapPin },
  { title: "Loại ẩm thực", url: "/categories", icon: UtensilsCrossed },
  { title: "Tours", url: "/tours", icon: Route },
  { title: "Quán ăn", url: "/restaurants", icon: Store },
  { title: "Tags", url: "/tags", icon: TagIcon },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-4">
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold tracking-tight">🍜 Vị Sài Gòn</h2>
              <p className="text-xs text-muted-foreground">Food Tour Admin</p>
            </div>
          )}
          {collapsed && <span className="text-lg">🍜</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-accent font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

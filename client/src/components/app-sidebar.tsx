import { LayoutDashboard, Store, Truck, Route, Target, Map, LogOut, Shield, Brain, Database, GitBranch, ClipboardList, PackageCheck, FileBarChart, Users, Settings, FileText, Package, Warehouse, Building2, ShoppingCart, UserCheck, CreditCard, LayoutGrid } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Map View",
    url: "/map",
    icon: Map,
  },
  {
    title: "Shops",
    url: "/shops",
    icon: Store,
  },
  {
    title: "Drivers",
    url: "/drivers",
    icon: Truck,
  },
  {
    title: "Salespersons",
    url: "/salespersons",
    icon: UserCheck,
  },
];

const operationsItems = [
  {
    title: "Process Map",
    url: "/process-map",
    icon: GitBranch,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ClipboardList,
  },
  {
    title: "Dispatch",
    url: "/dispatch",
    icon: PackageCheck,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileBarChart,
  },
];

const planningItems = [
  {
    title: "Routes",
    url: "/routes",
    icon: Route,
  },
  {
    title: "Targets",
    url: "/targets",
    icon: Target,
  },
  {
    title: "AI Analytics",
    url: "/analytics",
    icon: Brain,
  },
];

const inventoryItems = [
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Warehouse,
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Building2,
  },
  {
    title: "Procurement",
    url: "/procurement",
    icon: ShoppingCart,
  },
];

const adminItems = [
  { title: "Overview", url: "/admin", icon: LayoutGrid },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Backup", url: "/backup", icon: Database },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-sidebar-foreground">Veew Distributors</h2>
            <p className="text-xs text-muted-foreground">Route Optimization</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Inventory & Supply</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Planning & Targets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {planningItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={location === item.url}
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="mb-2">
          <Link href="/privacy-policy" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
            <FileText className="h-3 w-3" />
            Privacy Policy &amp; Data Protection
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={userName} />}
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium" data-testid="text-user-name">{userName}</p>
              {isAdmin && (
                <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-xs" data-testid="badge-admin">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">Huruma / Mathare</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

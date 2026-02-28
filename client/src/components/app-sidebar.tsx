import {
  LayoutDashboard, Store, Truck, Route, Target, Map, LogOut, Shield, Brain,
  Database, GitBranch, ClipboardList, PackageCheck, FileBarChart, Users,
  Settings, Package, Warehouse, Building2, ShoppingCart, UserCheck, CreditCard,
  LayoutGrid, Wallet, ChevronRight, type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const ROLE_BADGE: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  admin:       { label: "Admin",       icon: Shield,    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  manager:     { label: "Manager",     icon: Users,     className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  driver:      { label: "Driver",      icon: Truck,     className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  salesperson: { label: "Salesperson",  icon: UserCheck, className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  finance:     { label: "Finance",     icon: Wallet,    className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  warehouse:   { label: "Warehouse",   icon: Warehouse, className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300" },
};

const navGroups: NavGroup[] = [
  {
    label: "Main",
    defaultOpen: true,
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Map View", url: "/map", icon: Map },
      { title: "Shops", url: "/shops", icon: Store },
      { title: "Drivers", url: "/drivers", icon: Truck },
      { title: "Salespersons", url: "/salespersons", icon: UserCheck },
    ],
  },
  {
    label: "Operations",
    defaultOpen: true,
    items: [
      { title: "Process Map", url: "/process-map", icon: GitBranch },
      { title: "Orders", url: "/orders", icon: ClipboardList },
      { title: "Dispatch", url: "/dispatch", icon: PackageCheck },
      { title: "Payments", url: "/payments", icon: CreditCard },
      { title: "Reports", url: "/reports", icon: FileBarChart },
    ],
  },
  {
    label: "Inventory & Supply",
    defaultOpen: false,
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Inventory", url: "/inventory", icon: Warehouse },
      { title: "Suppliers", url: "/suppliers", icon: Building2 },
      { title: "Procurement", url: "/procurement", icon: ShoppingCart },
    ],
  },
  {
    label: "Planning & Targets",
    defaultOpen: false,
    items: [
      { title: "Routes", url: "/routes", icon: Route },
      { title: "Targets", url: "/targets", icon: Target },
      { title: "AI Analytics", url: "/analytics", icon: Brain },
    ],
  },
];

const adminGroup: NavGroup = {
  label: "Administration",
  defaultOpen: false,
  items: [
    { title: "Overview", url: "/admin", icon: LayoutGrid },
    { title: "User Management", url: "/admin/users", icon: Users },
    { title: "Settings", url: "/admin/settings", icon: Settings },
    { title: "Backup", url: "/backup", icon: Database },
  ],
};

const managerGroup: NavGroup = {
  label: "Management",
  defaultOpen: false,
  items: [
    { title: "User Management", url: "/admin/users", icon: Users },
  ],
};

function NavGroupSection({ group }: { group: NavGroup }) {
  const [location] = useLocation();
  const hasActive = group.items.some((item) => item.url === location);

  return (
    <Collapsible defaultOpen={group.defaultOpen || hasActive} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer select-none hover:text-sidebar-foreground transition-colors">
            {group.label}
            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link
                      href={item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { user, isAdmin, isManager, logout } = useAuth();

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";

  const roleBadge = user?.role ? ROLE_BADGE[user.role] : null;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-sidebar-foreground">Veew</h2>
            <p className="text-[11px] text-muted-foreground">Route Optimization</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {navGroups.map((group) => (
          <NavGroupSection key={group.label} group={group} />
        ))}
        {isAdmin && <NavGroupSection group={adminGroup} />}
        {!isAdmin && isManager && <NavGroupSection group={managerGroup} />}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {user?.profileImageUrl && (
              <AvatarImage src={user.profileImageUrl} alt={userName} />
            )}
            <AvatarFallback className="text-xs font-medium">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium" data-testid="text-user-name">
                {userName}
              </p>
              {roleBadge && (
                <Badge
                  className={`h-[18px] gap-1 px-1.5 text-[10px] ${roleBadge.className}`}
                  data-testid="badge-role"
                >
                  <roleBadge.icon className="h-2.5 w-2.5" />
                  {roleBadge.label}
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || "Huruma / Mathare"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
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

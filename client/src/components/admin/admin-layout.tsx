import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Users, Settings, Database, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface NavTab {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const ADMIN_NAV: NavTab[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
  { href: "/backup", label: "Backup", icon: Database, adminOnly: true },
];

function getBreadcrumbs(path: string): { label: string; href?: string }[] {
  const segments = path.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [{ label: "Administration", href: "/admin" }];
  if (path.startsWith("/admin")) {
    if (segments[1] === "users") crumbs.push({ label: "User Management" });
    else if (segments[1] === "settings") crumbs.push({ label: "Settings" });
    else if (segments.length <= 1) crumbs[0].href = undefined;
  } else if (path === "/backup") {
    crumbs.push({ label: "Data Backup" });
  }
  return crumbs;
}

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [location] = useLocation();
  const { isAdmin } = useAuth();
  const breadcrumbs = getBreadcrumbs(location);

  const visibleTabs = ADMIN_NAV.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, i) => (
            <BreadcrumbItem key={i}>
              {i > 0 && <BreadcrumbSeparator />}
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Sub-navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title && (
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          )}
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
        <nav
          role="tablist"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
        >
          <div className="flex flex-wrap gap-1">
            {visibleTabs.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/admin" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "hover:bg-background/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Content */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

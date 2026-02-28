import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { AdminRouteGuard, ManagerRouteGuard } from "@/components/admin-route-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { lazy, Suspense } from "react";
import { CookieConsentBanner } from "@/components/cookie-consent";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { usePageTitle } from "@/hooks/use-page-title";

// Eagerly loaded (always visible)
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";

// Lazy-loaded pages (code-split)
const MapPage = lazy(() => import("@/pages/map-page"));
const ShopsPage = lazy(() => import("@/pages/shop"));
const DriversPage = lazy(() => import("@/pages/drivers"));
const RoutesPage = lazy(() => import("@/pages/routes"));
const TargetsPage = lazy(() => import("@/pages/targets"));
const AnalyticsPage = lazy(() => import("@/pages/analytics"));
const BackupPage = lazy(() => import("@/pages/backup"));
const ProcessMapPage = lazy(() => import("@/pages/process-map"));
const OrdersPage = lazy(() => import("@/pages/orders"));
const DispatchPage = lazy(() => import("@/pages/dispatch"));
const ReportsPage = lazy(() => import("@/pages/reports"));
const AdminDashboardPage = lazy(() => import("@/pages/admin-dashboard"));
const AdminUsersPage = lazy(() => import("@/pages/admin-users"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const ProductsPage = lazy(() => import("@/pages/products"));
const InventoryPage = lazy(() => import("@/pages/inventory"));
const SuppliersPage = lazy(() => import("@/pages/suppliers"));
const ProcurementPage = lazy(() => import("@/pages/procurement"));
const SalespersonsPage = lazy(() => import("@/pages/salespersons"));
const PaymentsPage = lazy(() => import("@/pages/payments"));

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/map" component={MapPage} />
      <Route path="/shops" component={ShopsPage} />
      <Route path="/drivers" component={DriversPage} />
      <Route path="/routes" component={RoutesPage} />
      <Route path="/targets" component={TargetsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/admin" component={() => (
        <ManagerRouteGuard>
          <AdminDashboardPage />
        </ManagerRouteGuard>
      )} />
      <Route path="/backup" component={() => (
        <AdminRouteGuard>
          <BackupPage />
        </AdminRouteGuard>
      )} />
      <Route path="/process-map" component={ProcessMapPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/dispatch" component={DispatchPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/suppliers" component={SuppliersPage} />
      <Route path="/procurement" component={ProcurementPage} />
      <Route path="/salespersons" component={SalespersonsPage} />
      <Route path="/payments" component={PaymentsPage} />
      <Route path="/admin/users" component={() => (
        <ManagerRouteGuard>
          <AdminUsersPage />
        </ManagerRouteGuard>
      )} />
      <Route path="/admin/settings" component={() => (
        <AdminRouteGuard>
          <SettingsPage />
        </AdminRouteGuard>
      )} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4" role="banner">
            <SidebarTrigger data-testid="button-sidebar-toggle" aria-label="Toggle sidebar" />
            <Separator orientation="vertical" className="h-5" />
            <PageBreadcrumb />
            <div className="ml-auto flex items-center gap-2">
              <CommandPalette />
              <ThemeToggle />
            </div>
          </header>
          <main id="main-content" className="flex-1 overflow-auto" role="main">
            <Suspense fallback={<LoadingScreen />}>
              <AuthenticatedRouter />
            </Suspense>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function UnauthenticatedRouter() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route component={LoginPage} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  usePageTitle();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <UnauthenticatedRouter />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <CookieConsentBanner />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

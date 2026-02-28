import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AdminRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminRouteGuard({ children, fallback }: AdminRouteGuardProps) {
  const { user, isAdmin, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You need administrator privileges to access this page.
          </AlertDescription>
        </Alert>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Contact your system administrator if you believe this is an error.
          </p>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
            <Button variant="ghost" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface ManagerRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ManagerRouteGuard({ children, fallback }: ManagerRouteGuardProps) {
  const { isManager, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isManager) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need manager or administrator privileges to access this page.
          </AlertDescription>
        </Alert>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Contact your system administrator if you believe this is an error.
          </p>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
            <Button variant="ghost" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

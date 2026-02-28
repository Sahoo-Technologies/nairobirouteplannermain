/**
 * Admin Route Validator
 * 
 * Validates and checks for conflicts in admin routes
 */

interface RouteInfo {
  method: string;
  path: string;
  middleware: string[];
  handler: string;
  file: string;
  line: number;
}

interface RouteConflict {
  type: 'duplicate' | 'overlap' | 'middleware_conflict';
  routes: RouteInfo[];
  description: string;
}

export class AdminRouteValidator {
  private static routes: RouteInfo[] = [];
  private static conflicts: RouteConflict[] = [];

  static analyzeRoutes(): { routes: RouteInfo[]; conflicts: RouteConflict[]; summary: any } {
    this.routes = [];
    this.conflicts = [];

    // Define all admin routes from the codebase
    const adminRoutes: RouteInfo[] = [
      // Debug routes (development only)
      {
        method: 'GET',
        path: '/debug/admin',
        middleware: [],
        handler: 'adminDebugMiddleware',
        file: 'routes.ts',
        line: 58
      },
      {
        method: 'POST',
        path: '/debug/admin/fix',
        middleware: [],
        handler: 'adminFixMiddleware',
        file: 'routes.ts',
        line: 59
      },
      {
        method: 'POST',
        path: '/debug/admin/test',
        middleware: [],
        handler: 'adminTestMiddleware',
        file: 'routes.ts',
        line: 60
      },
      {
        method: 'POST',
        path: '/debug/admin/reset-password',
        middleware: [],
        handler: 'adminResetPasswordMiddleware',
        file: 'routes.ts',
        line: 61
      },

      // User management routes (isManager: both admin & manager)
      {
        method: 'GET',
        path: '/api/admin/users',
        middleware: ['isManager'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 764
      },
      {
        method: 'POST',
        path: '/api/admin/users',
        middleware: ['isManager'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 773
      },
      {
        method: 'PATCH',
        path: '/api/admin/users/:id',
        middleware: ['isManager'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 821
      },
      {
        method: 'DELETE',
        path: '/api/admin/users/:id',
        middleware: ['isManager'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 871
      },

      // Settings routes (isAdmin only)
      {
        method: 'GET',
        path: '/api/admin/settings',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 893
      },
      {
        method: 'PUT',
        path: '/api/admin/settings',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 908
      },
      {
        method: 'GET',
        path: '/api/admin/settings/audit',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 931
      },
      {
        method: 'GET',
        path: '/api/admin/settings/:name',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 942
      },
      {
        method: 'PUT',
        path: '/api/admin/settings/:name',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 960
      },

      // Backup routes
      {
        method: 'POST',
        path: '/api/backup',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 835
      },
      {
        method: 'GET',
        path: '/api/backup/history',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 874
      },

      // Delete routes with admin middleware
      {
        method: 'DELETE',
        path: '/api/shops/:id',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 177
      },
      {
        method: 'DELETE',
        path: '/api/drivers/:id',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 239
      },
      {
        method: 'DELETE',
        path: '/api/routes/:id',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 301
      },
      {
        method: 'DELETE',
        path: '/api/targets/:id',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 363
      },
      {
        method: 'DELETE',
        path: '/api/products/:id',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 409
      },
      {
        method: 'DELETE',
        path: '/api/suppliers/:id',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 472
      },
      {
        method: 'DELETE',
        path: '/api/salespersons/:id',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 528
      },
      {
        method: 'DELETE',
        path: '/api/orders/:id',
        middleware: ['isAdmin'],
        handler: 'anonymous',
        file: 'routes.ts',
        line: 566
      }
    ];

    this.routes = adminRoutes;
    this.detectConflicts();

    return {
      routes: this.routes,
      conflicts: this.conflicts,
      summary: this.generateSummary()
    };
  }

  private static detectConflicts(): void {
    // Check for exact duplicates
    const pathMethodMap = new Map<string, RouteInfo[]>();
    
    this.routes.forEach(route => {
      const key = `${route.method}:${route.path}`;
      if (!pathMethodMap.has(key)) {
        pathMethodMap.set(key, []);
      }
      pathMethodMap.get(key)!.push(route);
    });

    // Find duplicates
    pathMethodMap.forEach((routes, key) => {
      if (routes.length > 1) {
        this.conflicts.push({
          type: 'duplicate',
          routes,
          description: `Duplicate route definition: ${key}`
        });
      }
    });

    // Check for middleware conflicts
    const adminUsersRoutes = this.routes.filter(r => 
      r.path === '/api/admin/users' && r.method === 'POST'
    );

    if (adminUsersRoutes.length > 0) {
      const hasManager = adminUsersRoutes.some(r => r.middleware.includes('isManager'));
      const hasAdmin = adminUsersRoutes.some(r => r.middleware.includes('isAdmin'));
      
      if (hasManager && hasAdmin) {
        this.conflicts.push({
          type: 'middleware_conflict',
          routes: adminUsersRoutes,
          description: 'POST /api/admin/users has conflicting middleware (isManager vs isAdmin)'
        });
      }
    }

    // Check for path overlaps
    const pathGroups = new Map<string, RouteInfo[]>();
    this.routes.forEach(route => {
      const basePath = route.path.split('/')[0] + '/' + route.path.split('/')[1] + '/' + route.path.split('/')[2];
      if (!pathGroups.has(basePath)) {
        pathGroups.set(basePath, []);
      }
      pathGroups.get(basePath)!.push(route);
    });

    pathGroups.forEach((routes, basePath) => {
      if (routes.length > 3) { // More than 3 routes might indicate complexity
        this.conflicts.push({
          type: 'overlap',
          routes,
          description: `High route density for base path: ${basePath}`
        });
      }
    });
  }

  private static generateSummary(): any {
    const totalRoutes = this.routes.length;
    const totalConflicts = this.conflicts.length;
    
    const methodCounts = this.routes.reduce((acc, route) => {
      acc[route.method] = (acc[route.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const middlewareCounts = this.routes.reduce((acc, route) => {
      route.middleware.forEach(mw => {
        acc[mw] = (acc[mw] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const conflictTypes = this.conflicts.reduce((acc, conflict) => {
      acc[conflict.type] = (acc[conflict.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRoutes,
      totalConflicts,
      methodDistribution: methodCounts,
      middlewareDistribution: middlewareCounts,
      conflictTypes,
      hasCriticalIssues: totalConflicts > 0,
      recommendations: this.generateRecommendations()
    };
  }

  private static generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.conflicts.length === 0) {
      recommendations.push('✅ No route conflicts detected');
      recommendations.push('✅ All admin routes are properly configured');
    } else {
      recommendations.push('⚠️  Route conflicts detected - review and fix');
      
      this.conflicts.forEach(conflict => {
        switch (conflict.type) {
          case 'duplicate':
            recommendations.push(`- Remove duplicate route: ${conflict.routes[0].method} ${conflict.routes[0].path}`);
            break;
          case 'middleware_conflict':
            recommendations.push(`- Resolve middleware conflict for: ${conflict.routes[0].method} ${conflict.routes[0].path}`);
            break;
          case 'overlap':
            recommendations.push(`- Consider consolidating routes for: ${conflict.routes[0].path.split('/')[0]}/${conflict.routes[0].path.split('/')[1]}/${conflict.routes[0].path.split('/')[2]}`);
            break;
        }
      });
    }

    // General recommendations
    recommendations.push('📋 Ensure all admin routes have proper authentication middleware');
    recommendations.push('📋 Test admin routes in development before production deployment');
    recommendations.push('📋 Remove debug endpoints in production environment');

    return recommendations;
  }

  static validateRouteConsistency(): { 
    isValid: boolean; 
    issues: string[]; 
    fixes: string[][];
  } {
    const issues: string[] = [];
    const fixes: string[][] = [];

    // Check for proper admin middleware
    const adminRoutes = this.routes.filter(r => r.path.startsWith('/api/admin'));
    const routesWithoutAuth = adminRoutes.filter(r => r.middleware.length === 0);
    
    if (routesWithoutAuth.length > 0) {
      issues.push(`${routesWithoutAuth.length} admin routes without authentication middleware`);
      fixes.push(routesWithoutAuth.map(r => `Add authentication middleware to ${r.method} ${r.path}`));
    }

    // Check for debug routes in production
    const debugRoutes = this.routes.filter(r => r.path.startsWith('/debug'));
    if (debugRoutes.length > 0 && process.env.NODE_ENV === 'production') {
      issues.push('Debug routes are available in production environment');
      fixes.push(['Remove debug routes or add environment checks']);
    }

    // Check for consistent middleware usage
    const userManagementRoutes = this.routes.filter(r => r.path === '/api/admin/users');
    if (userManagementRoutes.length > 1) {
      const middlewareSets = userManagementRoutes.map(r => r.middleware.sort().join(','));
      const uniqueMiddlewareSets = Array.from(new Set(middlewareSets));
      
      if (uniqueMiddlewareSets.length > 1) {
        issues.push('Inconsistent middleware usage for user management routes');
        fixes.push(['Standardize middleware for /api/admin/users routes']);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      fixes
    };
  }
}

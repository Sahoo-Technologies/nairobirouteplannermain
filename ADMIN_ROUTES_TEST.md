# Admin Routes Testing Guide

This guide provides comprehensive testing procedures for all admin routes to ensure they work correctly and there are no conflicts.

## Quick Route Validation

### 1. Check Route Analysis
```bash
# Get comprehensive route analysis
curl http://localhost:5000/debug/routes

# Validate route consistency
curl http://localhost:5000/debug/routes/validate
```

### 2. Check Admin Status
```bash
# Check admin configuration
curl http://localhost:5000/debug/admin
```

## Admin Route Testing Matrix

### Authentication Required Routes

| Method | Path | Middleware | Expected Status | Test Command |
|--------|------|------------|-----------------|--------------|
| GET | `/api/admin/users` | `isAdmin` | 401 (unauthenticated) | `curl -i http://localhost:5000/api/admin/users` |
| GET | `/api/admin/settings` | `isAdmin` | 401 (unauthenticated) | `curl -i http://localhost:5000/api/admin/settings` |
| POST | `/api/admin/users` | `isManager` | 401 (unauthenticated) | `curl -i http://localhost:5000/api/admin/users` |
| PATCH | `/api/admin/users/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i http://localhost:5000/api/admin/users/123` |
| DELETE | `/api/admin/users/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i http://localhost:5000/api/admin/users/123` |

### Delete Routes with Admin Protection

| Method | Path | Middleware | Expected Status | Test Command |
|--------|------|------------|-----------------|--------------|
| DELETE | `/api/shops/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i -X DELETE http://localhost:5000/api/shops/123` |
| DELETE | `/api/drivers/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i -X DELETE http://localhost:5000/api/drivers/123` |
| DELETE | `/api/routes/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i -X DELETE http://localhost:5000/api/routes/123` |
| DELETE | `/api/targets/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i -X DELETE http://localhost:5000/api/targets/123` |
| DELETE | `/api/products/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i -X DELETE http://localhost:5000/api/products/123` |
| DELETE | `/api/suppliers/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i -X DELETE http://localhost:5000/api/suppliers/123` |
| DELETE | `/api/salespersons/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i -X DELETE http://localhost:5000/api/salespersons/123` |
| DELETE | `/api/orders/:id` | `isAdmin` | 401 (unauthenticated) | `curl -i -X DELETE http://localhost:5000/api/orders/123` |

## Authenticated Testing

### Step 1: Login as Admin
```bash
# First get admin credentials from environment
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@example.com"}
ADMIN_PASSWORD=${AI_ADMIN_PASSWORD:-"password"}

# Login and save session
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  -c admin-cookies.txt

# Verify login worked
curl -b admin-cookies.txt http://localhost:5000/api/auth/user
```

### Step 2: Test Admin Routes with Authentication
```bash
# Test user management
curl -b admin-cookies.txt http://localhost:5000/api/admin/users

# Test settings
curl -b admin-cookies.txt http://localhost:5000/api/admin/settings

# Test backup
curl -b admin-cookies.txt http://localhost:5000/api/backup/history
```

### Step 3: Test Route Conflicts
```bash
# Test POST /api/admin/users (should work for managers/admins)
curl -b admin-cookies.txt -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","firstName":"Test","lastName":"User","role":"user"}'

# Test PATCH /api/admin/users (should work for admins only)
curl -b admin-cookies.txt -X PATCH http://localhost:5000/api/admin/users/1 \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Updated"}'
```

## Route Conflict Detection

### Expected Route Analysis Results
```json
{
  "routes": [...],
  "conflicts": [],
  "summary": {
    "totalRoutes": 25,
    "totalConflicts": 0,
    "hasCriticalIssues": false,
    "recommendations": [
      "✅ No route conflicts detected",
      "✅ All admin routes are properly configured"
    ]
  }
}
```

### Expected Validation Results
```json
{
  "isValid": true,
  "issues": [],
  "fixes": []
}
```

## Common Issues and Solutions

### Issue 1: Route Not Found (404)
**Symptoms:**
- Admin routes return 404 instead of 401/403
- Routes not being registered

**Solutions:**
1. Check route registration order
2. Verify routes are registered before other middleware
3. Check for syntax errors in route definitions

### Issue 2: Authentication Not Working
**Symptoms:**
- Routes return 401 even after login
- Session not being maintained

**Solutions:**
1. Test login with debug endpoint:
   ```bash
   curl -X POST http://localhost:5000/debug/admin/test \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}'
   ```

2. Check session configuration
3. Verify cookie handling

### Issue 3: Middleware Conflicts
**Symptoms:**
- Multiple middleware handlers on same route
- Inconsistent authentication requirements

**Solutions:**
1. Use route validation endpoint:
   ```bash
   curl http://localhost:5000/debug/routes/validate
   ```

2. Review middleware order
3. Ensure consistent middleware usage

### Issue 4: Admin Role Issues
**Symptoms:**
- Admin user can't access admin routes
- Role verification failing

**Solutions:**
1. Check admin user configuration:
   ```bash
   curl http://localhost:5000/debug/admin
   ```

2. Fix admin user if needed:
   ```bash
   curl -X POST http://localhost:5000/debug/admin/fix
   ```

## Production Considerations

### Security Checklist
- [ ] Debug endpoints disabled in production
- [ ] All admin routes require authentication
- [ ] Proper role-based access control
- [ ] Rate limiting on admin endpoints
- [ ] Audit logging enabled

### Performance Checklist
- [ ] Database queries optimized
- [ ] Pagination implemented on large datasets
- [ ] Caching where appropriate
- [ ] Response times acceptable

## Automated Testing Script

```bash
#!/bin/bash
# admin_routes_test.sh

BASE_URL="http://localhost:5000"
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@example.com"}
ADMIN_PASSWORD=${AI_ADMIN_PASSWORD:-"password"}

echo "🔍 Testing Admin Routes..."

# 1. Check route analysis
echo "📊 Analyzing routes..."
ANALYSIS=$(curl -s "$BASE_URL/debug/routes")
CONFLICTS=$(echo "$ANALYSIS" | jq '.summary.totalConflicts')

if [ "$CONFLICTS" -eq 0 ]; then
    echo "✅ No route conflicts detected"
else
    echo "❌ Found $CONFLICTS route conflicts"
    echo "$ANALYSIS" | jq '.conflicts'
fi

# 2. Validate routes
echo "🔍 Validating route consistency..."
VALIDATION=$(curl -s "$BASE_URL/debug/routes/validate")
IS_VALID=$(echo "$VALIDATION" | jq '.isValid')

if [ "$IS_VALID" = true ]; then
    echo "✅ Route validation passed"
else
    echo "❌ Route validation failed"
    echo "$VALIDATION" | jq '.issues'
fi

# 3. Check admin configuration
echo "👤 Checking admin configuration..."
ADMIN_CONFIG=$(curl -s "$BASE_URL/debug/admin")
ISSUES=$(echo "$ADMIN_CONFIG" | jq '.issues | length')

if [ "$ISSUES" -eq 0 ]; then
    echo "✅ Admin configuration is valid"
else
    echo "❌ Found $ISSUES admin configuration issues"
    echo "$ADMIN_CONFIG" | jq '.issues'
fi

# 4. Test authentication
echo "🔐 Testing authentication..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | jq -e '.id' > /dev/null; then
    echo "✅ Admin login successful"
    
    # Test admin route access
    USERS_RESPONSE=$(curl -s -b cookies.txt "$BASE_URL/api/admin/users")
    if echo "$USERS_RESPONSE" | jq -e '.data' > /dev/null; then
        echo "✅ Admin routes accessible"
    else
        echo "❌ Admin routes not accessible"
    fi
else
    echo "❌ Admin login failed"
    echo "$LOGIN_RESPONSE"
fi

echo "🏁 Admin routes testing complete!"
```

## Troubleshooting Commands

### Check All Routes
```bash
# List all registered routes (if available)
curl http://localhost:5000/debug/routes | jq '.routes[] | {method, path, middleware}'
```

### Test Specific Route
```bash
# Test specific admin route
curl -i -b admin-cookies.txt http://localhost:5000/api/admin/users
```

### Check Session
```bash
# Check current session
curl -b admin-cookies.txt http://localhost:5000/api/auth/user
```

### Reset Admin User
```bash
# Reset admin user if needed
curl -X POST http://localhost:5000/debug/admin/fix
```

This comprehensive testing guide ensures all admin routes work correctly and helps identify any conflicts or issues before they affect production.

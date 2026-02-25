# Admin Access Troubleshooting Guide

This guide helps diagnose and fix admin access issues in the Veew Distributors system.

## Quick Diagnosis

### 1. Check Environment Variables
```bash
# Check if required variables are set
echo "ADMIN_EMAIL: $ADMIN_EMAIL"
echo "AI_ADMIN_PASSWORD: ${AI_ADMIN_PASSWORD:+SET}"
echo "SESSION_SECRET: ${SESSION_SECRET:+SET}"
```

### 2. Use Debug Endpoints (Development Only)
```bash
# Get comprehensive debug information
curl http://localhost:5000/debug/admin

# Auto-fix admin user
curl -X POST http://localhost:5000/debug/admin/fix

# Test admin login
curl -X POST http://localhost:5000/debug/admin/test \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin-email","password":"your-password"}'
```

## Common Issues and Solutions

### Issue 1: "Admin access required" Error

**Symptoms:**
- Login successful but admin endpoints return 403
- User exists but can't access admin features

**Causes:**
- User role is not set to 'admin'
- Database user role mismatch
- Environment variables not properly configured

**Solutions:**
1. **Check user role:**
   ```bash
   curl http://localhost:5000/debug/admin
   ```

2. **Fix admin user:**
   ```bash
   curl -X POST http://localhost:5000/debug/admin/fix
   ```

3. **Manual role update (if needed):**
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email';
   ```

### Issue 2: "Invalid email or password" Error

**Symptoms:**
- Cannot login with admin credentials
- Password verification fails

**Causes:**
- Password mismatch between environment and database
- User has no password set
- Password hash corruption

**Solutions:**
1. **Test login with debug endpoint:**
   ```bash
   curl -X POST http://localhost:5000/debug/admin/test \
     -H "Content-Type: application/json" \
     -d '{"email":"your-admin-email","password":"your-password"}'
   ```

2. **Reset admin password:**
   ```bash
   curl -X POST http://localhost:5000/debug/admin/reset-password \
     -H "Content-Type: application/json" \
     -d '{"newPassword":"new-secure-password"}'
   ```

3. **Update environment variables:**
   ```bash
   export AI_ADMIN_PASSWORD="new-secure-password"
   ```

### Issue 3: Admin User Not Found

**Symptoms:**
- No admin user exists in database
- ensureAdminUser fails to create user

**Causes:**
- Environment variables not set
- Database connection issues
- Email case sensitivity

**Solutions:**
1. **Verify environment variables:**
   ```bash
   echo $ADMIN_EMAIL
   echo $AI_ADMIN_PASSWORD
   ```

2. **Create admin user manually:**
   ```bash
   curl -X POST http://localhost:5000/debug/admin/fix
   ```

3. **Check database connection:**
   ```bash
   curl http://localhost:5000/health
   ```

### Issue 4: Session Issues

**Symptoms:**
- Login works but immediately logged out
- Session not persisting
- CSRF or session fixation errors

**Causes:**
- SESSION_SECRET not set or too short
- Cookie configuration issues
- Session store problems

**Solutions:**
1. **Check session secret:**
   ```bash
   echo "SESSION_SECRET length: ${#SESSION_SECRET}"
   # Should be at least 32 characters
   ```

2. **Generate new session secret:**
   ```bash
   export SESSION_SECRET="$(openssl rand -base64 32)"
   ```

3. **Clear browser cookies and session storage**

## Manual Admin User Creation

If automated methods fail, create admin user manually:

### 1. Via Database SQL
```sql
-- Delete existing user if needed
DELETE FROM users WHERE email = 'your-admin-email';

-- Create new admin user
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
) VALUES (
  'your-admin-email',
  '$2b$12$your-bcrypt-hash-here',
  'Machii',
  'Jirmo',
  'admin',
  NOW(),
  NOW()
);
```

### 2. Generate Password Hash
```javascript
// Node.js script to generate hash
const bcrypt = require('bcryptjs');
const password = 'your-password';
bcrypt.hash(password, 12).then(hash => console.log(hash));
```

### 3. Update Environment Variables
```bash
export ADMIN_EMAIL="your-admin-email"
export AI_ADMIN_PASSWORD="your-password"
export SESSION_SECRET="your-32-character-secret"
```

## Environment Variable Checklist

### Required for Admin Access:
- [ ] `ADMIN_EMAIL` - Admin user email address
- [ ] `AI_ADMIN_PASSWORD` - Admin user password (min 8 chars)
- [ ] `SESSION_SECRET` - Session encryption secret (min 32 chars)

### Optional but Recommended:
- [ ] `NODE_ENV` - Set to 'production' for production
- [ ] `DATABASE_URL` - Database connection string

## Testing Admin Access

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Debug Information
```bash
curl http://localhost:5000/debug/admin
```

### 3. Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin-email","password":"your-password"}'
```

### 4. Admin Endpoint Test
```bash
# First get session cookie from login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin-email","password":"your-password"}' \
  -c cookies.txt

# Then test admin endpoint
curl -X GET http://localhost:5000/api/admin/users \
  -b cookies.txt
```

## Production Considerations

### Security:
1. Never expose debug endpoints in production
2. Use strong, unique passwords
3. Rotate secrets regularly
4. Enable HTTPS in production

### Monitoring:
1. Monitor failed login attempts
2. Track admin access logs
3. Set up alerts for authentication failures

### Backup:
1. Backup admin user credentials
2. Document admin email and recovery process
3. Store secrets securely

## Common Debugging Commands

### Check All Environment Variables:
```bash
env | grep -E "(ADMIN|SESSION|NODE_ENV)"
```

### Test Database Connection:
```bash
curl http://localhost:5000/health | jq '.checks[] | select(.name=="database")'
```

### View Current Users:
```sql
SELECT email, role, created_at, updated_at FROM users WHERE role = 'admin';
```

### Check Sessions:
```sql
SELECT * FROM sessions WHERE expire > NOW() LIMIT 10;
```

## Getting Help

If issues persist:

1. **Check logs:** Look for authentication errors in server logs
2. **Verify database:** Ensure database is accessible and has correct schema
3. **Test components:** Use debug endpoints to isolate the issue
4. **Review configuration:** Double-check all environment variables
5. **Restart services:** Sometimes a clean restart resolves session issues

## Emergency Recovery

If admin access is completely lost:

1. **Direct database access:** Connect directly to database and reset admin user
2. **Environment override:** Temporarily set debug mode to recover access
3. **Backup restoration:** Restore from recent backup if available
4. **Contact support:** Reach out to system administrator

Remember to remove debug endpoints and reset any temporary overrides after recovery.

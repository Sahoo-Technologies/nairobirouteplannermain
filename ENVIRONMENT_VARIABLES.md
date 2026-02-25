# Environment Variables Documentation

This document describes all environment variables used by the Veew Distributors Route Optimization GIS system.

## Core Application

### `NODE_ENV`
- **Description**: Application environment (development, production, test)
- **Default**: `development`
- **Required**: No
- **Impact**: Affects error handling, security settings, and feature availability

### `PORT`
- **Description**: Server port number
- **Default**: `5000`
- **Required**: No
- **Impact**: Determines which port the application listens on

### `HOST`
- **Description**: Server host address
- **Default**: `0.0.0.0`
- **Required**: No
- **Impact**: Determines which network interface to bind to

## Database Configuration

### `DATABASE_URL`
- **Description**: PostgreSQL connection string
- **Example**: `postgresql://user:password@host:port/database`
- **Required**: Yes (in production)
- **Impact**: Critical - application cannot run in production without this
- **Security**: Contains sensitive credentials, must be kept secret

### `DB_MAX_CONNECTIONS`
- **Description**: Maximum number of database connections in pool
- **Default**: `10`
- **Required**: No
- **Impact**: Affects database performance and resource usage

### `DB_IDLE_TIMEOUT_MS`
- **Description**: Idle connection timeout in milliseconds
- **Default**: `30000` (30 seconds)
- **Required**: No
- **Impact**: Connection pool management

### `DB_CONNECTION_TIMEOUT_MS`
- **Description**: Database connection timeout in milliseconds
- **Default**: `10000` (10 seconds)
- **Required**: No
- **Impact**: How long to wait for database connections

### `DB_ALLOW_EXIT_ON_IDLE`
- **Description**: Allow Node.js to exit when pool is idle
- **Default**: `true`
- **Required**: No
- **Impact**: Important for serverless environments

## Security & Authentication

### `SESSION_SECRET`
- **Description**: Secret key for session encryption
- **Required**: Yes
- **Minimum Length**: 32 characters
- **Impact**: Critical for session security
- **Security**: Must be kept secret, use a strong random string

### `ADMIN_EMAIL`
- **Description**: Admin user email address
- **Required**: Yes
- **Example**: `admin@example.com`
- **Impact**: Determines who has admin access

### `AI_ADMIN_PASSWORD`
- **Description**: Admin user password
- **Required**: Yes
- **Minimum Length**: 8 characters
- **Impact**: Admin authentication
- **Security**: Must be kept secret

### `BCRYPT_ROUNDS`
- **Description**: Number of rounds for bcrypt password hashing
- **Default**: `10`
- **Required**: No
- **Impact**: Password security vs. performance trade-off

### `SESSION_MAX_AGE_MS`
- **Description**: Session maximum age in milliseconds
- **Default**: `604800000` (7 days)
- **Required**: No
- **Impact**: User session duration

## CORS Configuration

### `CORS_ORIGIN`
- **Description**: Comma-separated list of allowed CORS origins
- **Example**: `https://example.com,https://app.example.com`
- **Required**: No
- **Impact**: Cross-origin request security

## Rate Limiting

### `RATE_LIMIT_WINDOW_MS`
- **Description**: Rate limiting window in milliseconds
- **Default**: `900000` (15 minutes)
- **Required**: No
- **Impact**: API rate limiting behavior

### `RATE_LIMIT_MAX_REQUESTS`
- **Description**: Maximum requests per rate limit window
- **Default**: `100`
- **Required**: No
- **Impact**: API rate limiting behavior

## Email Configuration

### `SMTP_HOST`
- **Description**: SMTP server hostname
- **Example**: `smtp.gmail.com`
- **Required**: No (but needed for password reset)
- **Impact**: Email functionality

### `SMTP_PORT`
- **Description**: SMTP server port
- **Default**: `587`
- **Required**: No
- **Impact**: Email server connection

### `SMTP_SECURE`
- **Description**: Use SSL/TLS for SMTP
- **Default**: `false`
- **Required**: No
- **Impact**: Email security

### `SMTP_USER`
- **Description**: SMTP username
- **Required**: No
- **Impact**: Email authentication
- **Security**: Contains credentials

### `SMTP_PASS`
- **Description**: SMTP password or app password
- **Required**: No
- **Impact**: Email authentication
- **Security**: Contains sensitive credentials

### `SMTP_FROM`
- **Description**: Sender email address
- **Default**: Same as SMTP_USER
- **Required**: No
- **Impact**: Email sender address

## AI Integration

### `AI_INTEGRATIONS_OPENAI_API_KEY`
- **Description**: OpenAI API key
- **Example**: `sk-...`
- **Required**: No (but needed for AI features)
- **Impact**: AI functionality
- **Security**: Contains sensitive credentials

### `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Description**: OpenAI API base URL
- **Default**: `https://api.openai.com`
- **Required**: No
- **Impact**: AI API endpoint

### `AI_MODEL`
- **Description**: Default AI model to use
- **Default**: `gpt-5.2`
- **Required**: No
- **Impact**: AI functionality and cost

### `AI_TIMEOUT_MS`
- **Description**: AI API request timeout
- **Default**: `60000` (60 seconds)
- **Required**: No
- **Impact**: AI request handling

### `AI_MAX_RETRIES`
- **Description**: Maximum retries for AI API requests
- **Default**: `2`
- **Required**: No
- **Impact**: AI reliability

## AI Usage Monitoring

### `AI_USAGE_MONITORING`
- **Description**: Enable/disable AI usage monitoring
- **Default**: `true`
- **Required**: No
- **Impact**: AI cost control and monitoring

### `AI_DAILY_CALL_LIMIT`
- **Description**: Maximum AI API calls per day
- **Default**: `100`
- **Required**: No
- **Impact**: AI cost control

### `AI_MONTHLY_CALL_LIMIT`
- **Description**: Maximum AI API calls per month
- **Default**: `2000`
- **Required**: No
- **Impact**: AI cost control

### `AI_MONTHLY_COST_LIMIT`
- **Description**: Maximum AI cost per month in USD
- **Default**: `50.0`
- **Required**: No
- **Impact**: AI cost control

## Payment Processing (M-Pesa)

### `MPESA_CONSUMER_KEY`
- **Description**: M-Pesa consumer key
- **Required**: No (but needed for M-Pesa payments)
- **Impact**: M-Pesa payment functionality
- **Security**: Contains sensitive credentials

### `MPESA_CONSUMER_SECRET`
- **Description**: M-Pesa consumer secret
- **Required**: No (but needed for M-Pesa payments)
- **Impact**: M-Pesa payment functionality
- **Security**: Contains sensitive credentials

### `MPESA_SHORTCODE`
- **Description**: M-Pesa shortcode
- **Default**: `174379`
- **Required**: No
- **Impact**: M-Pesa payment functionality

### `MPESA_PASSKEY`
- **Description**: M-Pesa passkey
- **Required**: No (but needed for M-Pesa payments)
- **Impact**: M-Pesa payment functionality
- **Security**: Contains sensitive credentials

### `MPESA_CALLBACK_URL`
- **Description**: M-Pesa callback URL
- **Required**: No (but needed for M-Pesa payments)
- **Impact**: M-Pesa payment processing

### `MPESA_ENVIRONMENT`
- **Description**: M-Pesa environment (sandbox, production)
- **Default**: `sandbox`
- **Required**: No
- **Impact**: M-Pesa API endpoint

### `MPESA_TIMEOUT_MS`
- **Description**: M-Pesa API timeout
- **Default**: `30000` (30 seconds)
- **Required**: No
- **Impact**: M-Pesa request handling

### `MPESA_MAX_RETRIES`
- **Description**: Maximum retries for M-Pesa requests
- **Default**: `3`
- **Required**: No
- **Impact**: M-Pesa reliability

## Monitoring & Health Checks

### `HEALTH_CHECK_ENABLED`
- **Description**: Enable/disable health checks
- **Default**: `true`
- **Required**: No
- **Impact**: Health monitoring endpoints

### `HEALTH_CHECK_INTERVAL_MS`
- **Description**: Health check interval in milliseconds
- **Default**: `30000` (30 seconds)
- **Required**: No
- **Impact**: Health monitoring frequency

### `METRICS_ENABLED`
- **Description**: Enable/disable metrics collection
- **Default**: `true`
- **Required**: No
- **Impact**: Application monitoring

### `METRICS_RETENTION_DAYS`
- **Description**: Metrics retention period in days
- **Default**: `90`
- **Required**: No
- **Impact**: Storage usage for metrics

## Logging

### `LOG_LEVEL`
- **Description**: Logging level (debug, info, warn, error)
- **Default**: `info`
- **Required**: No
- **Impact**: Verbosity of logs

### `STRUCTURED_LOGGING`
- **Description**: Enable structured JSON logging
- **Default**: `false`
- **Required**: No
- **Impact**: Log format and parsing

## Request Handling

### `REQUEST_TIMEOUT_MS`
- **Description**: Request timeout in milliseconds
- **Default**: `30000` (30 seconds)
- **Required**: No
- **Impact**: Request handling behavior

### `BODY_LIMIT`
- **Description**: Maximum request body size
- **Default**: `1mb`
- **Required**: No
- **Impact**: Request size limits

## Cron Jobs

### `CRON_SECRET`
- **Description**: Secret for cron job authentication
- **Required**: No
- **Impact**: Cron job security
- **Security**: Must be kept secret

## Development & Debugging

### `REPL_ID`
- **Description**: Replit environment identifier
- **Required**: No
- **Impact**: Replit-specific features

## Security Considerations

1. **Never commit secrets to version control**
2. **Use different values for development and production**
3. **Rotate secrets regularly**
4. **Use strong, random values for secrets**
5. **Limit access to production secrets**
6. **Use environment-specific configuration files**

## Production Requirements

The following variables are **required** in production:
- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `AI_ADMIN_PASSWORD`

## Development Setup

For development, create a `.env` file with:
```bash
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-32-character-secret-here
ADMIN_EMAIL=admin@example.com
AI_ADMIN_PASSWORD=your-secure-password
DATABASE_URL=postgresql://localhost:5432/veew_dev
```

## Production Setup

For production, ensure all required variables are set and consider:
- Using a secrets management system
- Setting appropriate resource limits
- Enabling all security features
- Configuring proper monitoring
- Setting up backup systems

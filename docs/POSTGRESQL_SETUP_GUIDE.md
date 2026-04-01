# IDPlay CMS - Setup Database PostgreSQL

## Overview

Dokumen ini menjelaskan cara mengkonfigurasi IDPlay CMS untuk menggunakan PostgreSQL sebagai database utama menggantikan SQLite default. Panduan ini untuk setup fresh installation, bukan migration data dari SQLite.

## Mengapa PostgreSQL?

### Keuntungan PostgreSQL untuk Production
- **Better Performance**: Lebih cepat untuk concurrent users
- **Advanced Features**: JSON support, full-text search, custom types
- **Production Ready**: Lebih stabil untuk high-traffic applications
- **Scalability**: Support untuk database yang besar
- **ACID Compliance**: Transaksi yang lebih reliable

## Prerequisites

### 1. Install PostgreSQL

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

#### Windows
1. Download PostgreSQL installer dari [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install dengan default settings
3. Catat password untuk user `postgres`

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

### 2. Setup Database dan User

```bash
# Login sebagai postgres user
sudo -u postgres psql

# Buat database untuk Strapi
CREATE DATABASE idplay_cms;

# Buat user untuk aplikasi
CREATE USER strapi_user WITH PASSWORD 'secure_password_here';

# Berikan privileges
GRANT ALL PRIVILEGES ON DATABASE idplay_cms TO strapi_user;
GRANT ALL ON SCHEMA public TO strapi_user;

# Set default privileges untuk tables dan sequences yang akan dibuat
ALTER DEFAULT PRIVILEGES FOR USER strapi_user IN SCHEMA public GRANT ALL ON TABLES TO strapi_user;
ALTER DEFAULT PRIVILEGES FOR USER strapi_user IN SCHEMA public GRANT ALL ON SEQUENCES TO strapi_user;

# Exit PostgreSQL
\q
```

### 3. Install PostgreSQL Node.js Driver

```bash
# Install pg driver
npm install pg

# Install development types (optional untuk TypeScript)
npm install --save-dev @types/pg
```

## Konfigurasi Project

### Step 1: Update Environment Variables

Edit file `.env` atau buat baru:

```env
# Database Configuration - PostgreSQL
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=idplay_cms
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=secure_password_here
DATABASE_SSL=false

# Connection pooling
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Optional: gunakan connection string
# DATABASE_URL=postgresql://strapi_user:secure_password_here@localhost:5432/idplay_cms

# Keep existing variables lainnya
HOST=0.0.0.0
PORT=1337
APP_KEYS="your_app_keys_here"
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_token_salt
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### Step 2: Verify Database Configuration

File `config/database.ts` sudah mendukung PostgreSQL:

```typescript
import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    postgres: {
      connection: {
        connectionString: env('DATABASE_URL'), // jika pakai connection string
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    // ... konfigurasi database lainnya
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
```

### Step 3: Test Database Connection

```bash
# Test koneksi database
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'idplay_cms',
  user: 'strapi_user',
  password: 'secure_password_here'
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Connection failed:', err);
  else console.log('Connection successful:', res.rows[0]);
  pool.end();
});
"
```

### Step 4: Start Application

```bash
# Build aplikasi
npm run build

# Start aplikasi (Strapi akan membuat tables otomatis)
npm run develop
```

Strapi akan otomatis:
- Membuat semua tables yang diperlukan
- Membuat admin user pertama kali
- Setup semua content types sesuai schema

## Production Configuration

### Environment Variables untuk Production

```env
# Production PostgreSQL config
DATABASE_CLIENT=postgres
DATABASE_HOST=your-postgres-server.com
DATABASE_PORT=5432
DATABASE_NAME=idplay_cms_prod
DATABASE_USERNAME=strapi_prod_user
DATABASE_PASSWORD=very_secure_production_password
DATABASE_SSL=true

# SSL Configuration (production)
DATABASE_SSL_KEY=/path/to/client-key.pem
DATABASE_SSL_CERT=/path/to/client-cert.pem
DATABASE_SSL_CA=/path/to/ca-cert.pem
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# Connection pooling (production)
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_CONNECTION_TIMEOUT=60000
```

### Cloud PostgreSQL Services

#### AWS RDS PostgreSQL
```env
DATABASE_HOST=your-instance.region.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_SSL=true
```

#### Google Cloud SQL PostgreSQL
```env
DATABASE_HOST=your-instance-ip
DATABASE_PORT=5432
DATABASE_SSL=true
```

#### Azure Database for PostgreSQL
```env
DATABASE_HOST=your-server.postgres.database.azure.com
DATABASE_PORT=5432
DATABASE_USERNAME=strapi_user@your-server
DATABASE_SSL=true
```

## Troubleshooting

### Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostgreSQL is listening
sudo netstat -tlnp | grep 5432

# Test manual connection
psql -h localhost -U strapi_user -d idplay_cms
```

### Permission Issues
```sql
-- Grant permissions jika ada masalah
GRANT ALL PRIVILEGES ON DATABASE idplay_cms TO strapi_user;
GRANT ALL ON SCHEMA public TO strapi_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO strapi_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO strapi_user;
```

### SSL Issues
```bash
# Jika SSL error, temporary disable di .env
DATABASE_SSL=false

# Atau configure proper SSL certificates
```

## Optimizations

### Database Performance
```sql
-- Connect ke PostgreSQL
psql -h localhost -U strapi_user -d idplay_cms

-- Create performance indexes (jalankan setelah aplikasi berjalan)
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_press_releases_published_at ON press_releases(published_at);
CREATE INDEX IF NOT EXISTS idx_press_releases_slug ON press_releases(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Update statistics
ANALYZE;
```

### PostgreSQL Configuration
```sql
-- Recommended postgresql.conf settings
-- shared_buffers = 25% of RAM
-- effective_cache_size = 75% of RAM
-- work_mem = 4MB
-- maintenance_work_mem = 512MB
```

## Monitoring

### Database Monitoring
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('idplay_cms'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'idplay_cms';
```

## Backup Strategy

```bash
# Database backup
pg_dump -h localhost -U strapi_user idplay_cms > backup/idplay_cms_$(date +%Y%m%d).sql

# Backup with compression
pg_dump -h localhost -U strapi_user idplay_cms | gzip > backup/idplay_cms_$(date +%Y%m%d).sql.gz

# Restore backup
psql -h localhost -U strapi_user -d idplay_cms < backup/idplay_cms_20240101.sql
```

## Kesimpulan

Dengan konfigurasi ini, IDPlay CMS akan menggunakan PostgreSQL sebagai database utama dengan:

✅ **Performance yang lebih baik** untuk production  
✅ **Advanced features** seperti JSON support  
✅ **Better scalability** untuk aplikasi yang berkembang  
✅ **Production-ready** reliability dan ACID compliance  

Yang perlu diubah hanya:
1. Install PostgreSQL server
2. Setup database dan user
3. Install `pg` package
4. Update environment variables di `.env`
5. Start aplikasi (Strapi handle the rest!)

File konfigurasi database sudah siap mendukung PostgreSQL, tinggal set environment variables saja.
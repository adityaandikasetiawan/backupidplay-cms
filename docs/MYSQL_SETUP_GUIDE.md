# IDPlay CMS - Setup Database MySQL

## Overview

Dokumen ini menjelaskan cara mengkonfigurasi IDPlay CMS untuk menggunakan MySQL sebagai database utama menggantikan SQLite default. Panduan ini untuk setup fresh installation, bukan migration data dari SQLite.

## Mengapa MySQL?

### Keuntungan MySQL untuk Production
- **Performance**: Optimized untuk read-heavy workloads
- **Cloud Support**: Excellent support di AWS RDS, Google Cloud SQL, Azure
- **Ecosystem**: Tools dan hosting yang sangat matang
- **Community**: Large community dan extensive documentation
- **Reliability**: ACID compliance dengan InnoDB engine

## Prerequisites

### 1. Install MySQL

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server mysql-client

# Secure installation
sudo mysql_secure_installation

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Verify installation
mysql --version
```

#### Windows
1. Download MySQL Installer dari [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Install MySQL Server dengan default settings
3. Catat root password yang di-set

#### macOS
```bash
# Using Homebrew
brew install mysql
brew services start mysql
```

### 2. Setup Database dan User

```bash
# Login sebagai root
mysql -u root -p

# Buat database untuk Strapi dengan charset UTF8MB4
CREATE DATABASE idplay_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Buat user untuk aplikasi
CREATE USER 'strapi_user'@'localhost' IDENTIFIED BY 'secure_password_here';

# Berikan privileges
GRANT ALL PRIVILEGES ON idplay_cms.* TO 'strapi_user'@'localhost';

# Jika menggunakan remote connection
CREATE USER 'strapi_user'@'%' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON idplay_cms.* TO 'strapi_user'@'%';

# Flush privileges
FLUSH PRIVILEGES;

# Verify user creation
SELECT User, Host FROM mysql.user WHERE User = 'strapi_user';

# Exit MySQL
EXIT;
```

### 3. Install MySQL Node.js Driver

```bash
# Install mysql2 driver (recommended)
npm install mysql2

# Alternative: mysql driver
# npm install mysql
```

## Konfigurasi Project

### Step 1: Update Environment Variables

Edit file `.env` atau buat baru:

```env
# Database Configuration - MySQL
DATABASE_CLIENT=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=idplay_cms
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=secure_password_here
DATABASE_SSL=false

# Connection pooling
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# MySQL specific timeouts
DATABASE_CONNECTION_TIMEOUT=60000

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

File `config/database.ts` sudah mendukung MySQL:

```typescript
import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    mysql: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
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
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'strapi_user',
  password: 'secure_password_here',
  database: 'idplay_cms'
});
connection.connect((err) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connection successful to MySQL');
    connection.query('SELECT NOW() as now', (err, results) => {
      if (err) throw err;
      console.log('Current time:', results[0].now);
      connection.end();
    });
  }
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
# Production MySQL config
DATABASE_CLIENT=mysql
DATABASE_HOST=your-mysql-server.com
DATABASE_PORT=3306
DATABASE_NAME=idplay_cms_prod
DATABASE_USERNAME=strapi_prod_user
DATABASE_PASSWORD=very_secure_production_password

# SSL Configuration (production)
DATABASE_SSL=true
DATABASE_SSL_KEY=/path/to/client-key.pem
DATABASE_SSL_CERT=/path/to/client-cert.pem
DATABASE_SSL_CA=/path/to/ca-cert.pem
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# Connection pooling (production)
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_CONNECTION_TIMEOUT=60000
```

### Cloud MySQL Services

#### AWS RDS MySQL
```env
DATABASE_HOST=your-instance.region.rds.amazonaws.com
DATABASE_PORT=3306
DATABASE_SSL=true
```

#### Google Cloud SQL MySQL
```env
DATABASE_HOST=your-instance-ip
DATABASE_PORT=3306
DATABASE_SSL=true
```

#### Azure Database for MySQL
```env
DATABASE_HOST=your-server.mysql.database.azure.com
DATABASE_PORT=3306
DATABASE_USERNAME=strapi_user@your-server
DATABASE_SSL=true
```

## Troubleshooting

### Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Check if MySQL is listening
sudo netstat -tlnp | grep 3306

# Test manual connection
mysql -u strapi_user -p -h localhost idplay_cms
```

### Authentication Issues (MySQL 8.0+)
```sql
-- Jika ada masalah autentikasi di MySQL 8.0+
ALTER USER 'strapi_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'secure_password_here';
FLUSH PRIVILEGES;
```

### Character Set Issues
```sql
-- Pastikan database menggunakan UTF8MB4
SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'idplay_cms';

-- Jika perlu fix charset
ALTER DATABASE idplay_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Permission Issues
```sql
-- Grant ulang permissions jika diperlukan
GRANT ALL PRIVILEGES ON idplay_cms.* TO 'strapi_user'@'localhost';
FLUSH PRIVILEGES;
```

## Optimizations

### Database Performance
```sql
-- Connect ke MySQL
mysql -u strapi_user -p idplay_cms

-- Create performance indexes (jalankan setelah aplikasi berjalan)
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_featured ON articles(featured);

CREATE INDEX idx_press_releases_published_at ON press_releases(published_at);
CREATE INDEX idx_press_releases_slug ON press_releases(slug);
CREATE INDEX idx_press_releases_featured ON press_releases(featured);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_authors_name ON authors(name);

-- Update table statistics
ANALYZE TABLE articles, authors, categories, press_releases, regionals;
```

### MySQL Configuration (my.cnf)
```ini
# Recommended settings untuk production
[mysqld]
innodb_buffer_pool_size = 70% of RAM
innodb_log_file_size = 256M
innodb_log_buffer_size = 8M
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table = 1
max_connections = 200
query_cache_size = 64M
tmp_table_size = 64M
max_heap_table_size = 64M
key_buffer_size = 256M
```

## Monitoring

### Database Monitoring
```sql
-- Check database size
SELECT 
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS 'DB Size in MB' 
FROM information_schema.tables 
WHERE table_schema='idplay_cms';

-- Check table sizes
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size in MB'
FROM information_schema.TABLES 
WHERE table_schema = 'idplay_cms'
ORDER BY (data_length + index_length) DESC;

-- Check connections
SHOW PROCESSLIST;
```

### Slow Query Monitoring
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

## Backup Strategy

```bash
# Database backup
mysqldump -u strapi_user -p idplay_cms > backup/idplay_cms_$(date +%Y%m%d).sql

# Backup with compression
mysqldump -u strapi_user -p idplay_cms | gzip > backup/idplay_cms_$(date +%Y%m%d).sql.gz

# Restore backup
mysql -u strapi_user -p idplay_cms < backup/idplay_cms_20240101.sql
```

## High Availability (Optional)

### Master-Slave Replication
```sql
-- Master configuration (my.cnf)
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW

-- Create replication user
CREATE USER 'replication_user'@'%' IDENTIFIED BY 'replication_password';
GRANT REPLICATION SLAVE ON *.* TO 'replication_user'@'%';
```

## Kesimpulan

Dengan konfigurasi ini, IDPlay CMS akan menggunakan MySQL sebagai database utama dengan:

✅ **Performance yang excellent** untuk web applications  
✅ **Cloud support yang terbaik** (AWS RDS, Google Cloud SQL)  
✅ **Ecosystem yang mature** dengan tools yang lengkap  
✅ **Community support yang besar**  
✅ **Easy deployment dan management**  

Yang perlu diubah hanya:
1. Install MySQL server
2. Setup database dan user dengan charset UTF8MB4
3. Install `mysql2` package
4. Update environment variables di `.env`
5. Start aplikasi (Strapi handle the rest!)

File konfigurasi database sudah siap mendukung MySQL, tinggal set environment variables saja.

**Catatan Penting**: Pastikan menggunakan charset `utf8mb4` untuk support emoji dan karakter Unicode penuh.
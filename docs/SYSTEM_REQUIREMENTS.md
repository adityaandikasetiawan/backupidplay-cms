# IDPlay CMS - System Requirements untuk Self-Hosting

## Overview

Dokumen ini menjelaskan persyaratan sistem untuk melakukan self-hosting IDPlay CMS di server sendiri. IDPlay CMS dibangun dengan Strapi v5.23.4 dan memerlukan environment yang sesuai untuk berjalan optimal.

## Minimum System Requirements

### Hardware Requirements

#### CPU
- **Minimum**: 1 vCPU / 1 Core
- **Recommended**: 2 vCPU / 2 Cores atau lebih
- **Architecture**: x64 (Intel/AMD) atau ARM64

#### Memory (RAM)
- **Minimum**: 1 GB RAM
- **Recommended**: 2 GB RAM atau lebih
- **Production**: 4 GB RAM atau lebih untuk traffic tinggi

#### Storage
- **Minimum**: 2 GB free disk space
- **Recommended**: 10 GB free disk space
- **Production**: 20 GB+ (tergantung volume media uploads)
- **Type**: SSD recommended untuk performa optimal

#### Network
- **Bandwidth**: Minimum 100 Mbps
- **Ports**: 
  - Port 1337 (default Strapi)
  - Port 80/443 (jika menggunakan reverse proxy)
  - Port 5432 (PostgreSQL, jika database eksternal)
  - Port 3306 (MySQL, jika database eksternal)
  - Port 22 (SSH untuk remote management)

## Software Requirements

### Operating System

#### Linux (Recommended)
- **Ubuntu**: 20.04 LTS, 22.04 LTS, atau lebih baru
- **CentOS/RHEL**: 8.x atau 9.x
- **Debian**: 11 (Bullseye), 12 (Bookworm)
- **Amazon Linux**: 2023
- **Alpine Linux**: 3.18+

#### Windows
- **Windows Server**: 2019, 2022
- **Windows 10/11**: untuk development only

#### macOS
- **macOS**: 12.0 (Monterey) atau lebih baru
- **Supported**: untuk development only

### Runtime Environment

#### Node.js (Required)
- **Version**: 18.0.0 - 22.x.x
- **Recommended**: Node.js 20.x LTS
- **Package Manager**: npm 6.0.0+ (included with Node.js)

```bash
# Verifikasi versi Node.js
node --version  # harus 18.0.0 - 22.x.x
npm --version   # harus 6.0.0+
```

#### Process Manager (Production)
- **PM2** (Recommended)
- **Docker** + Docker Compose
- **Systemd** (Linux)
- **Forever** (alternative)

### Database Requirements

#### SQLite (Default - Development Only)
- **Version**: 3.35.0+
- **Storage**: File-based, included in project
- **Memory**: No additional requirements
- **Use case**: Development, prototyping
- **Package**: `better-sqlite3` (sudah included)

#### PostgreSQL (Recommended for Production)
- **Version**: 12.x, 13.x, 14.x, 15.x, 16.x
- **Memory**: Additional 512MB+ RAM untuk database server
- **Storage**: Separate database server recommended
- **Ports**: 5432 (default)
- **Node.js Package**: `pg` (perlu install: `npm install pg`)
- **Use case**: Production, complex queries, advanced features

#### MySQL (Alternative for Production)
- **Version**: 8.0.x atau MariaDB 10.6.x+
- **Memory**: Additional 512MB+ RAM untuk database server
- **Storage**: Separate database server recommended  
- **Ports**: 3306 (default)
- **Node.js Package**: `mysql2` (perlu install: `npm install mysql2`)
- **Use case**: Production, web applications, cloud hosting

### Web Server (Optional tapi Recommended)

#### Nginx (Recommended)
```nginx
# Minimum Nginx configuration
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Apache HTTP Server (Alternative)
```apache
# Minimum Apache configuration
<VirtualHost *:80>
    ServerName your-domain.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:1337/
    ProxyPassReverse / http://localhost:1337/
</VirtualHost>
```

## Development Environment Setup

### Local Development dengan SQLite (Default)
```bash
# 1. Install Node.js (via NodeSource repository - Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone project
git clone <repository-url>
cd idplay-cms

# 3. Install dependencies
npm install

# 4. Setup environment variables
cp .env.example .env
# Edit .env file sesuai kebutuhan (SQLite default)

# 5. Start development server
npm run develop
```

### Local Development dengan PostgreSQL
```bash
# 1. Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# 2. Setup database dan user
sudo -u postgres psql
CREATE DATABASE idplay_cms;
CREATE USER strapi_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE idplay_cms TO strapi_user;
\q

# 3. Install PostgreSQL driver
npm install pg

# 4. Update .env file
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=idplay_cms
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=secure_password

# 5. Start development server
npm run develop
```

### Local Development dengan MySQL
```bash
# 1. Install MySQL
sudo apt install mysql-server mysql-client

# 2. Setup database dan user
mysql -u root -p
CREATE DATABASE idplay_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'strapi_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON idplay_cms.* TO 'strapi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Install MySQL driver
npm install mysql2

# 4. Update .env file
DATABASE_CLIENT=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=idplay_cms
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=secure_password

# 5. Start development server
npm run develop
```

### Docker Development
```dockerfile
# Dockerfile example - SQLite
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 1337
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml example - dengan PostgreSQL
version: '3.8'
services:
  strapi:
    build: .
    ports:
      - "1337:1337"
    environment:
      - DATABASE_CLIENT=postgres
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=idplay_cms
      - DATABASE_USERNAME=strapi_user
      - DATABASE_PASSWORD=secure_password
    volumes:
      - ./uploads:/app/public/uploads
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=idplay_cms
      - POSTGRES_USER=strapi_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

```yaml
# docker-compose.yml example - dengan MySQL
version: '3.8'
services:
  strapi:
    build: .
    ports:
      - "1337:1337"
    environment:
      - DATABASE_CLIENT=mysql
      - DATABASE_HOST=mysql
      - DATABASE_PORT=3306
      - DATABASE_NAME=idplay_cms
      - DATABASE_USERNAME=strapi_user
      - DATABASE_PASSWORD=secure_password
    volumes:
      - ./uploads:/app/public/uploads
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=idplay_cms
      - MYSQL_USER=strapi_user
      - MYSQL_PASSWORD=secure_password
      - MYSQL_ROOT_PASSWORD=root_password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
```

## Production Environment Setup

### Linux Server (Ubuntu/Debian) dengan PostgreSQL
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# 4. Setup PostgreSQL database
sudo -u postgres psql
CREATE DATABASE idplay_cms_prod;
CREATE USER strapi_prod WITH PASSWORD 'very_secure_password';
GRANT ALL PRIVILEGES ON DATABASE idplay_cms_prod TO strapi_prod;
GRANT ALL ON SCHEMA public TO strapi_prod;
\q

# 5. Install PM2 globally
sudo npm install -g pm2

# 6. Create user for application
sudo useradd -m -s /bin/bash strapi
sudo usermod -aG sudo strapi

# 7. Deploy application
sudo -u strapi git clone <repository-url> /home/strapi/app
cd /home/strapi/app
sudo -u strapi npm install --production

# 8. Install PostgreSQL driver
sudo -u strapi npm install pg

# 9. Setup environment
sudo -u strapi cp .env.example .env
# Edit .env dengan config PostgreSQL production

# 10. Build application
sudo -u strapi npm run build

# 11. Start with PM2
sudo -u strapi pm2 start npm --name "idplay-cms" -- start
sudo -u strapi pm2 save
sudo -u strapi pm2 startup
```

### Linux Server (Ubuntu/Debian) dengan MySQL
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MySQL
sudo apt install mysql-server mysql-client
sudo mysql_secure_installation

# 4. Setup MySQL database
mysql -u root -p
CREATE DATABASE idplay_cms_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'strapi_prod'@'localhost' IDENTIFIED BY 'very_secure_password';
GRANT ALL PRIVILEGES ON idplay_cms_prod.* TO 'strapi_prod'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 5. Install PM2 globally
sudo npm install -g pm2

# 6. Create user for application
sudo useradd -m -s /bin/bash strapi
sudo usermod -aG sudo strapi

# 7. Deploy application
sudo -u strapi git clone <repository-url> /home/strapi/app
cd /home/strapi/app
sudo -u strapi npm install --production

# 8. Install MySQL driver
sudo -u strapi npm install mysql2

# 9. Setup environment
sudo -u strapi cp .env.example .env
# Edit .env dengan config MySQL production

# 10. Build application
sudo -u strapi npm run build

# 11. Start with PM2
sudo -u strapi pm2 start npm --name "idplay-cms" -- start
sudo -u strapi pm2 save
sudo -u strapi pm2 startup
```

### CentOS/RHEL Setup
```bash
# 1. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 2. Install PM2
sudo npm install -g pm2

# Continue with similar steps as Ubuntu
```

## Security Considerations

### Firewall Configuration
```bash
# UFW (Ubuntu) - Basic setup
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# UFW - Jika perlu direct access ke Strapi
sudo ufw allow 1337

# UFW - Jika database eksternal
sudo ufw allow 5432  # PostgreSQL
sudo ufw allow 3306  # MySQL

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=1337/tcp
sudo firewall-cmd --permanent --add-port=5432/tcp  # PostgreSQL
sudo firewall-cmd --permanent --add-port=3306/tcp  # MySQL
sudo firewall-cmd --reload
```

### SSL/TLS Certificate
```bash
# Menggunakan Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Environment Variables Security
```bash
# Set proper file permissions
chmod 600 .env
chown strapi:strapi .env

# Minimal .env untuk production dengan PostgreSQL
HOST=127.0.0.1
PORT=1337
APP_KEYS="secure-random-key-1,secure-random-key-2"
API_TOKEN_SALT=very-long-random-string
ADMIN_JWT_SECRET=very-long-random-string
TRANSFER_TOKEN_SALT=very-long-random-string
JWT_SECRET=very-long-random-string
ENCRYPTION_KEY=very-long-random-string-32chars

# Database config
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=idplay_cms_prod
DATABASE_USERNAME=strapi_prod
DATABASE_PASSWORD=very_secure_database_password

# Atau untuk MySQL
DATABASE_CLIENT=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=idplay_cms_prod
DATABASE_USERNAME=strapi_prod
DATABASE_PASSWORD=very_secure_database_password
```

## Monitoring & Maintenance

### System Monitoring
```bash
# Monitor with PM2
pm2 monit

# System resources
htop
df -h
free -h

# Logs
pm2 logs idplay-cms
tail -f /var/log/nginx/access.log
```

### Backup Strategy
```bash
# SQLite backup
cp /home/strapi/app/.tmp/data.db /backup/db-$(date +%Y%m%d).db

# PostgreSQL backup
pg_dump -h localhost -U strapi_prod idplay_cms_prod > /backup/db-$(date +%Y%m%d).sql
pg_dump -h localhost -U strapi_prod idplay_cms_prod | gzip > /backup/db-$(date +%Y%m%d).sql.gz

# MySQL backup
mysqldump -u strapi_prod -p idplay_cms_prod > /backup/db-$(date +%Y%m%d).sql
mysqldump -u strapi_prod -p idplay_cms_prod | gzip > /backup/db-$(date +%Y%m%d).sql.gz

# Media files backup
rsync -av /home/strapi/app/public/uploads/ /backup/uploads/

# Application backup
tar -czf /backup/app-$(date +%Y%m%d).tar.gz /home/strapi/app/
```

### Updates & Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js (if needed)
# Update application
cd /home/strapi/app
git pull origin main
npm install
npm run build
pm2 restart idplay-cms
```

## Troubleshooting Common Issues

### Port Already in Use
```bash
# Check what's using port 1337
sudo lsof -i :1337
sudo netstat -tulpn | grep 1337

# Kill process if needed
sudo kill -9 <PID>
```

### Permission Issues
```bash
# Fix file permissions
sudo chown -R strapi:strapi /home/strapi/app
sudo chmod -R 755 /home/strapi/app
sudo chmod 600 /home/strapi/app/.env
```

### Memory Issues
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Add swap if needed (2GB example)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Performance Optimization

### Application Level
- Enable production mode (`npm run build && npm start`)
- Use PM2 cluster mode untuk multi-core
- Configure database connection pooling
- Implement caching strategy (Redis)

### System Level
- Use SSD storage
- Configure proper swap space
- Optimize kernel parameters
- Use CDN untuk static assets

### Database Optimization
- **SQLite**: Regular vacuum, WAL mode
- **PostgreSQL**: Regular VACUUM ANALYZE, proper indexing, connection pooling
- **MySQL**: Regular OPTIMIZE TABLE, proper indexing, connection pooling
- Separate database server untuk production scale

## Support & Resources

### Official Documentation
- [Strapi Documentation](https://docs.strapi.io)
- [Node.js Documentation](https://nodejs.org/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)

### Community Resources
- [Strapi Discord](https://discord.strapi.io)
- [Strapi Forum](https://forum.strapi.io)
- [GitHub Issues](https://github.com/strapi/strapi/issues)

## Kesimpulan

Dengan mengikuti panduan system requirements ini, Anda dapat menjalankan IDPlay CMS dengan stabil di environment self-hosted. Pastikan untuk:

1. **Memenuhi minimum system requirements**
2. **Menggunakan Node.js versi yang didukung** (18.0.0 - 22.x.x)
3. **Pilih database yang sesuai:**
   - **SQLite**: Development dan small-scale production
   - **PostgreSQL**: Production dengan advanced features dan complex queries
   - **MySQL**: Production dengan excellent cloud support
4. **Mengimplementasikan security best practices**
5. **Melakukan monitoring dan backup rutin**
6. **Merencanakan scaling untuk traffic tinggi**

### Database Setup References
- **PostgreSQL Setup**: Lihat [PostgreSQL Setup Guide](./POSTGRESQL_SETUP_GUIDE.md)
- **MySQL Setup**: Lihat [MySQL Setup Guide](./MYSQL_SETUP_GUIDE.md)
- **Database Migration**: Lihat migration guides jika perlu migrate dari SQLite

Untuk environment production, **sangat disarankan** menggunakan:
- Database eksternal (PostgreSQL/MySQL)
- Reverse proxy (Nginx/Apache)
- SSL certificate
- Monitoring system
- Automated backup
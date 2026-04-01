# IDPlay CMS - Dokumentasi Project

## Ringkasan Project

**IDPlay CMS** adalah sistem manajemen konten (CMS) yang dibangun menggunakan **Strapi v5.23.4**. Project ini dirancang untuk mengelola konten digital seperti artikel, press release, dengan fitur multi-regional dan kategorisasi yang lengkap.

## Teknologi Stack

### Backend Framework
- **Strapi v5.23.4** - Headless CMS framework berbasis Node.js
- **TypeScript** - Bahasa pemrograman utama
- **Node.js** - Runtime environment (v18.0.0 - v22.x.x)

### Database
- **SQLite** (default) dengan better-sqlite3 v11.3.0
- Support untuk PostgreSQL dan MySQL (konfigurasi tersedia)

### Frontend/Admin
- **React v18** - Framework untuk admin panel
- **React DOM v18** - DOM manipulation
- **React Router DOM v6** - Routing
- **Styled Components v6** - CSS-in-JS styling

### Plugins & Extensions
- **@_sh/strapi-plugin-ckeditor v6.0.3** - Rich text editor dengan markdown support
- **@strapi/plugin-cloud** - Strapi Cloud integration
- **@strapi/plugin-users-permissions** - User authentication & authorization

## Arsitektur Project

### Struktur Folder
```
idplay-cms/
├── config/                 # Konfigurasi aplikasi
│   ├── admin.ts            # Konfigurasi admin panel
│   ├── api.ts              # Konfigurasi API
│   ├── database.ts         # Konfigurasi database
│   ├── middlewares.ts      # Middleware chain
│   ├── plugins.ts          # Plugin configuration
│   └── server.ts           # Server configuration
├── src/
│   ├── api/                # Content types & API endpoints
│   ├── admin/              # Admin panel customization
│   ├── components/         # Reusable components
│   └── index.ts            # Main application entry
├── types/generated/        # Auto-generated TypeScript types
├── public/                 # Static files & uploads
└── database/migrations/    # Database migrations
```

## Content Types (Model Data)

### 1. Article (api::article.article)
Model untuk mengelola artikel konten.

**Fields:**
- `title` (String, Required) - Judul artikel
- `slug` (UID, Required) - URL-friendly identifier
- `description` (Text, Required) - Deskripsi singkat
- `thumbnail` (Media, Required) - Gambar thumbnail
- `content` (CKEditor, Required) - Konten artikel dengan rich text
- `featured` (Boolean, Default: false) - Status artikel unggulan
- `author` (Relation) - Relasi ke Author
- `category` (Relation) - Relasi ke Category  
- `regionals` (Relation) - Relasi ke Regional (multiple)

### 2. Press Release (api::press-release.press-release)
Model untuk mengelola press release.

**Fields:**
- `title` (String, Required) - Judul press release
- `slug` (UID, Required) - URL-friendly identifier
- `description` (Text) - Deskripsi singkat
- `thumbnail` (Media) - Gambar thumbnail
- `content` (CKEditor, Required) - Konten press release
- `featured` (Boolean, Default: false) - Status featured
- `author` (Relation) - Relasi ke Author
- `category` (Relation) - Relasi ke Category

### 3. Author (api::author.author)
Model untuk mengelola data penulis.

**Fields:**
- `name` (String, Required) - Nama penulis
- `interest` (String, Required) - Area ketertarikan
- `avatar` (Media) - Foto profil
- `description` (String) - Deskripsi penulis

### 4. Category (api::category.category)
Model untuk kategorisasi konten.

**Fields:**
- `name` (String, Required) - Nama kategori
- `slug` (UID, Required) - URL-friendly identifier
- `description` (String) - Deskripsi kategori

### 5. Regional (api::regional.regional)
Model untuk mengelola konten berdasarkan wilayah.

**Fields:**
- `region` (String, Required, Unique) - Nama wilayah

### 6. Regional Banner (api::regional-banner.regional-banner)
Model untuk banner regional.

**Fields:**
- `image` (Media) - Gambar banner
- `altname` (String) - Alt text untuk SEO
- `regional` (Relation) - Relasi ke Regional

## Custom Controllers

### Article Controller
Menambahkan field `type: 'article'` pada setiap response API untuk membedakan dengan content type lain.

### Press Release Controller  
Menambahkan field `type: 'news'` pada setiap response API untuk membedakan dengan content type lain.

## Fitur Utama

### 1. Content Management
- **Multi-content types**: Artikel, Press Release, Author, Category
- **Rich text editing**: CKEditor dengan preset markdown
- **Media management**: Upload dan manajemen file/gambar
- **Draft & Publish**: Workflow publikasi konten

### 2. Regional Management
- **Multi-regional content**: Konten dapat dikategorikan berdasarkan wilayah
- **Regional banners**: Banner khusus untuk setiap wilayah

### 3. User Management
- **Admin authentication**: Sistem login admin yang aman
- **Role-based access**: Kontrol akses berdasarkan peran
- **User permissions**: Granular permission system

### 4. API Features
- **RESTful API**: Endpoint REST untuk semua content types
- **Pagination**: Default limit 25, max 100
- **Filtering & Sorting**: Query parameter support
- **Population**: Relational data loading

### 5. Internationalization
- **Multi-language support**: English dan Bahasa Indonesia
- **Localization ready**: i18n plugin terintegrasi

## Environment Variables

Aplikasi menggunakan environment variables untuk konfigurasi:

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS="key1,key2"
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_token_salt
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Database Configuration (opsional, default SQLite)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

## API Endpoints

### Public API Endpoints
- `GET /api/articles` - List artikel
- `GET /api/articles/:id` - Detail artikel
- `GET /api/press-releases` - List press release
- `GET /api/press-releases/:id` - Detail press release
- `GET /api/authors` - List penulis
- `GET /api/categories` - List kategori
- `GET /api/regionals` - List wilayah
- `GET /api/regional-banners` - List banner regional

### Admin API Endpoints
- `POST /api/articles` - Buat artikel baru
- `PUT /api/articles/:id` - Update artikel
- `DELETE /api/articles/:id` - Hapus artikel
- Dan seterusnya untuk content types lainnya

## Development Commands

```bash
# Development mode dengan auto-reload
npm run develop

# Production build
npm run build

# Start production server
npm run start

# Strapi console (debugging)
npm run console

# Deploy ke Strapi Cloud
npm run deploy

# Upgrade Strapi version
npm run upgrade
```

## File Storage

### Upload Directory
- Path: `public/uploads/`
- Support multiple formats: images, files, videos, audios
- Auto-generated responsive images (thumbnail, small, medium, large)

### Image Formats
Strapi secara otomatis menggenerate multiple ukuran gambar:
- `thumbnail_` - 156x156px
- `small_` - 500x500px  
- `medium_` - 750x750px
- `large_` - 1000x1000px

## Security Features

### Authentication
- JWT-based authentication untuk admin
- API token untuk external access
- Transfer token untuk data migration

### Authorization
- Role-based permissions
- Content-level permissions
- Field-level access control

### Security Middleware
- CORS configuration
- Body parsing security
- Query sanitization
- Rate limiting ready

## Monitoring & Logging

### Logs
- Request/response logging
- Error logging
- Performance monitoring ready

### Health Check
- Built-in health check endpoints
- Database connection monitoring

## Scalability Features

### Database
- Connection pooling (2-10 connections)
- Query optimization
- Migration system

### Performance
- Asset optimization
- Caching headers
- Compression ready

## Backup & Recovery

### Database Backup
- SQLite: Copy file `.tmp/data.db`
- Migration system untuk version control skema

### Media Backup
- Upload files di `public/uploads/`
- Versioning untuk media files

## Kesimpulan

IDPlay CMS adalah solusi headless CMS yang powerful dan fleksibel, dibangun dengan Strapi v5 untuk mengelola konten digital dengan fitur multi-regional. Project ini siap untuk production dengan konfigurasi database yang fleksibel dan arsitektur yang scalable.
**Clone & install**

`git clone <URL_REPO> my-strapi-project
cd my-strapi-project
npm install    *# atau yarn install*`

**Buat `.env`**

`cp .env.example .env`

- Lalu edit `.env`:
    - Isi bagian **server & secrets** (APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET, JWT_SECRET, ENCRYPTION_KEY, dll.). [[**Example .env**](https://docs.strapi.io/cms/configurations/environment#example-env-file)]
    - Isi bagian **database** (DATABASE_CLIENT, HOST, PORT, NAME, USERNAME, PASSWORD, SSL). [[**Database env examples**](https://docs.strapi.io/cms/configurations/database#environment-variables-in-database-configurations)]
    - atau copy yang sudah ada,
        
        ```json
        
        # Server
        HOST=0.0.0.0
        PORT=1337
        
        # Secrets
        APP_KEYS=hCKclt5H9cM4+FH4aSeekA==,/lP3qYGmeVFMSaVthMs/LA==,QhrWIRehwdIax/Zl0RlHlQ==,tFtFeOX4X0gAs8qra2MBbA==
        API_TOKEN_SALT=cVjkwu4rvzeDXHxTRTZoPA==
        ADMIN_JWT_SECRET=7bflC2MAU36+kml36TyimQ==
        TRANSFER_TOKEN_SALT=iR8SEDg5mQM0AZWHf6Uu7w==
        ENCRYPTION_KEY=xj8CUUgrsgU13VhbRR13xg==
        
        # Database
        DATABASE_CLIENT=mysql
        DATABASE_HOST=127.0.0.1
        DATABASE_PORT=3306
        DATABASE_NAME=nama_database
        DATABASE_USERNAME=app_user
        DATABASE_PASSWORD=IDPLAYCMS-_123!
        DATABASE_SSL=false
        DATABASE_FILENAME=
        JWT_SECRET=5QyNo9O4iHZzhtU5IeaCJg==
        
        ```
        
- **Opsional: tes Strapi untuk cek koneksi ke db**
    
    `npm run develop`
    
- **Import backup dari kamu**
Simpan file backup (`backup-strapi-data.tar`), lalu:
    
    `npm run strapi import -- -f backup-strapi-data.tar`
    
- **Jalankan Strapi & buat admin**
    
    `npm run develop`
    

Buka

```
/admin
```

, buat admin user baru (admin lama memang tidak ikut di‑export/import).
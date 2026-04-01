# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

## ⚙️ Langkah-Langkah Instalasi & Setup Awal

Berikut adalah langkah-langkah yang perlu dilakukan setelah Anda meng-clone repositori ini untuk pertama kali.

### 1. Clone Repositori
Clone proyek ini ke mesin lokal Anda.
```bash
git clone <URL_REPOSITORY_ANDA>
cd <NAMA_FOLDER_PROYEK>
```

### 2. Install Dependencies
Install semua dependensi yang dibutuhkan menggunakan `npm` atau `yarn`.
```bash
npm install
# atau
yarn install
```

### 3. Setup Environment Variables
Salin file `.env.example` menjadi file `.env`. File ini berisi semua variabel lingkungan yang dibutuhkan oleh aplikasi.
```bash
cp .env.example .env
```
Setelah itu, buka file `.env` dan **sesuaikan nilainya** dengan konfigurasi lokal Anda (seperti kredensial database, API keys, dll.).

### 4. Build Admin Panel
Build panel admin Strapi agar dapat diakses.
```bash
npm run build
# atau
yarn build
```

### 5. Jalankan Aplikasi
Jalankan aplikasi dalam mode development.
```bash
npm run develop
# atau
yarn develop
```
Perintah ini akan menjalankan server Strapi. Saat pertama kali dijalankan, Anda akan diarahkan untuk membuat akun admin pertama Anda.

---

## Perintah yang Tersedia

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```
### `upgrade`

Patch upgrade

```
npx @strapi/upgrade patch
# or newest version
npx @strapi/upgrade latest
```

## Contoh Cara Upgrade Strapi dari v5.23.3 ke v5.23.4

### 1. Backup Kode & Database
Sebelum melakukan upgrade, **backup** kode dan database Anda terlebih dahulu untuk menghindari kehilangan data jika terjadi masalah saat proses upgrade. Jika menggunakan SQLite, file database biasanya ada di `.tmp/data.db`. Jika menggunakan database lain, silakan cek dokumentasi resmi database terkait ([Step-by-step guide to upgrade to Strapi 5](https://docs.strapi.io/cms/migration/v4-to-v5/step-by-step)).

### 2. Jalankan Upgrade Tool
Buka terminal di folder proyek Strapi Anda, lalu jalankan perintah berikut untuk upgrade ke patch version terbaru (misal dari v5.23.3 ke v5.23.4):

```bash
npx @strapi/upgrade patch
```

### `major`

Use when you want to jump to the **next major version** (e.g. v4 → v5):

`npx @strapi/upgrade major`

- Upgrades to the **next major** version of Strapi.
- Only works if you’re already on the **latest minor+patch** of your current major. [[**Upgrade tool**](https://docs.strapi.io/cms/upgrade-tool); [**Upgrade to a new version**](https://docs.strapi.io/cms/upgrade-tool#upgrade-to-a-major-version)]
- Runs dependency updates + codemods for breaking changes. [[**Upgrade tool**](https://docs.strapi.io/cms/upgrade-tool)]

### `minor`

Use when you want to go to the **latest minor+patch** inside your current major:

`npx @strapi/upgrade minor`

- Example (from docs): if latest v4 is `4.25.9` and you’re on `4.14.1`, `minor` takes you to `4.25.9`. [[**Upgrade tool**](https://docs.strapi.io/cms/upgrade-tool)]
- Updates dependencies + runs codemods (if any). [[**Upgrade to a new version**](https://docs.strapi.io/cms/upgrade-tool#upgrade-to-a-minor-version)]

### `patch`

Use when you only want the **latest patch** for your current minor:

`npx @strapi/upgrade patch`

- Example (from docs): if latest v4.25 is `4.25.9` and you’re on `4.25.1`, `patch` takes you to `4.25.9`. [[**Upgrade tool**](https://docs.strapi.io/cms/upgrade-tool)]
- Smallest change, usually just fixes. [[**Upgrade to a new version**](https://docs.strapi.io/cms/upgrade-tool#upgrade-to-a-patch-version)]

### `latest`

Use when you simply want **“whatever is the newest Strapi version”**, regardless of where you are now:

`npx @strapi/upgrade latest`

- Jumps directly to the **latest available** version (could include a major bump). [[**Upgrade tool**](https://docs.strapi.io/cms/upgrade-tool); [**Upgrade to a new version**](https://docs.strapi.io/cms/upgrade-tool#upgrade-to-the-latest-version)]
- If a **major upgrade** is involved, the tool will ask for confirmation. [[**Upgrade to a new version**](https://docs.strapi.io/cms/upgrade-tool#upgrade-to-the-latest-version)]

---

**Rule of thumb from docs:**

- Stay within your current major and just get fixes → `patch`
- Stay within your current major but get all new features & fixes → `minor`
- Move to the next major (e.g. v4 → v5) → `major`
- Always jump to the overall newest Strapi version → `latest`

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---
# Panduan Deployment ke Vercel

## Setup Auto-Deploy via Vercel Dashboard (Rekomendasi)

### 1. Buka Vercel Dashboard

Buka: https://vercel.com/new

### 2. Import GitHub Repository

- Pilih **"Continue with GitHub"**
- Authorize Vercel ke akun GitHub `rankingsatubimbelku-lang`
- Pilih repository: `rankingsatubimbelku-lang/asrian-modol`
- Klik **"Import"**

### 3. Configure Project

```
Framework Preset  : Next.js (auto-detected)
Root Directory    : ./
Build Command     : prisma generate && next build
Install Command   : npm install
Output Directory  : .next
```

### 4. Set Environment Variables

Di bagian **"Environment Variables"**, tambahkan semua variabel berikut:

| Name | Value |
|------|-------|
| `DATABASE_URL` | postgresql://neondb_owner:npg_6yGRDxU9lgsM@ep-round-salad-ap934xja-pooler... |
| `DIRECT_URL` | postgresql://neondb_owner:npg_6yGRDxU9lgsM@ep-round-salad-ap934xja.c-7... |
| `NEXTAUTH_SECRET` | X5QGlmZDNH+clzZo+LcaNKkHhL4y5NTanYCgPV0yc+8= |
| `NEXTAUTH_URL` | https://your-app.vercel.app *(isi setelah dapat URL)* |
| `SUPER_ADMIN_EMAIL` | superadmin@gmail.com |
| `SUPER_ADMIN_PASSWORD` | *(set password kuat)* |
| `NEXT_PUBLIC_APP_NAME` | Sistem Arisan Keluarga |
| `NEXT_PUBLIC_APP_URL` | https://your-app.vercel.app |

> ⚠️ **Penting:**
> - Ganti `NEXTAUTH_URL` dan `NEXT_PUBLIC_APP_URL` dengan URL Vercel yang diberikan setelah deploy pertama
> - Gunakan `SUPER_ADMIN_PASSWORD` yang kuat untuk production
> - `DATABASE_URL` harus menggunakan pooled connection (ada `pgbouncer=true`)
> - `DIRECT_URL` tanpa pgbouncer, untuk prisma migrate

### 5. Deploy

Klik **"Deploy"** — Vercel akan:
1. Clone repo dari GitHub
2. Run `npm install` → `prisma generate && next build`
3. Deploy ke CDN global

### 6. Setelah Deploy Pertama

1. Copy URL deployment (e.g., `https://asrian-modol.vercel.app`)
2. Update environment variables `NEXTAUTH_URL` dan `NEXT_PUBLIC_APP_URL`
3. Re-deploy (Settings → Deployments → Redeploy)

### 7. Jalankan Prisma Migrate di Production

Di Vercel Dashboard → Project → Settings → Functions → tambahkan script di `package.json`:

```bash
# Jalankan sekali via terminal lokal menggunakan DIRECT_URL production
npx prisma migrate deploy
```

Atau tambahkan ke build command:
```
prisma migrate deploy && prisma generate && next build
```

## Auto-Deploy Setiap Push

Setelah setup selesai, **setiap kali push ke branch `master`**, Vercel akan otomatis:
1. Detect perubahan di GitHub
2. Trigger build baru
3. Deploy ke production URL yang sama

## Checklist Production

- [ ] Set semua env vars di Vercel Dashboard
- [ ] DATABASE_URL menggunakan pooled connection
- [ ] NEXTAUTH_SECRET dengan nilai random yang kuat
- [ ] NEXTAUTH_URL = URL production Vercel
- [ ] Jalankan `prisma migrate deploy` di production database
- [ ] Test login Super Admin
- [ ] Test CRUD anggota, arisan, tabungan, kredit

# WattPro Solar — Deployment Guide

## Stack
- **Frontend + Backend**: Next.js 16 (App Router) on Vercel (free)
- **Database**: Neon PostgreSQL (free 10 GB)
- **File Storage**: Cloudinary (free 25 GB) or local disk

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "WattPro Solar Expense Manager"
# Create repo on github.com then:
git remote add origin https://github.com/YOUR_NAME/wattpro-expenses.git
git push -u origin main
```

---

## Step 2 — Create Neon Database

1. Go to https://neon.tech → Sign up free
2. New Project → name: `wattpro` → Region: **Singapore**
3. Copy the connection string

---

## Step 3 — Create Cloudinary Account (for receipts)

1. Go to https://cloudinary.com → Sign up free
2. Dashboard → copy: Cloud Name, API Key, API Secret

---

## Step 4 — Deploy on Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. New Project → import `wattpro-expenses`
3. Add Environment Variables:
   - `DATABASE_URL` = your Neon connection string
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your api key
   - `CLOUDINARY_API_SECRET` = your api secret
4. Click **Deploy**

---

## Step 5 — Setup Database (run once after deploy)

On your local machine with the .env file configured:
```bash
npx drizzle-kit push
npx tsx src/db/seed.ts
```

---

## Step 6 — Login

- URL: your-project.vercel.app
- Email: info@wattprosolar.in
- Password: WattPro#2025 (change on first login)

---

## Custom Domain (optional)

In Vercel → your project → Settings → Domains → add `expenses.wattprosolar.in`
Then add CNAME record in your domain DNS pointing to `cname.vercel-dns.com`

# StockFlow MVP

A small multi-tenant SaaS inventory management app.

**Live app:** https://stockflow-mvp-blond.vercel.app
**API health check:** https://stockflow-api-5uaz.onrender.com/api/health

Note: the backend runs on a free host, so the first request after idle time can take up to a minute.

## Features
- Sign up / log in with email, password and organization name
- Products: create, list (search by name or SKU), edit, delete
- Dashboard: total products, total quantity, low-stock items
- Settings: default low-stock threshold
- All data is scoped to the user's organization

## Tech stack
React (Vite), Node.js + Express, PostgreSQL (Supabase), JWT + bcrypt, hosted on Vercel and Render

## Run locally
1. Run the SQL in `database/schema.sql` on a PostgreSQL database
2. `cd backend`, create `.env` with DATABASE_URL, JWT_SECRET and PORT, then `npm install` and `npm run dev`
3. `cd frontend`, create `.env` with VITE_API_URL=http://localhost:4000, then `npm install` and `npm run dev`
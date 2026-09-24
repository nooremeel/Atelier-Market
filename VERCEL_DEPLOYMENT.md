# Vercel Deployment Guide — Atelier Market (Full-Stack)

This repository is configured for a **unified full-stack deployment** on [Vercel](https://vercel.com):
- **Frontend**: Vite + React single-page app built and served globally via **Vercel Edge CDN** (instant TTFB, zero cold starts for UI, CSS, and images).
- **Backend**: Express JSON API hosted as a **Vercel Serverless Function** via [`api/index.js`](./api/index.js).
- **Single Origin**: Both frontend and backend share the exact same domain (no CORS configuration or third-party cookie issues for authentication).

---

## 1. Prerequisites & MongoDB Atlas Configuration

Before deploying, ensure your **MongoDB Atlas** database permits connections from Vercel's serverless environment:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Go to **Security** → **Network Access**.
3. Ensure **`0.0.0.0/0`** (Allow access from anywhere) is in your IP Access List.
   *(Serverless functions on Vercel spin up with dynamic IP addresses from AWS data centers, so a static IP whitelist will block connections).*

---

## 2. Required Environment Variables

Configure these environment variables in your Vercel Project Settings (**Settings → Environment Variables**):

| Variable | Description | Example / Source |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster0.etoo1jt.mongodb.net/shop?appName=shop` |
| `SESSION_SECRET` | Secret key used for signing session cookies | Any secure 32+ character random string |
| `SANDGRID_API_KEY` | *(Optional)* SendGrid API key for transactional emails | `SG.xxxxxxxx...` |

> [!NOTE]
> If your `MONGODB_URI` includes credentials directly, you don't need `MONGO_USER`, `MONGO_PASSWORD`, or `MONGO_DEFAULT_DATABASE` — the connection manager handles both single URI or individual component variables.

---

## 3. Deployment Methods

### Option A: Deploy via Vercel Web Dashboard (Recommended)

1. Push your repository to **GitHub / GitLab / Bitbucket**.
2. Go to [vercel.com/new](https://vercel.com/new) and click **Import** next to your repository.
3. Configure Project Settings:
   - **Framework Preset**: `Other` (or leave default detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` *(preconfigured via [`vercel.json`](./vercel.json))*
   - **Output Directory**: `public/app` *(preconfigured via [`vercel.json`](./vercel.json))*
4. Expand **Environment Variables** and add:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
   - *(Optional)* `SANDGRID_API_KEY`
5. Click **Deploy**.

Vercel will install dependencies, build the React SPA into `public/app`, bundle the backend into a serverless function, and provide you with a live `https://*.vercel.app` URL.

---

### Option B: Deploy via Vercel CLI

You can also deploy directly from your local terminal using the Vercel CLI:

```bash
# 1. Log in to Vercel
npx vercel login

# 2. Deploy to preview
npx vercel

# 3. Add production environment variables (or configure them in the dashboard)
npx vercel env add MONGODB_URI production
npx vercel env add SESSION_SECRET production
npx vercel env add NODE_ENV production

# 4. Deploy directly to production
npx vercel --prod
```

---

## 4. Key Architecture Details

- **[`vercel.json`](./vercel.json)**:
  - Maps `/api/(.*)` to [`api/index.js`](./api/index.js) (Express API).
  - Maps fallback images `/images/(.*)` to Express if not already cached statically.
  - Rewrites all other routes `/(.*)` to `/index.html` for client-side React Router navigation.
- **Connection Caching ([`util/db.js`](./util/db.js))**:
  - Automatically caches the Mongoose connection promise across serverless lambda invocations to avoid reconnection delays and cold start latency.
- **Session Persistence**:
  - Sessions are backed by `connect-mongodb-session` on MongoDB Atlas so users stay logged in across serverless container restarts.
  - `trust proxy` is enabled in Express for HTTPS detection behind Vercel's Edge proxy.
- **Asset Optimization**:
  - All luxury craft and category photos in `images/` are bundled into the frontend build so Vercel's global CDN serves them with zero serverless execution costs.

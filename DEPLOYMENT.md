# HIND TYRES & ACCESSORIES - Deployment Guide

### Live Production Deployment
- **Frontend (Vercel)**: [https://hind-tyre.vercel.app](https://hind-tyre.vercel.app)
- **Backend API (Render)**: [https://hind-tyres-backend.onrender.com](https://hind-tyres-backend.onrender.com)
- **API Health Check**: [https://hind-tyres-backend.onrender.com/api/health](https://hind-tyres-backend.onrender.com/api/health)

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │        Vercel (Frontend CDN)          │
                      │  https://your-app-name.vercel.app     │
                      └──────────────────┬────────────────────┘
                                         │  HTTPS API Requests
                                         │  (with JWT in Bearer header)
                                         ▼
                      ┌───────────────────────────────────────┐
                      │         Render (Backend API)          │
                      │  https://your-api-name.onrender.com   │
                      └──────────────────┬────────────────────┘
                                         │  ACID Transactions
                                         │  Mongoose Connection Pool
                                         ▼
                      ┌───────────────────────────────────────┐
                      │         MongoDB Atlas Cluster         │
                      │     (Free Shared Replica Set M0)      │
                      └───────────────────────────────────────┘
```

---

## PART 1: Backend Deployment on Render

### Step 1.1: Prepare MongoDB Atlas (If not already set up)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Under **Network Access**, ensure IP `0.0.0.0/0` (Allow access from anywhere) is added so Render can connect.
3. Under **Database Access**, create a user (e.g. `hind_admin` with read/write privileges).
4. Click **Connect -> Drivers -> Node.js** and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hind_tyres?retryWrites=true&w=majority
   ```

### Step 1.2: Deploy Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + -> Web Service**.
2. Connect your GitHub repository (`HIND-TYRE`).
3. Fill in the deployment settings:
   - **Name**: `hind-tyres-backend` (or your choice)
   - **Region**: Choose closest to you (e.g. Singapore or Oregon)
   - **Branch**: `new-ui` (or `main`)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. Click **Advanced -> Health Check Path**:
   - Set to: `/api/health`

5. In the **Environment Variables** section, add:

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Render default port |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.../hind_tyres?retryWrites=true&w=majority` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | `your_long_random_secret_key_at_least_32_chars` | Used to sign JWT auth tokens |
| `JWT_EXPIRES_IN` | `7d` | Token validity |
| `CLIENT_URL` | `https://*.vercel.app` (or update after Vercel deploy) | Allowed CORS origins |
| `ADMIN_RECEIPT_EMAIL` | `admin@hindtyres.com` | Email for receipt notifications |

*(Optional SMTP Email Configuration)*:
- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `587`
- `SMTP_SECURE`: `false`
- `SMTP_USER`: `your-email@gmail.com`
- `SMTP_PASS`: `your-gmail-16-character-app-password`

6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build to finish. Once live, Render will give you your backend URL, for example:
   ```
   https://hind-tyres-backend.onrender.com
   ```
8. Verify health in browser:
   Visit `https://hind-tyres-backend.onrender.com/api/health`
   You should see: `{"status":"ok","service":"HIND TYRES AND ACCESSORIES API", ...}`

### Step 1.3: Initialize Database (Seed Demo Data)
If your database is empty, seed it with default shop settings and staff accounts:
1. In the Render Dashboard for your service, click the **Shell** tab.
2. Run:
   ```bash
   npm run seed
   ```
3. Default login credentials created:
   - **Admin / Owner**: `admin@hindtyres.com` / `Admin@123`
   - **Counter / Cashier**: `counter@hindtyres.com` / `Counter@123`

---

## PART 2: Frontend Deployment on Vercel

### Step 2.1: Import Project on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... -> Project**.
2. Select your GitHub repository (`HIND-TYRE`).
3. In project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select **`client`** (or keep root `.` since `vercel.json` handles both!)
   - **Build Command**: `vite build` (or `npm run build`)
   - **Output Directory**: `dist`

4. Expand **Environment Variables** and add:

| Key | Value | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `https://hind-tyres-backend.onrender.com/api` | Your Render backend URL + `/api` |
| `VITE_GOOGLE_CLIENT_ID` | `523066431360-mfe1183b1ftu79t5etfhcojot59cck28.apps.googleusercontent.com` | (Optional) Google Sign-in |

5. Click **Deploy**.
6. Vercel will build and deploy the React app in ~30 seconds and provide your live URL (e.g. `https://hind-tyre.vercel.app`).

---

## PART 3: Final CORS Handshake

1. Copy your live Vercel URL (e.g. `https://hind-tyre.vercel.app`).
2. Go to your **Render Dashboard** -> `hind-tyres-backend` -> **Environment**.
3. Update `CLIENT_URL` to your Vercel URL:
   ```
   CLIENT_URL=https://hind-tyre.vercel.app
   ```
4. Click **Save Changes**. Render will automatically restart with the new CORS origin.

---

## PART 4: Multi-Environment Database Isolation & Selling to Clients

To ensure that your local testing and AI test suites **never tamper with or erase live client data**, the codebase implements **3-Tier Database Isolation**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      MongoDB Atlas Cluster                             │
 ├───────────────────┬──────────────────────────┬─────────────────────────┤
 │  hind_tyres_prod  │     hind_tyres_dev       │     hind_tyres_test     │
 │  (Production DB)  │    (Localhost Dev DB)    │    (Automated Tests)    │
 ├───────────────────┼──────────────────────────┼─────────────────────────┤
 │ • Live on Render  │ • Used on your laptop    │ • Used during npm test  │
 │ • Real Client Invoices│ • Mock tyres & bills │ • Created/cleared by    │
 │ • Real Stock Count│ • Safe for experiments   │   automated tests       │
 └───────────────────┴──────────────────────────┴─────────────────────────┘
```

### Safety Features Built-in:
1. **Automatic Test Isolation**: Running `npm test` automatically routes to `hind_tyres_test`, leaving both dev and prod untouched.
2. **Accidental Wipe Protection**: Running `npm run seed` is blocked if connected to any `_prod` database or if `NODE_ENV=production`.
3. **Clean Client Onboarding**: Dedicated initialization script `npm run init:client` sets up a brand new store with zero dummy sales and zero dummy tyres.

---

### Step 4.1: Switch Render to the Production Database (`hind_tyres_prod`)

1. Go to your [Render Dashboard](https://dashboard.render.com/) -> **hind-tyres-backend**.
2. Click **Environment** on the left menu.
3. Edit `MONGODB_URI` so it points to `hind_tyres_prod`:
   ```text
   mongodb+srv://<user>:<password>@cluster0.gfhiwgc.mongodb.net/hind_tyres_prod?retryWrites=true&w=majority
   ```
4. Click **Save Changes**. Render will automatically redeploy and connect to this fresh database.

---

### Step 4.2: How to Sell to a Client (Onboarding a Fresh Store)

When handing over the portal to a client (e.g. shop owner), you want a **clean system** (no dummy test sales, no fake invoices):

1. In your local terminal, initialize the client's store in the production database:
   ```bash
   MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.gfhiwgc.mongodb.net/hind_tyres_prod?retryWrites=true&w=majority" \
   npm run init:client -- \
     --shop="HIND TYRES AND ACCESSORIES" \
     --email="owner@clientdomain.com" \
     --password="SecurePassword@123" \
     --name="Client Owner Name" \
     --phone="+91 98765 43210" \
     --address="Client Shop Address"
   ```
2. The script will:
   - Create the client's shop settings (name, address, phone, warranty terms).
   - Create the client's primary Admin account with their email & password.
   - Register the 8 standard tyre brands (MRF, CEAT, Apollo, JK Tyre, Bridgestone, etc.).
   - Leave tyres, accessories, sales, and customers **100% clean (0 records)** so the client starts with a blank slate.
3. Give the client their login credentials:
   - URL: `https://hind-tyre.vercel.app/login`
   - Email: `owner@clientdomain.com`
   - Password: `SecurePassword@123`

---

### Step 4.3: How to Safely Build New Features in the Future

When a client requests a new feature or you want to make changes:

1. **Develop on Localhost**: Your laptop's `server/.env` uses `hind_tyres_dev`. Add test tyres, generate test sales, and check the UI on `http://localhost:5173`.
2. **Run Automated Tests**: Run `npm test` inside `server/`. It runs against `hind_tyres_test` and confirms all stock calculations and transactions pass.
3. **Deploy Code**: When ready, simply push your code:
   ```bash
   git push origin main
   ```
4. Vercel updates the frontend UI and Render updates the backend logic.
5. **Result**: The client's live database (`hind_tyres_prod`) gets the new code/features immediately, and **not a single dummy record or test invoice from your laptop ever touches their data!**

---

## Important Tips for Render Free Tier

> [!NOTE]
> Render free-tier web services automatically sleep after 15 minutes of inactivity. When a request comes in, it takes approximately 30-50 seconds to spin back up.
> The frontend is pre-configured with helpful status alerts explaining this to users so nobody gets confused.
> To keep the Render backend awake during store hours, you can use a free ping tool like [UptimeRobot](https://uptimerobot.com) to ping `https://your-backend.onrender.com/api/health` every 10 minutes.


# 🛞 HIND TYRES AND ACCESSORIES
### Tyre Shop Stock, Billing, Receipt & GST Management ERP

[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Cloud_8.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-Proprietary-darkred)](#-license)

Production-ready, full-stack ERP web application tailored for a multi-brand tyre and automotive accessories retail showroom. Engineered with custom dark glassmorphic aesthetics, strict integer paise financial math, zero-client-trust pricing, and multi-document ACID transactions on MongoDB (Atlas or local replica set `rs0`).

---

## 📑 Table of Contents
- [🚀 Key Features](#-key-features)
  - [1. Public Showroom & Showcase (`/`)](#1-public-showroom--showcase-)
  - [2. Counter / POS Billing Portal (`/counter/*`)](#2-counter--pos-billing-portal-counter)
  - [3. Administrator Suite (`/admin/*`)](#3-administrator-suite-admin)
- [🛠️ Tech Stack](#️-tech-stack)
- [📋 Non-Negotiable Engineering Rules](#-non-negotiable-engineering-rules)
- [📁 Project Structure](#-project-structure)
- [⚡ Quick Start & Local Setup](#-quick-start--local-setup)
  - [Prerequisites](#prerequisites)
  - [1. Install Dependencies](#1-install-dependencies)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Database Setup & Seeding](#3-database-setup--seeding)
  - [4. Start Development Servers](#4-start-development-servers)
- [🔑 Demo Login Credentials](#-demo-login-credentials)
- [🧪 Test Suite & Verification](#-test-suite--verification)
- [🌐 REST API Reference](#-rest-api-reference)
- [☁️ Vercel Deployment](#️-vercel-deployment)
- [🛡️ License](#️-license)

---

## 🚀 Key Features

### 1. Public Showroom & Showcase (`/`)
- **Interactive Tyre Finder**: Search and filter tyres by vehicle category (Bike, Scooter, Car, SUV, Truck, Tractor, Auto), brand, and tyre size.
- **Brand Marquee**: Displays authorized dealership partnerships across MRF, CEAT, Apollo, JK Tyre, Bridgestone, Michelin, TVS Eurogrip, and Goodyear.
- **Showroom Information**: Real-time business hours, shop address, contact hotlines, Google Maps integration, and tyre warranty information.

### 2. Counter / POS Billing Portal (`/counter/*`)
- **Step 1 – Customer Information & Auto-Fill**:
  - Live 10-digit mobile number lookup. Automatically identifies repeat customers and populates address, vehicle registration (`UP-78-BK-1001`), and vehicle model.
- **Step 2 – Live Tyre & Accessory Selection**:
  - Multi-brand catalog filtering by Company, Vehicle Type, Tube Type (Tubeless/Tube-type), and Tyre Size.
  - Real-time stock display with dynamic quantity guards (cannot add more than available warehouse stock).
- **Step 3 – Authoritative Server-Side Billing (Zero Client Trust)**:
  - Unit rate, subtotal, GST per item (28% tyres, 18% accessories), discount cap, and grand total are calculated strictly on the backend.
  - Payment modes: **CASH**, **UPI**, **CARD**, **CREDIT (Khata)**.
  - Atomic conditional stock deduction inside a MongoDB transaction (`{ _id: tyreId, quantity: { $gte: qty } }`). If any item stock is insufficient, aborts with `409 Conflict`.
- **Step 4 – Success Screen & In-Memory GST Tax Invoice**:
  - In-memory PDFKit GST Tax Invoice generation (`Buffer`) with customer details, itemized table, GST breakdown, QR code verification, terms & conditions, and amount in words.
  - One-click PDF download, printable invoice modal, and automated dual-email dispatch (Customer + Admin Bcc).

### 3. Administrator Suite (`/admin/*`)
- **Executive Analytics Dashboard**:
  - Today and monthly gross revenue, total invoices, and tyre units sold.
  - Live inventory valuation (Purchase Cost Valuation vs. Retail Valuation) and potential gross profit.
  - Recharts: 10-day revenue trend line chart and top-selling brand share pie chart.
  - Critical low-stock and out-of-stock reorder warnings.
- **Tyre Catalog & Stock Manager**:
  - Multi-company tyre CRUD with size, vehicle category, tube type, rates, and thresholds.
  - **Material Number & SKU Tracking**: Unique manufacturer material numbers (`MAT-XXXXXX`) alongside SKUs for dealer warranty tracking.
  - **Bulk Price Update**: Preview and apply percentage or flat price changes across an entire brand in a single bulk operation (e.g. `+5% for all MRF tyres`).
- **Stock In (Purchase Entry)**:
  - Record supplier shipments with purchase prices, quantities, and supplier names. Atomically increases inventory and writes a `StockMovement` ledger entry.
- **Manual Stock Adjustment**:
  - Correct stock counts with a mandatory audit reason.
- **Stock Movement Ledger**:
  - Complete immutable history of every inventory change (`STOCK_IN`, `SALE`, `SALE_CANCEL`, `ADJUSTMENT`) with before/after counts.
- **Sales & Invoices Ledger**:
  - Filter by date (Today, Yesterday, This week, This month, Custom), payment mode, and status.
  - Transactional Sale Cancellation: restores stock to inventory and records a `SALE_CANCEL` ledger entry.
- **Business Reports & Streaming CSV Export**:
  - 5 High-density reports with streaming CSV downloads:
    1. Sales Report
    2. Stock Valuation Report
    3. Low Stock Reorder Report
    4. Company-wise Sales Report
    5. Gross Profit Margin Report
- **Counter Staff Management**:
  - Add counter cashier accounts, enable or disable access.
- **Shop & GST Settings**:
  - Configure shop name, GSTIN, address, support phone/email, admin receipt email, and maximum discount percentage cap.
- **Audit Logs**:
  - Full trace of every create, update, delete, bulk update, and login event with state diffs and IP addresses.

---

## 🛠️ Tech Stack

| Layer | Technologies & Packages |
|---|---|
| **Frontend** | React 18, Vite 5, React Router DOM v6, Bootstrap 5.3, Custom Dark Glassmorphic Tokens (`tokens.css`, `global.css`), Lucide React, Recharts, React Hot Toast, Axios, `@react-oauth/google` |
| **Backend** | Node.js 20 LTS, Express 4.21, Mongoose 8, Zod, JWT (`jsonwebtoken`), `bcryptjs`, Google Auth Library, Helmet, CORS, `express-rate-limit`, `cookie-parser`, `morgan` |
| **Database** | MongoDB Atlas Cloud (3-node Replica Set) or Local MongoDB (`rs0`), PostgreSQL schema fallback (`supabase_schema.sql`) |
| **PDF & Email** | PDFKit (strictly in-memory `Buffer`, zero temp files on disk), QRCode, Nodemailer (Gmail SMTP) |
| **Deployment** | Vercel monorepo configuration: client static build (`client/dist`) + serverless API entry (`server/api/index.js`), cached Mongoose connection pool, `vercel.json` |

---

## 📋 Non-Negotiable Engineering Rules

1. **Money in Integer Paise Only**: All prices in the database and backend math are stored in integer paise (`1 INR = 100 paise`). Prevents floating-point rounding errors.
2. **Zero Client Trust**: The sale endpoint accepts only `{ customer, items: [{ itemId, itemType, quantity }], paymentMode, discountPaise }`. Unit rates, subtotals, GST, discount caps, and totals are computed strictly on the server.
3. **Atomic Stock Safety**: Stock deduction executes within a MongoDB transaction using:
   ```javascript
   updateOne({ _id: tyreId, quantity: { $gte: qty } }, { $inc: { quantity: -qty } }, { session })
   ```
   If `modifiedCount === 0`, the transaction aborts with `409 Conflict`. Stock cannot go negative.
4. **Single Stock Service**: `stock.service.js` is the sole authority for modifying stock quantities and records `StockMovement` ledger entries for every change.
5. **IST Timezone**: Timestamps are stored in UTC ISO format in MongoDB; displayed across the UI and invoices in IST (`Asia/Kolkata`) via `ist-date.js`.
6. **Custom ConfirmDialog**: Native `window.confirm()` is strictly prohibited; all destructive actions use a custom glassmorphic `ConfirmDialog`.
7. **Soft-Delete (Archive)**: Tyres and companies referenced by existing sales are soft-deleted (`isArchived = true`), preserving sales history and warranty compliance.
8. **Audit Logging**: Every state mutation is logged to `AuditLog` with before/after snapshots, user ID, IP address, and timestamp.

---

## 📁 Project Structure

```text
HIND TYRE/
├── package.json              # Monorepo scripts (dev, seed, test, e2e, build)
├── vercel.json               # Vercel serverless routing & static build config
├── scripts/
│   └── e2e.js                # Automated end-to-end flow test script
├── client/                   # Frontend React + Vite Application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx           # App routes & role-based guards
│       ├── main.jsx          # Root render & Google OAuth Provider
│       ├── components/
│       │   ├── common/       # ConfirmDialog, ReceiptModal, LoadingSkeleton
│       │   ├── layout/       # AdminLayout, CounterLayout, Navbar, Sidebar
│       │   └── routes/       # ProtectedRoute (Role Guard)
│       ├── context/          # AuthContext (JWT + Google Login + ShopSettings)
│       ├── lib/              # Axios instance, currency & IST date helpers
│       ├── pages/
│       │   ├── admin/        # Dashboard, Tyres, Accessories, Stock, Reports...
│       │   ├── auth/         # Login, ForgotPassword, Register
│       │   ├── counter/      # NewSale (POS), TodaySales, StockAvailability
│       │   └── public/       # Landing page showroom showcase
│       └── styles/
│           ├── tokens.css    # Official Color Palette & Design Tokens
│           └── global.css    # Glassmorphism, animations, cards, badges
└── server/                   # Backend Express + Node.js API
    ├── package.json
    ├── api/
    │   └── index.js          # Vercel serverless function entrypoint
    └── src/
        ├── app.js            # Express middlewares, CORS, Helmet, rate limiter
        ├── server.js         # Server runner & database connection pool
        ├── config/           # Database connection & env loader
        ├── controllers/      # Sale, Tyre, Stock, Auth, Reports, Customer...
        ├── middleware/       # JWT auth & RBAC (requireAdmin, requireCounter)
        ├── models/           # Tyre, Accessory, Sale, StockMovement, User...
        ├── routes/           # REST API routes (/api/*)
        ├── scripts/          # Database seeder (seed.js)
        ├── services/         # PricingService, StockService, InvoiceService
        ├── tests/            # Jest unit & concurrency test suite
        └── utils/            # In-memory PDFKit, Mailer, IST Date, Currency
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js** >= 20.0.0
- **MongoDB** (either MongoDB Atlas Cloud Cluster or local MongoDB with Replica Set enabled)

### 1. Install Dependencies
Install all root, backend, and frontend dependencies in one command:
```bash
npm run install:all
```

### 2. Environment Configuration

#### A. Backend Configuration (`server/.env`)
Create `server/.env` (or copy from `server/.env.example`):
```env
PORT=5001
NODE_ENV=development

# --- Database Options ---
# Option 1: MongoDB Atlas Cloud (Recommended)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.gfhiwgc.mongodb.net/hind_tyres?retryWrites=true&w=majority

# Option 2: Local MongoDB with Replica Set
# MONGODB_URI=mongodb://127.0.0.1:27017/hind_tyres?replicaSet=rs0

# JWT Auth
JWT_SECRET=super_secret_hind_tyres_jwt_key_998877665544332211
JWT_EXPIRES_IN=7d

# Google OAuth (Optional: for one-tap Google login)
GOOGLE_CLIENT_ID=523066431360-mfe1183b1ftu79t5etfhcojot59cck28.apps.googleusercontent.com

# Client URL
CLIENT_URL=http://localhost:5173

# Admin Receipt Email
ADMIN_RECEIPT_EMAIL=admin@hindtyres.com

# Nodemailer / Gmail SMTP (Optional: mock transporter fallback is active if empty)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="HIND TYRES & ACCESSORIES" <billing@hindtyres.com>
```

> [!NOTE]
> When using MongoDB Atlas, make sure your IP is whitelisted in MongoDB Atlas Console (**Network Access** ➜ **Add IP Address** ➜ `Allow Access from Anywhere` or `Add Current IP`).

#### B. Frontend Configuration (`client/.env`)
```env
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=523066431360-mfe1183b1ftu79t5etfhcojot59cck28.apps.googleusercontent.com
```

### 3. Database Setup & Seeding
Seeds 8 tyre brands, 42 realistic tyres with material numbers across Bike/Car/SUV/Truck, accessories, shop settings, and demo users:
```bash
npm run seed
```

### 4. Start Development Servers
Runs both Express backend (`:5001`) and Vite frontend (`:5173`) concurrently:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Login Credentials

The login screen features one-click quick-fill demo buttons:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Shop Owner (ADMIN)** | `admin@hindtyres.com` | `Admin@123` | Full access to Admin Portal, Reports, Master Catalog + Counter POS |
| **Cashier (COUNTER)** | `counter@hindtyres.com` | `Counter@123` | Counter POS Billing, Customer Lookup, Today's Sales |

---

## 🧪 Test Suite & Verification

### 1. Run Jest Tests
Validates integer paise financial math, discount policy limits, atomic stock concurrency, and transactional cancellations:
```bash
npm test
```

### 2. Run End-to-End (E2E) Flow Script
Executes the full automated cycle in a headless environment:
`Admin Login ➜ Stock-In (+5) ➜ Sale (-2) ➜ Stock Reduced ➜ In-Memory PDF Receipt Stream ➜ Cancel Sale ➜ Stock Restored (+2) ➜ Stock Movement Ledger Verified`
```bash
npm run e2e
```

### 3. Build Production Bundle
Validates TypeScript/JSX and compiles static assets to `client/dist`:
```bash
npm run build
```

---

## 🌐 REST API Reference

### Health Check
- `GET /api/health` – Server health, uptime, and database connectivity status

### Authentication (`/api/auth`)
- `POST /api/auth/login` – Login with email & password, returns JWT token
- `POST /api/auth/google` – Sign in or verify with Google OAuth token
- `GET /api/auth/me` – Get authenticated user profile & current shop settings
- `PUT /api/auth/profile` – Update user name, email, or password
- `POST /api/auth/forgot-password` – Send 6-digit OTP to user email
- `POST /api/auth/verify-otp` – Verify 6-digit OTP
- `POST /api/auth/reset-password` – Reset password using verified OTP

### Public Showroom (`/api/portal`)
- `GET /api/portal/tyres` – Public tyre search with brand, size, and vehicle filters
- `GET /api/portal/companies` – List active tyre partner brands
- `GET /api/portal/settings` – Public showroom address, phone, GSTIN, and business hours

### Counter Portal (`/api/counter`)
- `GET /api/counter/catalog` – Live tyre catalog with real-time stock levels
- `GET /api/counter/accessories` – Live accessories catalog
- `GET /api/counter/customers/lookup?phone=9876543210` – Fast customer phone auto-fill
- `POST /api/counter/sales` – Create new sale invoice within MongoDB ACID transaction
- `GET /api/counter/sales` – View counter staff's today sales ledger
- `GET /api/counter/sales/:id/receipt.pdf` – Stream in-memory PDF receipt buffer
- `POST /api/counter/sales/:id/resend-email` – Resend invoice PDF email to customer

### Shared Sales Endpoints
- `GET /api/sales/:id/receipt.pdf` – Public/authenticated receipt download & print
- `GET /api/sales/:id` – Detailed invoice breakdown
- `POST /api/sales/:id/cancel` – Transactional invoice cancellation & inventory restoration (Admin only)

### Admin Management Portal (`/api/admin`)
- `GET /api/admin/dashboard-stats` – Recharts daily revenue trends, valuation, and reorder alerts
- `GET /api/admin/companies` – List active/archived tyre brands
- `POST /api/admin/companies` – Add new tyre company
- `PUT /api/admin/companies/:id` – Edit company details
- `DELETE /api/admin/companies/:id` – Soft-delete (archive) company
- `GET /api/admin/tyres` – Tyres catalog with pagination, search, and stock filters
- `POST /api/admin/tyres` – Add new tyre with specifications and material number
- `PUT /api/admin/tyres/:id` – Edit tyre specifications & prices
- `DELETE /api/admin/tyres/:id` – Soft-delete (archive) tyre
- `POST /api/admin/tyres/bulk-price-update` – Bulk update prices across brands with preview & apply
- `GET /api/admin/accessories` – Accessories catalog
- `POST /api/admin/accessories` – Add new accessory
- `PUT /api/admin/accessories/:id` – Edit accessory
- `DELETE /api/admin/accessories/:id` – Archive accessory
- `POST /api/admin/stock-in` – Record purchase shipment & increment stock
- `POST /api/admin/stock-adjust` – Manual stock count correction with mandatory audit reason
- `GET /api/admin/stock-ledger` – Query immutable `StockMovement` history
- `GET /api/admin/sales` – Master sales ledger with date filters and payment mode breakdowns
- `GET /api/admin/customers` – Customer directory with lifetime spend
- `GET /api/admin/customers/:id` – Customer purchase history and invoices
- `GET /api/admin/reports/:type` – Analytical JSON data for 5 report types
- `GET /api/admin/reports/:type/export` – Streaming CSV export
- `GET /api/admin/users` – Staff accounts list
- `POST /api/admin/users` – Create new counter cashier user
- `PATCH /api/admin/users/:id/toggle-status` – Enable or disable staff portal access
- `GET /api/admin/settings` – Get shop settings & GST configuration
- `PUT /api/admin/settings` – Update shop settings & GST details
- `GET /api/admin/audit-logs` – Audit trail with before/after state diffs and IP addresses

---

## ☁️ Vercel Deployment

The repository is configured for zero-config Vercel monorepo deployment:
- `vercel.json` routes `/api/(.*)` to the serverless function `server/api/index.js` and all static assets to `client/dist`.
- `server/src/config/db.js` implements a cached Mongoose connection pool optimized for AWS Lambda and Vercel serverless lifecycles.
- Set environment variables in your Vercel Project Settings (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `ADMIN_RECEIPT_EMAIL`, etc.).

---

## 🛡️ License

Private proprietary software developed for **HIND TYRES AND ACCESSORIES**.  
All rights reserved.

# 🛞 HIND TYRES AND ACCESSORIES
### Tyre Shop Stock, Billing & GST Receipt Management System

Production-ready, full-stack ERP web application for a multi-company tyre and accessories retail showroom. Designed with custom dark glassmorphic aesthetics, strict integer paise financial math, zero-client-trust pricing, and MongoDB multi-document ACID transactions.

---

## 🚀 Key Features

### 1. Counter / POS Billing Portal (`/counter/*`)
- **Step 1 – Customer Information**:
  - Live 10-digit mobile number lookup. Automatically detects repeat customers and auto-fills their details.
  - Captures name, email (for automated PDF invoice dispatch), address, vehicle registration, and model.
- **Step 2 – Live Tyre & Accessory Selection**:
  - Multi-brand catalog search and filtering by Company (MRF, CEAT, Apollo, JK Tyre, Bridgestone, Michelin, TVS Eurogrip, Goodyear), Vehicle Type (Bike, Scooter, Car, SUV, Truck, Tractor, Auto), and tyre size.
  - Real-time stock display with dynamic quantity guards (cannot oversell out-of-stock tyres).
- **Step 3 – Authoritative Server-Side Billing**:
  - Zero client trust: Unit rate, subtotal, GST per item (28% tyres, 18% accessories), discount cap, and total are computed strictly on the backend from database documents.
  - Multiple payment modes: **CASH**, **UPI**, **CARD**, **CREDIT (Khata)**.
  - Atomic conditional stock deduction inside a MongoDB transaction (`{ _id: tyreId, quantity: { $gte: qty } }`). If any item stock is insufficient, aborts with `409 Conflict`.
- **Step 4 – Success Screen & GST Tax Invoice**:
  - In-memory PDFKit GST Tax Invoice generation (`Buffer`) with customer details, itemized table, GST breakdown, QR code verification, terms & conditions, and amount in words.
  - One-click PDF download, printable invoice modal, and automated dual-email dispatch (Customer + Admin Bcc).

### 2. Administrator Portal (`/admin/*`)
- **Executive Analytics Dashboard**:
  - Today and monthly gross revenue, total invoices, and tyre units sold.
  - Live inventory valuation (Purchase Cost Valuation vs. Retail Valuation) and potential gross profit.
  - Recharts: 7-day revenue trend line chart and top-selling brand share pie chart.
  - Critical low-stock and out-of-stock reorder warnings.
- **Tyre Catalog & Stock Manager**:
  - Multi-company tyre CRUD with size, vehicle category, tube type, rates, and thresholds.
  - **Bulk Price Update**: preview and apply percentage or flat price changes across an entire brand (e.g. `+5% for all MRF tyres`).
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

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, React Router DOM v6, Bootstrap 5.3, Custom Dark Glassmorphic Design Tokens (`tokens.css`, `global.css`), Lucide React, Recharts, React Hot Toast, Axios |
| **Backend** | Node.js 20 LTS, Express 4.21, MongoDB via Mongoose 8 (Replica Set transactions), Zod validation, JWT + bcryptjs, Helmet, CORS, express-rate-limit, cookie-parser, morgan |
| **PDF & Email** | PDFKit (strictly in-memory `Buffer`, zero temp files on disk), QRCode, Nodemailer (Gmail SMTP) |
| **Deployment** | Vercel monorepo configuration: client static build (`client/dist`) + serverless API entry (`server/api/index.js`), cached Mongoose connection, `vercel.json` |

---

## 📋 Non-Negotiable Engineering Rules Adherence

1. **Money in Integer Paise Only**: All prices in database and backend math are stored in integer paise (`1 INR = 100 paise`). No floating-point rounding errors.
2. **Zero Client Trust**: Sale endpoint accepts only `{ customer, items: [{ itemId, itemType, quantity }], paymentMode, discountPaise }`. Unit rates, subtotals, GST, discount caps, and totals are computed strictly on the server.
3. **Atomic Stock Safety**: Stock deduction executes within a MongoDB transaction using:
   ```javascript
   updateOne({ _id: tyreId, quantity: { $gte: qty } }, { $inc: { quantity: -qty } }, { session })
   ```
   If `modifiedCount === 0`, the transaction aborts with `409 Conflict`. Stock cannot go negative.
4. **Single Stock Service**: `stock.service.js` is the sole authority for modifying stock quantities and records `StockMovement` ledger entries for every change.
5. **IST Timezone**: Timestamps stored in UTC ISO format in MongoDB; displayed across the UI and invoices in IST (`Asia/Kolkata`) via `ist-date.js`.
6. **Custom ConfirmDialog**: Native `window.confirm()` is strictly prohibited; all destructive actions use a custom glassmorphic `ConfirmDialog`.
7. **Soft-Delete (Archive)**: Tyres and companies referenced by existing sales are soft-deleted (`isArchived = true`), preserving sales history and warranty compliance.
8. **Audit Logging**: Every state mutation is logged to `AuditLog` with before/after snapshots, user ID, IP address, and timestamp.

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- Node.js >= 20.0.0
- MongoDB running with Replica Set enabled (`rs0`) for ACID transactions.

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd "HIND TYRE"

# Install root, server, and client packages
npm run install:all
```

### 2. Environment Configuration
Copy `.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```

Configuration details:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/hind_tyres?replicaSet=rs0
JWT_SECRET=super_secret_hind_tyres_jwt_key_998877665544332211
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Nodemailer / Gmail SMTP (Optional: mock transporter fallback is active if empty)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="HIND TYRES & ACCESSORIES" <billing@hindtyres.com>
ADMIN_RECEIPT_EMAIL=admin@hindtyres.com
```

### 3. Seed Database
Seeds 8 tyre brands, 42 realistic tyres across Bike/Car/SUV/Truck, accessories, demo users, and shop settings:
```bash
npm run seed
```

### 4. Run Development Servers
```bash
# Starts Express backend (:5001) and Vite frontend (:5173) concurrently
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Login Credentials

The login screen features one-click quick-fill demo buttons:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Shop Owner (ADMIN)** | `admin@hindtyres.com` | `Admin@123` | Full access to Admin Portal + Counter POS |
| **Cashier (COUNTER)** | `counter@hindtyres.com` | `Counter@123` | Counter POS Billing, Today's Sales, Stock Lookup |

---

## 🧪 Test Suite & Verification

### 1. Run Jest Tests
Tests pricing calculations in integer paise, discount policy limits, stock concurrency (two concurrent sales for the last tyre -> exactly one succeeds, one fails with 409), and transactional sale cancellation:
```bash
npm test
```

### 2. Run End-to-End (E2E) Flow Script
Executes the full automated cycle:
`Login -> Stock-In -> Sale -> Stock Reduced -> PDF Generated -> Cancel -> Stock Restored -> Ledger Verified`
```bash
npm run e2e
```

### 3. Build Production Bundle
```bash
npm run build
```

---

## 🌐 Complete REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/login` – Login with email & password, returns JWT token
- `GET /api/auth/me` – Get authenticated user profile & shop settings
- `POST /api/auth/forgot-password` – Send 6-digit OTP (10-min TTL, 60s cooldown)
- `POST /api/auth/verify-otp` – Verify 6-digit OTP
- `POST /api/auth/reset-password` – Reset password using verified OTP

### Counter Portal (`/api/counter`)
- `GET /api/counter/catalog` – Live tyre search & filterable catalog
- `GET /api/counter/accessories` – Live accessories catalog
- `GET /api/counter/customers/lookup?phone=9876543210` – Fast customer phone auto-fill
- `POST /api/counter/sales` – Create new sale invoice within MongoDB transaction
- `GET /api/counter/sales` – View counter staff's today invoices
- `GET /api/counter/sales/:id/receipt.pdf` – Stream in-memory PDF receipt
- `POST /api/counter/sales/:id/resend-email` – Resend invoice PDF email

### Admin Portal (`/api/admin`)
- `GET /api/admin/dashboard-stats` – Recharts stats, stock valuation, and alerts
- `GET /api/admin/companies` – List active/archived tyre brands
- `POST /api/admin/companies` – Add new tyre company
- `PUT /api/admin/companies/:id` – Edit company
- `DELETE /api/admin/companies/:id` – Soft-delete (archive) company
- `GET /api/admin/tyres` – Tyres catalog with pagination & filters
- `POST /api/admin/tyres` – Add new tyre
- `PUT /api/admin/tyres/:id` – Edit tyre specifications & prices
- `DELETE /api/admin/tyres/:id` – Soft-delete (archive) tyre
- `POST /api/admin/tyres/bulk-price-update` – Bulk update prices with preview & apply
- `GET /api/admin/accessories` – Accessories catalog
- `POST /api/admin/accessories` – Add accessory
- `PUT /api/admin/accessories/:id` – Edit accessory
- `DELETE /api/admin/accessories/:id` – Archive accessory
- `POST /api/admin/stock-in` – Record purchase shipment & increment stock
- `POST /api/admin/stock-adjust` – Manual stock count correction with reason
- `GET /api/admin/stock-ledger` – Query `StockMovement` history
- `GET /api/admin/sales` – Comprehensive sales & invoices ledger
- `POST /api/sales/:id/cancel` – Transactional invoice cancellation & stock restore
- `GET /api/admin/customers` – Customer list with lifetime spend
- `GET /api/admin/customers/:id` – Customer purchase history
- `GET /api/admin/reports/:type` – JSON data for 5 report types
- `GET /api/admin/reports/:type/export` – Streaming CSV export
- `GET /api/admin/users` – Staff accounts list
- `POST /api/admin/users` – Create new counter cashier user
- `PATCH /api/admin/users/:id/toggle-status` – Toggle staff active access
- `GET /api/admin/settings` – Get shop settings
- `PUT /api/admin/settings` – Update shop settings & GST details
- `GET /api/admin/audit-logs` – Audit trail with before/after state diffs

---

## ☁️ Vercel Deployment

The repository is configured for zero-config Vercel monorepo deployment:
- `vercel.json` routes `/api/(.*)` to the serverless function `server/api/index.js` and all static assets to `client/dist`.
- `server/src/config/db.js` implements a cached Mongoose connection pool optimized for AWS Lambda and Vercel serverless lifecycles.
- Set the environment variables in your Vercel Project Settings (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `ADMIN_RECEIPT_EMAIL`, etc.).

---

## 🛡️ License
Private proprietary software developed for **HIND TYRES AND ACCESSORIES**.
All rights reserved.

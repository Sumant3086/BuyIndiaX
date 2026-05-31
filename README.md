<div align="center">

<h1>BuyIndiaX</h1>
<p><strong>Unified Omnichannel Retail Platform for Indian Businesses</strong></p>

<p>
  <img src="https://img.shields.io/badge/Version-2.1.0-2563eb?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Live%20%26%20Deployed-16a34a?style=flat-square" />
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20POS%20%7C%20Admin-7c3aed?style=flat-square" />
  <img src="https://img.shields.io/badge/Market-Indian%20Retail-f97316?style=flat-square" />
  <img src="https://img.shields.io/badge/GST-Compliant-dc2626?style=flat-square" />
</p>

<p>
  <a href="https://buyindiax.onrender.com" target="_blank"><strong>→ Live Demo</strong></a>
</p>

</div>

---

## The Problem

Indian retail is fragmented. A typical store owner today manages their physical store through one system, their online orders through another, their inventory through a spreadsheet, and their billing through yet another piece of software. These disconnected tools create blind spots — overselling, stock-outs, missed revenue, and poor customer experience.

**BuyIndiaX solves this by bringing everything under one platform.**

---

## What BuyIndiaX Does

BuyIndiaX is an **omnichannel retail management platform** built specifically for Indian businesses. It connects the two sides of modern retail — the online storefront customers see, and the operational backbone that runs the business — into a single, unified system.

A business running on BuyIndiaX gets:

- A **customer-facing e-commerce store** where shoppers discover, compare, and buy products
- A **point-of-sale (POS) terminal** for billing in-store customers with the same inventory
- A **real-time inventory system** that prevents overselling across both channels
- A **financial analytics dashboard** that tells owners exactly what's selling, what's not, and why
- **Full GST compliance** with automatic tax calculation on every transaction
- **Supplier and procurement management** to handle the supply side of the business

All of this, from one login.

---

## Who It's Built For

| Audience | What BuyIndiaX Gives Them |
|---|---|
| **Small & Mid-Size Retailers** | Replace 4 different tools with one unified platform |
| **D2C Brands** | Launch online with built-in inventory control and order management |
| **Grocery / FMCG Stores** | FIFO/FEFO batch tracking, expiry alerts, barcode scanning |
| **Multi-Store Businesses** | Centralized inventory, inter-store transfers, consolidated reporting |
| **B2B Wholesalers** | Wholesale pricing tiers, purchase orders, supplier management |

---

## Core Capabilities

### Omnichannel Retail
Customers shop online while store staff bills walk-in customers through the POS terminal — and the inventory stays accurate across both. One sale from either channel immediately reduces the available stock everywhere.

### Intelligent Inventory
The platform tracks every unit through its full lifecycle: when it arrived, what it cost, when it expires, and how fast it's selling. It uses FIFO (first-in, first-out) logic for perishables, sends low-stock alerts before stockouts happen, and generates automatic purchase orders when reorder points are reached.

### Real-Time Operations
Every stock change, order update, and payment confirmation propagates instantly to all connected screens via WebSocket. A store manager sees live inventory. A cashier sees live product availability. A customer sees live order status.

### GST-Ready Financial Engine
Every transaction — online or in-store — calculates the correct Indian GST (CGST + SGST for intra-state, IGST for inter-state) based on HSN codes and product categories. Tax breakdowns are embedded in every invoice and order.

### Business Intelligence
The analytics dashboard shows revenue trends, ABC product classification (which 20% of SKUs generate 80% of revenue), demand forecasting, category performance, and return summaries — giving owners the same insights that large retail chains pay enterprise software to provide.

---

## Platform Walkthrough

### For Customers
A customer visits the online store, searches for products using text or category filters, and sees real-time stock availability. The cart automatically shows GST-inclusive totals. Checkout is powered by Razorpay — supporting UPI, cards, net banking, and wallets. After payment, the customer receives order confirmation, can track their shipment, and earns loyalty points toward future purchases. An AI assistant (powered by Google Gemini) answers product and order questions at any time.

### For Store Staff
The POS terminal opens with a shift session. Staff search for products by name, barcode, or SKU. Items are added to the billing cart, payment is accepted (cash, UPI, or card), and a GST invoice is generated instantly. Each sale is linked to the shift session and feeds into the end-of-day summary.

### For Business Owners & Managers
The admin dashboard surfaces everything that matters: today's revenue, pending orders, low-stock alerts, top-performing products, and customer acquisition trends. Orders can be updated, refunds can be processed, and inventory can be adjusted — all from one screen. The returns management system handles RMA requests, inspection, restocking, and refunds through a structured workflow.

### For Supply Chain
Purchase orders are raised to suppliers through the platform. When goods arrive, a Goods Received Note (GRN) is created, which automatically adds new inventory batches, updates stock levels, and creates records for FIFO/FEFO tracking.

---

## Business Impact

| Metric | Impact |
|---|---|
| **Overselling Prevention** | Stock reservation system locks inventory during active checkouts |
| **Inventory Accuracy** | Real-time sync across online store and POS eliminates manual reconciliation |
| **Tax Compliance** | Automatic GST calculation eliminates manual tax errors on every bill |
| **Operational Speed** | POS billing handles high-volume in-store transactions with sub-second response |
| **Revenue Visibility** | ABC analysis and demand forecasting surface actionable insights immediately |
| **Customer Retention** | Loyalty points, wishlist, and personalized recommendations drive repeat purchases |

---

## Architecture Overview

BuyIndiaX follows a clean two-tier architecture: a **React frontend** that handles all user interaction, and a **Node.js/Express API** that manages data, business logic, and real-time events.

```
┌─────────────────────────────────────────────────────┐
│                  Customer Browser                    │
│          E-Commerce Store  ·  Order Tracking         │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────┐
│                Admin / POS Interface                 │
│    Dashboard  ·  POS Terminal  ·  Inventory Mgmt     │
└─────────────────────┬───────────────────────────────┘
                      │ REST API + WebSocket
┌─────────────────────▼───────────────────────────────┐
│                  Express API Server                  │
│   Auth · Orders · Payments · Inventory · Analytics   │
│         GST Engine · Job Queue · Webhooks            │
└──────────┬─────────────┬──────────────┬─────────────┘
           │             │              │
    ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
    │   MongoDB   │ │  Redis  │ │  Razorpay   │
    │  (Primary)  │ │ (Cache) │ │  (Payment)  │
    └─────────────┘ └─────────┘ └─────────────┘
```

**Key design decisions:**
- **Zero-dependency fallback:** The system runs without Redis — an in-memory LRU cache activates automatically, enabling zero-budget deployment
- **Stock reservation:** A TTL-based lock prevents overselling during concurrent checkouts without requiring database transactions on every cart action
- **Async job queue:** Email, notifications, and webhook delivery run in background queues that don't block payment responses
- **Role-based access:** Admin, manager, inventory staff, sales staff, and support staff each have scoped permissions

---

## Feature Highlights

**Customer Experience**
- Full-text product search with relevance ranking
- Product comparison across multiple SKUs
- Wishlist with restock notifications
- Real-time order tracking with status history
- Loyalty points and membership tiers (Bronze → Platinum)
- AI shopping assistant

**Operations & Admin**
- Live admin dashboard with revenue, orders, and inventory KPIs
- Order lifecycle management with status history and customer notifications
- Coupon and discount engine
- Return/RMA workflow (request → approve → inspect → restock/refund)
- Audit log for all admin actions
- Webhook delivery to external systems (with HMAC signature verification)

**Inventory & Supply Chain**
- FIFO/FEFO batch tracking with expiry date management
- Barcode generation (EAN-13 with India 890 prefix)
- Multi-warehouse support with cold storage and dark store categories
- Purchase order workflow with GRN (Goods Received Note)
- Supplier management with performance metrics
- Auto-reorder when stock hits minimum threshold

**Financial & Compliance**
- Full Indian GST engine: CGST, SGST, IGST based on HSN codes
- ABC product classification (A/B/C tier by revenue contribution)
- Weighted moving average demand forecasting
- POS session management with cashier-level reporting
- Revenue trend analysis with period-over-period comparison

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Framer Motion, TanStack Query, Zustand | UI, animations, data fetching, state |
| **Backend** | Node.js, Express | REST API, business logic |
| **Database** | MongoDB Atlas | Primary data store |
| **Cache** | Redis (+ in-memory fallback) | Session cache, rate limiting |
| **Real-Time** | Socket.IO | Live order updates, notifications |
| **Payments** | Razorpay | UPI, cards, net banking, wallets |
| **AI** | Google Gemini | Shopping assistant |
| **Security** | JWT, Helmet, bcrypt, rate limiting | Auth, headers, brute-force protection |
| **Infra** | Docker, Kubernetes (optional) | Containerization, orchestration |

---

## Screenshots

<table>
  <tr>
    <td><strong>Customer Storefront</strong></td>
    <td><strong>Admin Dashboard</strong></td>
  </tr>
  <tr>
    <td><em>Product discovery, search, cart, and checkout with real-time stock</em></td>
    <td><em>Revenue overview, order management, inventory health, ABC analysis</em></td>
  </tr>
  <tr>
    <td><strong>POS Terminal</strong></td>
    <td><strong>Inventory Management</strong></td>
  </tr>
  <tr>
    <td><em>Barcode-based billing, GST invoicing, shift session management</em></td>
    <td><em>Batch tracking, expiry alerts, low-stock reports, purchase orders</em></td>
  </tr>
</table>

---

## Live Demo

**Deployed Application:** [https://buyindiax.onrender.com](https://buyindiax.onrender.com)

> The live instance runs on Render's free tier — allow 30–60 seconds for cold start on first load.

**Explore the platform:**
- Browse products and experience the customer checkout flow
- Register an account to view orders and earn loyalty points
- The AI assistant is active on every page

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-username/BuyIndiaX.git
cd BuyIndiaX && npm install && npm run install-client

# Configure environment (copy .env.example and fill in values)
cp .env.example .env

# Run in development (frontend + backend together)
npm run dev:full
```

The only required services are MongoDB Atlas and Razorpay test keys. Redis and all other integrations are optional — the platform degrades gracefully without them.

---

## Roadmap

**Near Term**
- Mobile app (React Native) for customer shopping and store staff billing
- WhatsApp order notifications via Twilio
- Multi-language support (Hindi, Tamil, Telugu, Bengali)
- Advanced coupon engine (BOGO, tiered discounts, referral codes)

**Growth Stage**
- Marketplace model — multiple sellers, single storefront
- Delivery partner integration (Shiprocket, Delhivery) — API adapters already built
- Customer segmentation and automated marketing campaigns
- Subscription / recurring order support for grocery

**Scale**
- Microservices migration for high-traffic modules (inventory, payments)
- Regional data residency for enterprise clients
- White-label licensing for retail chains

---

## Contributing

Contributions are welcome. The codebase follows consistent patterns throughout — Express routes for the API, React pages and components for the UI, and Mongoose models for data. Please open an issue before raising a PR for any significant change.

---

## License

MIT — free to use, modify, and build upon.

---

<div align="center">

**Built for Indian retail. Designed for scale.**

*BuyIndiaX — where the store and the storefront are finally one.*

</div>

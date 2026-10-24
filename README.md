# 🩸 LifePulse — Emergency Blood Donation Portal

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_/_Mongoose-47A248.svg)](https://www.mongodb.com/)
[![WhatsApp-Web.js](https://img.shields.io/badge/WhatsApp--Web.js-1.26-25D366.svg)](https://wwebjs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

A modern, production-grade emergency blood matching platform built with **Node.js, Express, MongoDB (Mongoose), React (Vite), Tailwind CSS**, and automated WhatsApp alerts via **whatsapp-web.js**.

LifePulse features a **Unified User Identity** and a **Consent-First Two-Tier Matching** protocol designed to protect donor privacy while delivering rapid assistance during medical emergencies.

---

## 📑 Table of Contents

- [Core Architectural Highlights](#-core-architectural-highlights)
- [How It Works (Two-Tier Matching)](#-how-it-works-two-tier-matching)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Quick Start Guide](#-quick-start-guide)
- [Environment Configuration](#-environment-configuration)
- [Pre-Configured Credentials & Login](#-pre-configured-credentials--login)
- [Testing the WhatsApp Flow](#-testing-the-whatsapp-flow)
- [API Reference](#-api-reference)
- [Deployment & Production Hosting](#-deployment--production-hosting)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Core Architectural Highlights

1. **Unified User Identity**:
   - A single user account handles both blood requests and donor registrations.
   - Users toggle their **`isDonorAvailable`** status directly from their dashboard or navbar. When set to unavailable, they will not receive donation alerts.

2. **Consent-First Privacy (Zero Spam Guarantee)**:
   - Donor phone numbers and personal identities remain **completely masked** on the requester's interface.
   - Contact details are unlocked **only after the donor explicitly taps "Accept"** on an automated WhatsApp alert.

3. **Two-Tier Matching Engine**:
   - **Tier 1 (Public Blood Banks)**: Real-time inventory lookup sorted by proximity to the hospital with one-click direct calling (`tel:`) and WhatsApp messaging.
   - **Tier 2 (Individual Donors)**: High-speed MongoDB **2DSphere `$near` geospatial query** targeting compatible donors within a strict **15 km radius** (15,000 meters).

4. **GeoJSON Standard Compliance**:
   - All geospatial coordinates are strictly formatted as arrays in **`[longitude, latitude]`** order (longitude first) across MongoDB models, browser GPS capture, and calculations.

5. **Built-in DNS Resolution Fix**:
   - Includes `dns.setDefaultResultOrder('ipv4first')` and reliable fallback public DNS servers (`8.8.8.8`, `1.1.1.1`) in `config/db.js` to eliminate Windows Node.js `querySrv ECONNREFUSED` timeouts with MongoDB Atlas.

---

## 🔄 How It Works (Two-Tier Matching)

```mermaid
sequenceDiagram
    autonumber
    actor Requester
    participant Portal as LifePulse Web App
    participant Backend as Express + Mongoose
    participant Atlas as MongoDB Atlas (2DSphere)
    actor Donor as WhatsApp Donor

    Requester->>Portal: Submit Emergency Blood Request (Blood Group, Hospital, GPS)
    Portal->>Backend: POST /api/requests
    Backend->>Atlas: Store BloodRequest (GeoJSON [lon, lat])
    Backend->>Atlas: Query nearby Blood Banks & Matching Donors ($near <= 15km)
    Backend->>Backend: Create PENDING DonationResponse records
    Backend-->>Donor: Automated WhatsApp Alert with Secure Accept/Decline Links
    Backend-->>Portal: Return Tier 1 Blood Banks & Notified Donors Count (Donor Info MASKED)
    
    Requester->>Portal: View Search Results (Tab 1: Banks | Tab 2: Donors - MASKED)
    
    Donor->>Portal: Clicks Accept on WhatsApp (${FRONTEND_URL}/respond?req=...&donor=...&action=accept)
    Portal->>Backend: POST /api/responses/respond
    Backend->>Atlas: Update DonationResponse status to ACCEPTED
    
    Requester->>Portal: Clicks "Check New Responses" (or auto-polls)
    Backend-->>Portal: Return ACCEPTED Donors with Name, Phone, and Distance UNMASKED
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/) with JWT auto-injection interceptors

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express 4](https://expressjs.com/)
- **ODM**: [Mongoose 8](https://mongoosejs.com/)
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Geospatial Engine**: MongoDB 2DSphere Indexing (`$near` spherical operator)
- **Messaging**: [whatsapp-web.js](https://wwebjs.dev/) (LocalAuth session persistence) + [qrcode-terminal](https://github.com/gtanner/qrcode-terminal)

---

## 📂 Project Directory Structure

```text
blood-donation-portal/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection + DNS ipv4first fix
│   ├── models/
│   │   ├── User.js               # User model with [lng, lat] 2dsphere index & isDonorAvailable
│   │   ├── BloodBank.js          # BloodBank model with inventory Map & 2dsphere index
│   │   ├── BloodRequest.js       # BloodRequest model with hospitalCoordinates 2dsphere index
│   │   └── DonationResponse.js   # Compound unique index { requestId: 1, donorId: 1 }
│   ├── controllers/
│   │   ├── authController.js     # Register, login, toggleDonorStatus, getMe
│   │   ├── requestController.js  # createRequestAndNotify (15km $near), getAcceptedDonors, getNearbyBanks
│   │   └── responseController.js # handleDonorResponse, getResponseDetails
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/*
│   │   ├── requestRoutes.js      # /api/requests/*
│   │   └── responseRoutes.js     # /api/responses/*
│   ├── middleware/
│   │   └── authMiddleware.js     # Bearer token JWT verification
│   ├── services/
│   │   └── whatsappService.js    # whatsapp-web.js client + console fallback alert logger
│   ├── seedBanks.js              # Seeds 3 sample blood banks with inventories & coordinates
│   ├── .env                      # Environment variables
│   ├── package.json              # Backend dependencies & npm scripts
│   └── server.js                 # Express server + unified static frontend serving
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation bar with live donor toggle & profile badge
│   │   │   └── RequestModal.jsx  # Modal to request blood with GPS coordinate capture
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Clean phone + password authentication
│   │   │   ├── Register.jsx      # Registration with auto-GPS capture & default fallback
│   │   │   ├── Dashboard.jsx     # "Ready to Donate" toggle switch card & request tracking
│   │   │   ├── SearchResults.jsx # Dual-tab: Tier 1 (Blood Banks) & Tier 2 (Confirmed Donors)
│   │   │   └── RespondRequest.jsx# WhatsApp response landing page (Accept / Decline)
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT interceptor & API endpoints
│   │   ├── App.jsx               # React Router configuration & route guards
│   │   ├── main.jsx              # React DOM initialization
│   │   └── index.css             # Tailwind CSS directives & custom pulse animations
│   ├── index.html                # Vite HTML entrypoint
│   ├── package.json              # Frontend dependencies
│   ├── postcss.config.js         # PostCSS configuration
│   ├── tailwind.config.js        # Crimson/red healthcare theme extension
│   └── vite.config.js            # Vite proxy configuration to http://localhost:5000
├── Dockerfile                    # Multi-stage production container with Chromium
├── render.yaml                   # 1-click cloud deployment blueprint for Render.com
├── package.json                  # Root runner script configuration
└── README.md                     # Comprehensive project documentation
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **npm**: v9 or higher
- **MongoDB**: A running local MongoDB instance or a free MongoDB Atlas cluster

---

### Step 1: Clone or Navigate to the Project

```powershell
cd C:\Users\rohit\.gemini\antigravity\scratch\blood-donation-portal
```

---

### Step 2: Configure Environment Variables

The backend environment file is located at `backend/.env`. It is already pre-configured to connect to MongoDB Atlas:

```env
PORT=5000
MONGO_URI=mongodb+srv://rohitmpc2004_db_user:rohitdb@cluster0.8sh8j84.mongodb.net/blood_donation_db?retryWrites=true&w=majority
JWT_SECRET=blood_donation_portal_jwt_secret_key_2026_secure
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

### Step 3: Seed Sample Blood Banks

Populate the database with sample public blood banks with realistic inventories and coordinates:

```powershell
cd backend
npm run seed
```

**Expected output:**
```text
Connecting to MongoDB for seeding: ...
Clearing existing blood banks...
Inserting 3 sample blood banks with inventories...

✅ Successfully seeded 3 sample blood banks:
  1. City Central Red Cross Blood Bank (12 Healthcare Avenue, Bengaluru)
     Coordinates: [77.5946, 12.9716] | Phone: +919876543210
  2. Metro Lifeline Blood Centre (88 Ring Road, Bengaluru)
     Coordinates: [77.605, 12.98]   | Phone: +919876543211
  3. Apex Care Charitable Blood Bank (45 South Boulevard, Bengaluru)
     Coordinates: [77.58, 12.96]    | Phone: +919876543212
```

---

### Step 4: Run the Application

You can run the application in two ways:

#### Option A: Development Mode (Hot Reloading)

1. **Start Backend** (Terminal 1):
   ```powershell
   cd backend
   npm start
   ```
   *Runs API on `http://localhost:5000`.*

2. **Start Frontend** (Terminal 2):
   ```powershell
   cd frontend
   npm run dev
   ```
   *Opens client at `http://localhost:5173`.*

#### Option B: Unified Production Mode (Single Port 5000)

Because `backend/server.js` automatically serves the built React bundle from `frontend/dist`:
```powershell
cd backend
npm start
```
Now simply open **`http://localhost:5000`** in your browser. The complete application runs from a single port!

---

## 🔑 Pre-Configured Credentials & Login

### Test Account (Pre-Registered)
A verified test account is already seeded in the MongoDB Atlas database:

| Field | Value |
| :--- | :--- |
| **Login URL** | [http://localhost:5173/login](http://localhost:5173/login) |
| **Phone Number** | `9876543210` |
| **Password** | `password123` |
| **Registered Name** | Rahul Sharma |
| **Blood Group** | `O+` |
| **Donor Status** | Active (`isDonorAvailable: true`) |
| **Coordinates** | `[77.5946, 12.9716]` (Bengaluru Center) |

---

### Registering a New Account
1. Navigate to **[http://localhost:5173/register](http://localhost:5173/register)**.
2. Enter:
   - **Full Name**: e.g. `Priya Patel`
   - **Phone**: e.g. `9876500001` *(must be unique)*
   - **Password**: Any password (e.g. `secret123`)
   - **Blood Group**: Choose from `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`
   - **GPS Coordinates**: Auto-captured upon page load, or click **"Capture GPS Location"**
   - **Available for Donation**: Leave toggled **ON**
3. Click **"Complete Registration"**. You will be immediately redirected to the Dashboard.

---

## 📲 Testing the WhatsApp Flow

1. **Log in** to your account.
2. Click **"Request Blood Urgently"** on the Dashboard.
3. Select Blood Group **`O+`**, 1 Unit, enter Hospital Address (e.g. `Manipal Hospital, HAL Airport Rd, Bengaluru`), and keep coordinates close to `[77.5946, 12.9716]`.
4. Click **"Broadcast Emergency Alert"**.
5. The backend initiates a 15 km `$near` geospatial query:
   - It finds matching registered donors with `isDonorAvailable: true` and blood group `O+`.
   - It creates `PENDING` donation responses.
   - It sends an automated WhatsApp message (or prints the alert to the backend server terminal).
6. **Simulate Donor Acceptance**:
   - In the backend terminal, look for the logged alert:
     ```text
     👉 TAP TO ACCEPT (Share Contact):
     http://localhost:5173/respond?req=67...&donor=67...&action=accept
     ```
   - Copy and open that link in your browser.
   - The landing page confirms acceptance and marks status as `ACCEPTED`.
7. **Verify Real-Time Unmasking**:
   - Return to the requester's search results page (`/requests/:id/search`).
   - Switch to **Tab 2 (Tier 2: Confirmed Donors)**.
   - The donor's name, phone number, and proximity distance will now be **completely unmasked**, with direct **"Call Donor"** and **"WhatsApp"** buttons!

---

## 📡 API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new unified donor/requester account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `PUT` | `/api/auth/toggle-donor` | Protected | Toggle `isDonorAvailable` true/false |
| `GET` | `/api/auth/me` | Protected | Fetch profile of currently authenticated user |

#### Sample Register Request Payload:
```json
{
  "name": "Ananya Roy",
  "phone": "9876543299",
  "password": "securePassword123",
  "bloodGroup": "B+",
  "coordinates": [77.5946, 12.9716],
  "isDonorAvailable": true
}
```

---

### Emergency Requests (`/api/requests`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/requests` | Protected | Broadcast emergency blood request (triggers 15km `$near` query & WhatsApp) |
| `GET` | `/api/requests/my-requests` | Protected | Retrieve all requests created by authenticated user |
| `GET` | `/api/requests/:id` | Protected | Get single request details |
| `GET` | `/api/requests/:id/accepted-donors` | Protected | Return donors with status `'ACCEPTED'` (unmasked contacts) |
| `GET` | `/api/requests/:id/nearby-banks` | Public/Prot | Return blood banks sorted by distance with live inventory |

#### Sample Create Request Payload:
```json
{
  "bloodGroupNeeded": "O+",
  "unitsNeeded": 2,
  "hospitalAddress": "St. John's Medical College Hospital, Bengaluru",
  "hospitalCoordinates": [77.6190, 12.9344]
}
```

---

### Donor WhatsApp Responses (`/api/responses`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/responses/respond` | Public | Process donor response (`action`: `'accept'` or `'decline'`) |
| `GET` | `/api/responses/details` | Public | Fetch emergency details for donor response landing page (`?req=...&donor=...`) |

#### Sample Donor Response Payload:
```json
{
  "requestId": "67b9fe89a...",
  "donorId": "67b9fd12b...",
  "action": "accept"
}
```

---

## 🚀 Deployment & Production Hosting

### 1. Instant Public Tunnel (No Sign-Up Needed)
To test on your smartphone or send real WhatsApp links right now from your machine:
```powershell
npx localtunnel --port 5000
```
This produces a live public HTTPS address like `https://quick-blood-portal.loca.lt`.

---

### 2. Free 24/7 Cloud Deployment on Render.com

You can deploy to Render in two ways:

#### Method A: Native Node Web Service (Recommended — No Docker Required)
Render natively provides a full Node.js build environment that builds in ~1 minute without Docker:

1. **Push your code to GitHub**:
   ```powershell
   git init
   git add .
   git commit -m "Deploy blood donation portal"
   git remote add origin https://github.com/<your-username>/blood-donation-portal.git
   git branch -M main
   git push -u origin main
   ```
2. **Create Web Service on Render**:
   - Go to [render.com](https://render.com/) and click **New +** → **Web Service**.
   - Select your GitHub repository.
   - Choose **Node** as the Runtime (Environment).
   - Set **Build Command**: `npm run build`
   - Set **Start Command**: `npm start`
   - Under **Environment Variables**, add:
     - `MONGO_URI`: `mongodb+srv://rohitmpc2004_db_user:rohitdb@cluster0.8sh8j84.mongodb.net/blood_donation_db?retryWrites=true&w=majority`
     - `JWT_SECRET`: `blood_donation_portal_jwt_secret_key_2026_secure`
     - `NODE_ENV`: `production`
     - `PUPPETEER_CACHE_DIR`: `/opt/render/project/src/.cache/puppeteer`
   - Click **Deploy Web Service**.

#### Method B: Docker Container Deployment
If you prefer deploying via Docker, the [`Dockerfile`](Dockerfile) has been updated to use `node:20-bookworm-slim` with clean, non-conflicting Chromium dependencies:
- Select **Docker** as the Runtime on Render.
- Render will automatically execute the updated `Dockerfile` cleanly without exit code 100.

---

### 3. Docker Local Run
You can build and run the entire production container locally with Docker:

```powershell
# Build image
docker build -t lifepulse-portal .

# Run container on port 5000
docker run -p 5000:5000 --env-file backend/.env lifepulse-portal
```

---

## ❓ Troubleshooting & FAQs

#### Q1: `querySrv ECONNREFUSED` error when connecting to MongoDB Atlas
- **Fix**: Node.js on some Windows networks and ISPs blocks DNS SRV queries for `mongodb+srv://`. LifePulse includes `dns.setDefaultResultOrder('ipv4first')` and fallback public DNS servers (`8.8.8.8`, `1.1.1.1`) inside [`backend/config/db.js`](file:///C:/Users/rohit/.gemini/antigravity/scratch/blood-donation-portal/backend/config/db.js).

#### Q2: `Puppeteer / Chromium not found` warning in terminal
- **Fix**: The backend contains a safe `try / catch` around `whatsapp-web.js`. If Chrome is not installed locally on your system, the server logs alerts directly to the terminal with active clickable acceptance links, ensuring continuous functionality during local development.

#### Q3: "A user with this phone number is already registered"
- **Fix**: Phone numbers must be unique. Either use a different phone number (e.g. `9876500002`) or log in with the pre-registered account: Phone: `9876543210` / Password: `password123`.

#### Q4: Coordinates error during registration
- **Fix**: Allow location permissions in your browser when prompted, or enter numeric coordinates manually (e.g., `77.5946` for Longitude and `12.9716` for Latitude).

---

## 📄 License
This project is open-source under the [MIT License](https://opensource.org/licenses/MIT).
Designed to save lives during medical emergencies. ❤️

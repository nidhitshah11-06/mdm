# SME-Twin — Zero-Hardware Energy Intelligence Platform

> **One-line pitch:** Instead of asking a thin-margin SME to install sensors before they've seen a single rupee of savings, we build a calibrated simulation of their factory from data they already have — electricity bills, machine nameplates, production logs — and only ask them to spend money once the software has already proven where it's being wasted.

---

## What It Does

SME-Twin is a sensorless digital twin platform for Indian manufacturing SMEs. It builds a physics-informed simulation of a factory using only:

- Photos of electricity bills (OCR-extracted via Gemini Vision)
- Machine nameplate data (rated kW, type)
- Production register (daily output, shift timings)

The calibrated twin then powers four modules:

| Module | What it does |
|--------|-------------|
| **Optimizer** | MILP-based schedule that shifts loads to off-peak tariff windows (PuLP/CBC) |
| **Anomaly / Benchmark** | Compares your Specific Energy Consumption (SEC) against BEE benchmarks and anonymous cluster peers |
| **Compliance** | Auto-generates DPR, ADEETIE loan pre-application, PAT audit trail, and CBAM carbon footprint |
| **Voice Alerts** | Daily WhatsApp + voice call to supervisor in Hindi / Marathi / Gujarati via Twilio |

---

## Project Structure

```
MDM_SMETwin/
├── app/
│   ├── api/routes.py              # All API endpoints
│   ├── core/
│   │   ├── config.py              # Pydantic settings (.env)
│   │   └── database.py            # SQLAlchemy async engine
│   ├── models/schema.py           # ORM models (Factory, Machine, Bill, CalibrationLog, OptimizationResult)
│   ├── schemas/pydantic_schemas.py
│   ├── services/
│   │   ├── calibration_engine.py  # scipy SLSQP twin calibration
│   │   ├── scheduler_service.py   # PuLP MILP optimizer
│   │   ├── ocr_service.py         # Gemini Vision bill OCR
│   │   ├── notification_service.py# Twilio voice + WhatsApp
│   │   ├── benchmark_service.py   # Federated cluster benchmarking
│   │   └── compliance_service.py  # DPR / ADEETIE / CBAM generator
│   └── main.py                    # FastAPI app + CORS
├── migrations/
│   └── versions/
│       ├── 0001_initial_schema.py
│       └── 0002_add_optimization_results.py
├── frontend/
│   ├── product-site/              # Replit product website source (Vite + React + Tailwind)
│   ├── product-site-dist/         # Built assets served by FastAPI at /
│   ├── index.html                 # Existing CDN dashboard served at /dashboard
│   └── app.jsx                    # Dashboard source (Babel standalone)
├── tests/
│   └── test_optimization.py
├── .env.example
├── requirements.txt
└── alembic.ini
```

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 15+
- [uv](https://docs.astral.sh/uv/) package manager

### 2. Clone & Install

```bash
git clone <repo-url>
cd MDM_SMETwin

# Install dependencies using uv
uv pip install -r requirements.txt
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sme_twin
GEMINI_API_KEY=your_gemini_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_PHONE=+1XXXXXXXXXX
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

> **Gemini key**: Get one free at [aistudio.google.com](https://aistudio.google.com)  
> **Twilio**: Free trial at [twilio.com](https://twilio.com) — WhatsApp sandbox works without approval

### 4. Database Setup

```bash
# Create the database
createdb sme_twin

# Run migrations
.venv/Scripts/alembic.exe upgrade head
```

### 5. Start the Backend

```bash
.venv/Scripts/uvicorn.exe app.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

### 6. Build and Open the Frontend

Build the product website once from the project root:

```bash
npm install --prefix frontend/product-site
npm run build --prefix frontend/product-site
```

Then start the backend and open **http://localhost:8000/** for the product website. The existing dashboard remains available at **http://localhost:8000/dashboard**. The standalone `frontend/index.html` remains available for the dashboard's CDN-based demo mode.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/factory` | Register a factory |
| GET | `/api/v1/factory` | List all factories |
| GET | `/api/v1/factory/{id}` | Factory detail with machines + latest bill + calibration |
| GET | `/api/v1/factory/{id}/machines` | List machines |
| POST | `/api/v1/factory/{id}/machines` | Add a machine |
| GET | `/api/v1/factory/{id}/bills` | Bill history |
| POST | `/api/v1/bill/upload` | Upload bill image (OCR extraction) |
| GET | `/api/v1/factory/{id}/calibration` | Latest calibration result |
| POST | `/api/v1/twin/calibrate/{id}` | Run twin calibration |
| GET | `/api/v1/factory/{id}/schedule` | Latest optimization result |
| POST | `/api/v1/twin/optimize/{id}` | Run MILP schedule optimizer |
| GET | `/api/v1/benchmark/cluster?sector=textile` | Cluster benchmark data |
| GET | `/api/v1/compliance/dpr/{id}` | Generate DPR JSON |
| POST | `/api/v1/notify/supervisor` | Send Twilio voice + WhatsApp alert |

---

## Frontend Pages

| Page | Features |
|------|---------|
| **Dashboard** | KPI cards (bill, savings, CO₂, accuracy), 24h load curve, energy breakdown pie, top recommendations, SDG 7/9 impact |
| **Digital Twin** | Animated SVG factory floor (top-down spinning mill), machine heatmap by duty cycle, energy flow animation, calibration panel + loop diagram |
| **Optimizer** | 24h Gantt chart, tariff heatmap strip, before/after cost comparison, plain-English schedule changes |
| **Benchmarking** | Federated cluster bar chart, percentile rank, BEE/SAMEEEKSHA SEC comparison, privacy model |
| **Compliance** | Full DPR renderer, ADEETIE loan pre-fill + live EMI calculator, CBAM Scope 1+2 footprint, print-to-PDF |
| **Alerts** | Hindi/Marathi/Gujarati message preview, WhatsApp chat mockup, voice + WA send buttons, alert history |
| **Onboarding** | 5-step wizard: factory details → bill upload → machine review → production data → calibration |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + SQLAlchemy (async) + asyncpg |
| Database | PostgreSQL (via Alembic migrations) |
| Twin Engine | scipy.optimize SLSQP calibration |
| Optimizer | PuLP + CBC MILP solver |
| Bill OCR | Google Gemini Vision API |
| Notifications | Twilio Voice (hi-IN) + WhatsApp Business API |
| Benchmarking | Box-Muller synthetic cluster + BEE SEC benchmarks |
| Frontend | React 18 (CDN) + Recharts + Tailwind CSS (CDN) |
| Compliance | Dynamic DPR JSON → print-to-PDF |

---

## Illustrative Numbers

For a 20-machine textile SME billing ₹7 lakh/month:

- **Calibrated twin identifies ~₹35,000/month** in avoidable ToD-peak and idle-load cost (≈5%)
- **Zero hardware spend** to get that first number
- Optional: ₹1,500 plug-in logger rental for one week validates the top finding before any capital spend

> *These are modelled/illustrative figures consistent with BEE/SAMEEEKSHA published benchmarks for the textile sector.*

---

## SDG Alignment

- **SDG 7** — Affordable and Clean Energy: reduces energy waste in small factories with zero upfront hardware cost
- **SDG 9** — Industry, Innovation and Infrastructure: digitises factory operations for thin-margin SMEs previously excluded from Industry 4.0

---

## License

MIT License — see LICENSE file.

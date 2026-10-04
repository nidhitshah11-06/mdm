# SME-Twin Frontend

A complete React dashboard for the SME-Twin energy intelligence platform.

## How to Run

**No npm, no build step, no Node.js required.**

### Option 1 — VS Code Live Server (recommended)
1. Open the `MDM_SMETwin` folder in VS Code
2. Right-click `frontend/index.html` → **Open with Live Server**
3. App opens at `http://127.0.0.1:5500/frontend/index.html`

### Option 2 — Direct browser open
Double-click `frontend/index.html` — works for most pages.  
*(Note: Bill upload requires a running backend due to browser file API restrictions)*

### Option 3 — Python simple server
```bash
# From project root
.venv/Scripts/python.exe -m http.server 5500
# Then open http://localhost:5500/frontend/index.html
```

## Demo Mode

The app works **fully offline** with realistic mock data:
- Mock factory: Shree Ganesh Textiles, Surat (textile/spinning)
- 9 machines: Ring Frames, Compressors, Dyeing Vat, Pump, Lighting
- Mock savings: ₹34,200/month identified via schedule optimization
- All pages are functional without a backend connection

## Backend Connection

When the FastAPI backend is running at `http://localhost:8000`, the app automatically connects and uses live data. To start the backend:

```bash
.venv/Scripts/uvicorn.exe app.main:app --reload --port 8000
```

## Pages

| Page | Route (sidebar) | Key Features |
|------|----------------|-------------|
| Dashboard | `dashboard` | KPI cards, load curve, energy pie, recommendations |
| Digital Twin | `twin` | Animated SVG factory floor, duty cycle heatmap |
| Optimizer | `optimizer` | Gantt chart, tariff strip, schedule changes |
| Benchmarking | `benchmark` | Cluster bar chart, percentile rank, BEE SEC |
| Compliance | `compliance` | DPR, ADEETIE loan calculator, CBAM footprint |
| Alerts | `alerts` | Hindi/Marathi/Gujarati WhatsApp + voice |
| Onboarding | `onboarding` | 5-step wizard: register → bill → machines → calibrate |

## Tech

- **React 18** via unpkg CDN (no npm)
- **Recharts 2.12** via unpkg CDN (charts)
- **Tailwind CSS** via CDN (styling)
- **Babel Standalone** for JSX transpilation in-browser
- Single file: `app.jsx` (~700 lines, all pages)

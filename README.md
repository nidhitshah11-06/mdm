# SME-Twin

SME-Twin estimates factory machine duty cycles from an electricity bill and creates a tariff-aware, hourly load-shifting schedule. The API uses FastAPI, PostgreSQL, SQLAlchemy async, Alembic, Gemini Flash, SciPy, PuLP/CBC, and Twilio.

## Run locally

Requires Python 3.11+, PostgreSQL, and credentials for the external services you intend to use. Create a database, copy `.env.example` to `.env`, and configure `DATABASE_URL`, `GEMINI_API_KEY`, and Twilio values as needed.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`; OpenAPI docs are at `/docs`. `GET /api/v1/health` checks database connectivity. Tables are created only through Alembic migrations.

## API workflow

1. `POST /api/v1/factory` with JSON `{ "name": "Example Works", "sector": "Textiles", "phone_number": "+919876543210" }`.
2. `POST /api/v1/bill/upload` as multipart form data with `factory_id`, `billing_month` (`YYYY-MM`), and an image field named `image`.
3. `POST /api/v1/twin/calibrate/{factory_id}` to estimate machine duty cycles from the most recent bill.
4. `POST /api/v1/twin/optimize/{factory_id}` to get an hourly binary schedule and estimated daily savings.
5. `POST /api/v1/notify/supervisor` with `factory_id`, `message_hindi`, and optional WhatsApp `alert_text`.

The OCR registers previously unseen detected machines as shiftable with a 24-hour daily limit. Review those inferred inventory records before relying on optimization results. Calibration has one measured energy total and cannot uniquely identify multiple machine duty cycles; the optimizer therefore returns one bounded fit, not independently measured machine telemetry.

Hourly tariffs may use string keys `"0"` through `"23"`, or named `off_peak`, `shoulder`, and `peak` rates. Named rates use the default periods 00:00-05:59 off-peak, 06:00-17:59 shoulder, 18:00-21:59 peak, and 22:00-23:59 shoulder. Savings compare the cost-minimum schedule with a feasible tariff-unaware earliest-hour baseline, not verified historical operations. The capacity constraint uses the latest bill's peak kVA multiplied by `PEAK_DEMAND_POWER_FACTOR` as a kW planning limit; replace this assumption with an engineered site limit before operational use.

Twilio voice calls require a configured caller ID and compatible voice; WhatsApp uses the configured Twilio sender (the sandbox default is `whatsapp:+14155238886`). Keep credentials out of source control. Put authenticated access control, TLS termination, and rate limiting in the deployment gateway before exposing this API publicly.
# SME-Twin frontend

The frontend served by FastAPI is [`index.html`](./index.html). It is a single-file React 18 application that uses the React and Recharts UMD bundles from a CDN; it does not have a separate npm build.

## Run the application

Start the backend from the repository root:

```powershell
.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/`. The frontend uses same-origin `/api/v1` requests, so API calls use the server serving the page.

Opening `index.html` directly or serving the frontend from another port does not provide a working backend connection.

## Data and prototype limitations

- When no saved factory can be loaded, the UI shows an explicitly labelled illustrative sample workspace. Its factory, bill, machine and calibration values are examples, not measured operations. Mutating operations are disabled for this workspace.
- To load the persistent presentation preset, run `python -m scripts.seed_demo` after migrations. It creates a factory named `DEMO — Synthetic Shree Ganesh Textiles`; all its records are illustrative, not real measurements. The command is safe to repeat and skips insertion if that preset already exists.
- Saved factories load their machine inventory, latest bill and calibration record from the API. A saved optimizer result is displayed only when the API has one.
- On the Digital Twin page, a saved factory can record one weekly observation per week: energy, represented hours, optional production quantity/unit, machine state, downtime and notes. Saving it recalibrates estimated duty cycles subject to the reported downtime bounds. This is operator-entered periodic data, not live sensor telemetry or automatic fault detection.
- Weekly observations require a configured PostgreSQL database and current Alembic schema (`alembic upgrade head`, including migration `0003_add_weekly_observations`). The demo workspace is read-only and never stores sample submissions.
- Calibration estimates machine duty cycles from aggregate energy; the individual machine allocation is not uniquely identifiable from that total. The displayed residual is only fit to the submitted energy, not independent model accuracy. Production quantity is stored for context but is not yet used to calculate SEC.
- A reported degraded/down state or downtime is surfaced for operator review. The operator must explicitly choose to call the registered supervisor; a real call requires Twilio configuration and a valid factory contact.
- The benchmark service returns generated peer records; verified peer comparisons are intentionally withheld in the UI.
- Compliance/DPR output uses fixed prototype assumptions, including a 15% savings estimate and an average tariff of ₹8.50/kWh. It is labelled indicative and is not a verified funding or regulatory submission.
- Supervisor notifications require a saved factory and configured notification services. Messages are entered by the operator; the UI does not report delivery unless the API returns a provider reference.

## Existing sections

| Section | Purpose |
|---|---|
| Dashboard | Bill, calibration and saved-schedule summary; interval-data availability |
| Digital Twin | Registered machine inventory, calibration inputs, and weekly observation/calibration history |
| Optimizer | Run or inspect a saved machine schedule |
| Benchmarking | Explain the current lack of verified peer data |
| Compliance & DPR | Show an indicative API-generated report when available |
| Alerts | Compose and send operator-authored supervisor notifications |
| Onboarding | Register a factory, upload a bill, add machines and calibrate |

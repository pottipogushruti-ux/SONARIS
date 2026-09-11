# SONARIS — Frontend

AI-Powered Underwater Anomaly Detection System — frontend client.

> "See the unseen. Filter the noise. Find the hazard."
> Smart India Hackathon — Problem Statement SIH26057

This is a **live client**, not a static mockup. Every detection result, dashboard
statistic, GPS coordinate, and verification status is fetched from a real FastAPI
backend. Nothing is hardcoded. If the backend returns `DEMO_INFERENCE`, the UI shows
**DEMO INFERENCE**; if it returns `AI_INFERENCE`, the UI shows **AI INFERENCE**. The two
are never conflated.

---

## 1. Tech stack

- React 18 + TypeScript + Vite
- React Router v6
- Tailwind CSS
- Axios
- React Leaflet (OpenStreetMap tiles)
- Recharts (available for future chart needs)
- Lucide React icons

## 2. Folder structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/       — sidebar, mobile nav, logo, backend status
│   │   ├── dashboard/    — stat cards
│   │   ├── sonar/        — upload dropzone, processing pipeline, preprocessing viewer
│   │   ├── detection/    — split view, detection table + verification
│   │   ├── map/          — Leaflet marker popup
│   │   ├── reports/      — (report-specific UI lives inline in pages/Reports.tsx)
│   │   ├── judge/        — Judge Mode context + overlay
│   │   └── common/       — badges, states (loading/empty/error), page header, tooltip
│   ├── pages/            — one file per route (see App.tsx)
│   ├── services/api.ts   — the ONLY place that calls the backend
│   ├── types/api.ts      — TypeScript types mirroring the FastAPI schema
│   ├── hooks/useApiData.ts — generic fetch/loading/error hook
│   ├── utils/url.ts      — resolves backend-relative file paths
│   ├── App.tsx, main.tsx, index.css
├── public/
│   ├── sonaris-icon.svg
│   └── demo/sample-sonar-frame.jpg   — bundled sample for Live Detection / demo mode
├── .env.example
└── package.json
```

## 3. Installation

```bash
cd frontend
npm install
cp .env.example .env    # then edit VITE_API_BASE_URL if needed
npm run dev
```

The app runs at `http://localhost:5173` by default.

## 4. Environment variables

| Variable              | Description                              | Default                 |
|------------------------|-------------------------------------------|--------------------------|
| `VITE_API_BASE_URL`   | Base URL of the FastAPI backend           | `http://localhost:8000` |

No URL is ever hardcoded elsewhere in the app — `src/services/api.ts` and
`src/utils/url.ts` are the only places that read this variable.

## 5. Development commands

```bash
npm run dev       # start Vite dev server with HMR
npm run build     # type-check (tsc -b) and produce a production build in dist/
npm run preview   # preview the production build locally
npm run lint      # run ESLint
```

## 6. Backend API assumptions

The frontend expects a FastAPI backend exposing:

```
GET  /health
POST /analyze                  multipart/form-data { file, mode? }
GET  /detections                ?search=&risk=&status=&mission_id=&sort_by=&sort_dir=
GET  /detections/{id}
GET  /missions
GET  /missions/{id}
POST /verify                    { detection_id, decision, notes? }
GET  /report/{id}               (PDF)
GET  /report/{id}/csv
GET  /report/{id}/json
GET  /dashboard/stats
GET  /model/metrics              (optional — Performance page; absence renders
                                   "EVALUATION PENDING", never fabricated numbers)
```

Expected `POST /analyze` response shape (see `src/types/api.ts` for the full contract):

```json
{
  "mission_id": 12,
  "analysis_mode": "AI_INFERENCE",
  "model": { "name": "yolov8-sonaris", "version": "0.3.1" },
  "images": {
    "original": "/files/12/original.png",
    "denoised": "/files/12/denoised.png",
    "enhanced": "/files/12/enhanced.png",
    "normalized": "/files/12/normalized.png",
    "annotated": "/files/12/annotated.png"
  },
  "detections": [
    {
      "id": 101,
      "mission_id": 12,
      "object_label": "Shipwreck",
      "confidence": 0.91,
      "risk": "HIGH",
      "status": "AI_DETECTED",
      "analysis_mode": "AI_INFERENCE",
      "bounding_box": { "x": 420, "y": 180, "width": 90, "height": 40 },
      "location": { "latitude": 15.412, "longitude": 73.812, "source": "GPS" },
      "timestamp": "2026-09-10T11:32:00Z",
      "notes": null,
      "image_thumbnail": null
    }
  ],
  "processing_time_ms": 842,
  "location": { "latitude": 15.412, "longitude": 73.812, "source": "GPS" },
  "created_at": "2026-09-10T11:32:00Z"
}
```

**If the backend's real schema differs**, update `src/types/api.ts` and
`src/services/api.ts` to match it — do not paper over a mismatch with fake
frontend data or optional-chaining guesses that silently hide missing fields.

## 7. Frontend-to-backend integration details

- All backend calls are centralized in `src/services/api.ts`. No component calls
  `axios`/`fetch` directly.
- Image URLs returned by the backend (e.g. `/files/...`) are resolved against
  `VITE_API_BASE_URL` by `src/utils/url.ts` — the frontend never invents a path.
- Errors are normalized into a `SonarisApiError` with a `kind` of `OFFLINE`,
  `TIMEOUT`, `VALIDATION`, `NOT_FOUND`, `SERVER`, or `UNKNOWN`, so the UI can show
  a clear, non-technical message (e.g. *"SONARIS backend is unavailable. Please
  ensure the FastAPI server is running."*) instead of a raw stack trace.
- The **Sonar Analysis** processing pipeline UI reflects real request state
  (upload progress, then awaiting-response, then complete) rather than a fixed
  fake-timer animation — if the backend responds quickly, the UI advances
  immediately.
- **Analysis Mode** (`AI_INFERENCE` vs `DEMO_INFERENCE`) and **Location Source**
  (`GPS` vs `SIMULATED` vs `UNAVAILABLE`) are always read from the backend
  response and always visibly labeled — see `AnalysisModeBadge.tsx` and the
  Mission Map / Detection popup components.
- Human verification (`Confirm` / `Reject` / `Needs review`) calls
  `POST /verify` and updates the row in place from the response — it does not
  optimistically assume success before the backend confirms it.

## 8. Testing procedure

1. Start the FastAPI backend (`VITE_API_BASE_URL` should point at it).
2. `npm run dev` and open the app.
3. **Landing → Dashboard**: confirm stat cards populate from `/dashboard/stats`,
   or show `0` / `DEMO DATA` correctly when there's no real data yet.
4. **Sonar Analysis**: upload a JPG/PNG/TIFF, click *Analyze Sonar*, confirm the
   `POST /analyze` request fires, preprocessing images render from the returned
   URLs, the AI/Demo badge matches the backend's `analysis_mode`, and the
   detection table shows real confidence/risk/status values.
5. Click **Confirm / Reject / Needs review** on a detection and confirm
   `POST /verify` fires and the row updates.
6. **Mission Map**: confirm markers only appear for detections with real
   coordinates, and that `SIMULATED`/missing coordinates are labeled instead of
   silently plotted.
7. **Detection History**: test search, risk filter, status filter, mission
   filter, and column sorting against live data from `/detections`.
8. **Reports**: download PDF, CSV, and JSON for a mission and confirm the files
   come from the backend endpoints (not generated client-side).
9. **Judge Mode** (button on the landing page): step through all 11 stages with
   Next/Back/Exit.
10. **Live Detection**: run the bundled sample image through the real backend
    and confirm it's labeled `DEMO INFERENCE`.
11. Refresh the browser mid-flow and confirm previously saved backend data
    (dashboard stats, detection history, missions) still loads correctly.
12. Check the browser console for errors on every page.

## 9. Known limitations

- `src/types/api.ts` is written against the contract described in the original
  spec. If your backend's actual field names differ, update the types and
  `services/api.ts` before relying on this UI — it does not silently coerce or
  guess field names.
- The bundled `public/demo/sample-sonar-frame.jpg` is a synthetically generated
  placeholder frame (not a real sonar capture) used only so **Live Detection**
  has something to send to the backend without requiring the user's own file.
  Replace it with a real, appropriately licensed sample if one is available.
- The `/model/metrics` endpoint is optional in this build; if your backend
  doesn't expose it yet, the Performance page will show a request error rather
  than fabricated numbers — wire up the endpoint (or adjust `getModelMetrics`)
  once real evaluation results exist.
- Case Studies and Data & AI content is written from publicly known,
  independently sourced information at the time of writing. Verify links and
  facts before presenting to judges, and swap in your team's own authoritative
  sources where available.
- PDF/CSV/JSON downloads assume the backend returns the actual file bytes at
  `GET /report/{id}[/csv|/json]`; no report content is generated in the
  frontend.

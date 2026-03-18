# MimicAPI

> Record real API traffic from your browser → auto-generate an OpenAPI 3.0 spec → spin up a local mock server. Zero config. Zero cloud. Fully FOSS.

---

## The problem

Every frontend developer has been blocked waiting for a backend API that isn't ready yet.
Existing tools require you to **manually write** specs (Postman, Insomnia) or already **have** a spec (Prism).
No open-source tool records real traffic **and** turns it into a live mock — until now.

---

## How it works

```
Browser page fires fetch() / XHR
        │
        ▼
[interceptor.js — MAIN world]   ← patches window.fetch and XMLHttpRequest
        │  CustomEvent
        ▼
[bridge.js — isolated world]    ← relays to chrome.runtime
        │  sendMessage
        ▼
[background service-worker]     ← stores + deduplicates by endpoint
        │
        ▼
[DevTools panel — React UI]     ← live traffic list + Build Spec button
        │
        ▼
[shared/openapi-builder.js]     ← infers schemas → emits OpenAPI 3.0 YAML
        │
        ▼
[server/  —  npx mimicapi serve spec.yaml]   ← Express mock serves real responses
```

---

## Features

- **Live traffic capture** — intercepts every `fetch` and `XMLHttpRequest` call on any site
- **Smart path templating** — `/users/42` and `/users/99` merge into `/users/{userId}` automatically
- **Schema inference** — derives JSON Schema (draft-7) from real response bodies, handles nested objects, arrays, nullable fields, and formats (date-time, email, uuid, uri)
- **OpenAPI 3.0.3 export** — valid spec you can paste into Swagger UI, Postman, or any other tool
- **Local mock server** — `npx mimicapi serve spec.yaml` — no internet required
- **Faker fallback** — if exact replay data isn't available, generates realistic fake data from the inferred schema
- **Zero proprietary dependencies** — the extension has no npm runtime deps; the server uses only MIT-licensed packages

---

## Installation

### Extension (development)

```bash
git clone https://github.com/Quaser001/mimicapi.git
cd mimicapi
npm install
npm run build:panel
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select the `extension/` folder

### Mock server

```bash
cd server
npm install
```

---

## Usage

1. Open Chrome DevTools (`F12`) → click the **MimicAPI** tab
2. Browse any website — requests appear live in the Traffic panel
3. Click **Build spec** → switch to the OpenAPI Spec tab
4. Click **Download .yaml**
5. In your terminal:

```bash
npx mimicapi serve mimicapi-spec.yaml --port 3001
```

6. Your frontend now hits `http://localhost:3001` instead of the real API

---

## Tech stack

| Layer | Technology | License |
|---|---|---|
| Extension | Chrome MV3, Vanilla JS | — |
| Devtools UI | React 18, Vite | MIT |
| Schema engine | Pure JS (no deps) | MIT |
| Mock server | Node.js, Express | MIT |
| Response faker | @faker-js/faker | MIT |
| Spec parsing | js-yaml | MIT |
| CLI | Commander.js | MIT |

**No proprietary APIs. No cloud services. No telemetry.**

---

## Project structure

```
mimicapi/
├── extension/
│   ├── manifest.json              Chrome MV3 manifest
│   ├── content/
│   │   ├── interceptor.js         MAIN world — patches fetch + XHR
│   │   └── bridge.js              Isolated world — relays to background SW
│   ├── background/
│   │   ├── service-worker.js      Message router + broadcast
│   │   └── store.js               In-memory capture store + path templating
│   └── devtools/
│       └── panel/                 React + Vite devtools panel
│           └── src/components/
│               ├── TrafficList    Live request list + detail pane
│               ├── SpecViewer     OpenAPI YAML viewer + download
│               └── MockControls   Server start/stop UI
├── shared/
│   ├── schema-infer.js            JSON value → JSON Schema draft-7
│   └── openapi-builder.js         Captures → OpenAPI 3.0.3 spec
└── server/
    └── src/
        ├── index.js               CLI entry (Commander)
        ├── router.js              Builds Express routes from spec
        └── responder.js           Exact replay + faker fallback
```

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Built for

[FOSS Hack 2026](https://fossunited.org/fosshack/2026) — India's largest open-source hackathon.

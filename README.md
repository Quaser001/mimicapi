# MimicAPI

> Record real API traffic from your browser → auto-generate an OpenAPI 3.0 spec → spin up a local mock server. Zero config. Zero cloud. Fully FOSS.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![FOSS Hack 2026](https://img.shields.io/badge/FOSS%20Hack-2026-green.svg)](https://fossunited.org/fosshack/2026)
[![Tests](https://img.shields.io/badge/tests-35%20passing-teal.svg)]()

---

## The problem

Every frontend developer gets blocked waiting for a backend that
isn't ready. Writing mock data by hand falls out of sync. Tools
like Postman require you to write specs manually. Prism needs a
spec that doesn't exist yet.

MimicAPI flips this — instead of writing specs, you just browse.

---

## How it works

```
Browser makes fetch() or XHR call
        ↓
interceptor.js captures it (MAIN world)
        ↓
bridge.js relays to background SW (isolated world)
        ↓
CaptureStore deduplicates by endpoint + templates paths
        ↓
Click "Build Spec" → schema-infer + openapi-builder
        ↓
Valid OpenAPI 3.0.3 YAML spec
        ↓
npx mimicapi serve spec.yaml → Express mock server
        ↓
localhost:3001/dashboard → web dashboard
```

---

## Install

### Extension

```bash
git clone https://github.com/Quaser001/mimicapi.git
cd mimicapi
npm install
cd extension/devtools/panel && npm install && npm run build && cd ../../..
```

Load in Chrome:
1. Go to `chrome://extensions`
2. Enable Developer mode
3. Click Load unpacked → select the `extension/` folder
4. Open DevTools on any site → MimicAPI tab

### Mock server

```bash
cd server && npm install
node src/index.js serve spec.yaml --port 3001
node src/index.js serve spec.yaml --port 3001 --delay 500
node src/index.js serve spec.yaml --port 3001 --watch
```

---

## Usage

1. Open Chrome DevTools on any website
2. Click the **MimicAPI** tab
3. Browse around — requests appear live
4. Click **Build Spec** → download the YAML
5. Run `node server/src/index.js serve mimicapi-spec.yaml`
6. Your frontend now hits `http://localhost:3001`
7. Visit `http://localhost:3001/dashboard` to inspect routes

**Keyboard shortcut:** `Ctrl+Shift+M` toggles recording on/off

---

## Features

| Feature | Description |
|---|---|
| Live traffic capture | Intercepts every fetch + XHR at document_start |
| Smart path templating | `/users/42` → `/users/{userId}` automatically |
| Schema inference | JSON Schema draft-7 from real response bodies |
| Null + mixed type handling | Nullable fields and mixed arrays handled correctly |
| OpenAPI 3.0.3 export | Download as YAML or JSON |
| Mock server | Express server with exact replay + faker fallback |
| Response delay | `--delay 500` simulates slow networks |
| Live reload | `--watch` reloads routes when spec file changes |
| Web dashboard | Routes, request log, spec viewer, import at /dashboard |
| Health endpoint | `/__mimicapi/health` returns uptime + route count |
| Extension popup | Live capture count + pause/clear from toolbar |
| Keyboard shortcut | `Ctrl+Shift+M` toggles recording |

---

## Tech stack

| Layer | Tech | License |
|---|---|---|
| Extension | Chrome MV3, Vanilla JS | — |
| Devtools panel | React 18, Vite 5 | MIT |
| Schema engine | Pure JS, zero deps | MIT |
| Mock server | Node.js, Express 4 | MIT |
| Faker | @faker-js/faker | MIT |
| CLI | Commander.js | MIT |
| YAML | js-yaml | MIT |

No proprietary APIs. No cloud services. No telemetry.

---

## Project structure

```
extension/
  content/interceptor.js      MAIN world — patches fetch + XHR
  content/bridge.js           Isolated world — relays to SW
  background/service-worker.js Message router
  background/store.js         Capture store + path templating
  devtools/panel/             React 18 devtools UI
  popup/                      Toolbar popup with live stats
shared/
  schema-infer.js             JSON → JSON Schema draft-7
  openapi-builder.js          Captures → OpenAPI 3.0.3
  tests/                      35 tests
server/
  src/index.js                CLI entry + Express setup
  src/router.js               Route builder from spec
  src/responder.js            Response replay + faker
  src/public/dashboard.html   Web dashboard
docs/
  index.html                  GitHub Pages landing page
```

---

## Development

```bash
npm test               # run 35 tests
npm run build:panel    # build React panel
npm run dev:panel      # watch mode
```

---

## License

MIT — see [LICENSE](LICENSE)

Built for [FOSS Hack 2026](https://fossunited.org/fosshack/2026)

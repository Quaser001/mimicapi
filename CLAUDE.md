---
# MimicAPI — Claude Code Project Intelligence

## What this project does
Chrome extension that intercepts browser API traffic (fetch + XHR),
infers JSON schemas from real responses, generates OpenAPI 3.0.3 specs,
and serves them via a local Express mock server with a web dashboard.

## Architecture — READ THIS BEFORE TOUCHING ANYTHING

### Critical rule: two copies of shared files
shared/schema-infer.js and shared/openapi-builder.js are ALSO copied
into extension/background/. Chrome MV3 blocks imports from outside
the extension folder. If you modify shared/*.js you MUST also update
extension/background/*.js with the same changes or the extension breaks.

### Chrome MV3 two-world pattern
- extension/content/interceptor.js runs in MAIN world (can patch window.fetch)
- extension/content/bridge.js runs in ISOLATED world (can call chrome.runtime)
- They communicate via CustomEvent('__mimicapi_capture__')
- Background service worker receives messages from bridge.js only

### ESM everywhere
- Root package.json has "type": "module"
- All .js files use import/export syntax
- Server uses Node ESM, not CommonJS

## Commands
npm test                     — run all 28 tests (Node built-in test runner)
npm run build:panel          — build React devtools panel to extension/devtools/panel/dist/
npm run dev:panel            — watch mode for panel development
node server/src/index.js serve server/sample-spec.yaml --port 3001
node server/src/index.js serve server/sample-spec.yaml --delay 500
node server/src/index.js serve server/sample-spec.yaml --watch

## File map
extension/content/interceptor.js    — patches fetch + XHR, fires CustomEvent
extension/content/bridge.js         — relays CustomEvent → chrome.runtime.sendMessage
extension/background/service-worker.js — message router, owns capture store
extension/background/store.js       — CaptureStore class, path templating logic
extension/background/schema-infer.js — COPY of shared/schema-infer.js
extension/background/openapi-builder.js — COPY of shared/openapi-builder.js
extension/devtools/panel/src/App.jsx — main React UI, bridges chrome.runtime ↔ state
extension/devtools/panel/src/components/TrafficList.jsx — request list + detail pane
extension/devtools/panel/src/components/SpecViewer.jsx  — YAML viewer + download
extension/devtools/panel/src/components/MockControls.jsx — server controls UI
extension/devtools/panel/src/utils/yaml.js — shared YAML serialiser (no deps)
shared/schema-infer.js       — inferSchema() + mergeSchemas(), zero dependencies
shared/openapi-builder.js    — buildSpec() + specToYAML(), zero dependencies
server/src/index.js          — Commander CLI, Express setup, dashboard API routes
server/src/router.js         — builds Express routes from OpenAPI spec
server/src/responder.js      — exact response replay + faker fallback generation
server/src/public/dashboard.html — standalone dashboard UI, polls /__mimicapi/*

## Dashboard API (internal Express routes)
GET  /__mimicapi/info    — { title, port, routes[], delay, watch }
GET  /__mimicapi/spec    — raw YAML string of loaded spec
GET  /__mimicapi/log     — { entries: [{ time, method, path, status, dur }] }
POST /__mimicapi/import  — body: raw YAML → hot-reload routes

## Test files
shared/tests/schema-infer.test.js    — 18 tests
shared/tests/openapi-builder.test.js — 10 tests
Uses Node built-in test runner (node:test + node:assert)
Run with: node --test shared/tests/*.test.js

## Known issues / gotchas
- mimicapi-spec.yaml in root may have {} empty object entries if 
  captured from a site with empty response bodies — use 
  server/sample-spec.yaml for reliable testing
- Panel dist/ must be rebuilt after any React component changes
- After editing extension JS files, reload extension in 
  chrome://extensions (click the refresh icon on the card)
- Chrome requires PNG icons — SVG not supported in manifest

## FOSS Hack 2026 constraints
- No proprietary APIs anywhere in the codebase
- All dependencies must be MIT licensed
- No blockchain/crypto features
- MIT license required (LICENSE file exists)
- Deadline: March 31, 2026
- GitHub: https://github.com/Quaser001/mimicapi
---

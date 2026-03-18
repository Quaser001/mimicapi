# Contributing to MimicAPI

Thank you for your interest! MimicAPI is built for FOSS Hack 2026 and welcomes contributions.

## Local setup

### Prerequisites
- Node.js 20+
- npm 10+
- Google Chrome 120+

### Extension dev loop

```bash
# Install all workspace deps
npm install

# Build the devtools React panel
npm run build:panel

# Load unpacked in Chrome:
# chrome://extensions → Developer mode ON → Load unpacked → select /extension
```

After any change to the panel source, re-run `npm run build:panel` and click
the refresh icon on the extension card in `chrome://extensions`.

### Mock server

```bash
cd server
npm install
node src/index.js serve path/to/spec.yaml --port 3001
```

### Running tests

```bash
npm test
```

## Project structure

```
extension/   Chrome MV3 extension (content scripts, background SW, devtools panel)
shared/      Platform-agnostic engine (schema-infer, openapi-builder) — no deps
server/      Node.js mock server (Express, js-yaml, @faker-js/faker)
```

## Principles

- **No proprietary APIs** — the core works entirely without any closed service.
- **No cloud required** — everything runs locally on the developer's machine.
- **Minimal dependencies** — the extension itself has zero runtime npm deps.

## Submitting a PR

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes with clear, focused commits.
3. Run `npm test` and make sure everything passes.
4. Open a PR with a short description of what changed and why.

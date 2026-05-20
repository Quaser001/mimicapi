# MimicAPI System Architecture

## Overview

MimicAPI is a local-first API reconstruction and mocking platform.

The system captures real browser traffic, infers structured schemas, generates OpenAPI specifications, and creates executable mock infrastructure.

---

# High-Level Architecture

```text
Browser Traffic
      ↓
Interceptor Layer
      ↓
Bridge Layer
      ↓
Capture Store
      ↓
Schema Inference Engine
      ↓
OpenAPI Builder
      ↓
Mock Runtime
      ↓
Dashboard + CLI
```

---

# Core Components

## 1. Interceptor Layer

### Responsibilities
- patch fetch
- patch XMLHttpRequest
- capture requests/responses
- preserve execution transparency

### Design Notes
Runs in the MAIN execution world to ensure visibility into application-level network activity.

---

## 2. Bridge Layer

### Responsibilities
- isolate execution boundaries
- relay captured payloads
- prevent direct extension contamination

### Security Goal
Maintain Chrome extension isolation guarantees while enabling safe communication.

---

## 3. Capture Store

### Responsibilities
- endpoint deduplication
- path normalization
- request aggregation
- response tracking

### Important Logic
Transforms:

```text
/users/42
/users/77
```

into:

```text
/users/{userId}
```

---

## 4. Schema Inference Engine

### Responsibilities
- infer JSON Schema
- detect nullable fields
- infer array/object structure
- merge observed response patterns

### Current Constraints
- probabilistic type conflicts
- incomplete edge-case coverage
- schema drift across sessions

---

## 5. OpenAPI Builder

### Responsibilities
- generate OpenAPI 3.0.3 specs
- construct path operations
- organize schemas/components
- export YAML/JSON

---

## 6. Mock Runtime

### Responsibilities
- replay API responses
- simulate backend services
- inject delays
- generate fallback fake data

### Runtime Stack
- Node.js
- Express
- Faker

---

# Engineering Principles

## Local-First
No cloud dependency.

## Reproducibility
Generated APIs should be deterministic and portable.

## Extensibility
Independent modules enable future protocol support.

## FOSS-Centric
No proprietary infrastructure.

---

# Future Architecture Extensions

## Planned Features
- GraphQL reconstruction
- gRPC-Web support
- WebSocket traffic capture
- AI-assisted schema repair
- API semantic labeling
- endpoint clustering
- synthetic traffic generation
- contract testing

---

# Research Directions

Potential research intersections:
- automated API understanding
- semantic schema inference
- autonomous software reverse engineering
- AI-assisted backend reconstruction
- developer workflow automation

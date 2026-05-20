# agents.md

## MimicAPI Agent Architecture

MimicAPI is evolving toward an AI-native API reverse engineering and mocking platform.

This document defines modular agent responsibilities for future development.

---

# Agent Topology

```text
Traffic Agent
      ↓
Schema Agent
      ↓
Spec Agent
      ↓
Mock Agent
      ↓
Evaluation Agent
```

---

# 1. Traffic Agent

## Responsibility
Captures and normalizes browser traffic.

## Handles
- fetch interception
- XHR interception
- deduplication
- request normalization
- endpoint clustering
- path parameter inference

## Future Extensions
- WebSocket support
- GraphQL interception
- gRPC-Web parsing
- HAR import/export

---

# 2. Schema Agent

## Responsibility
Infers structured schemas from observed traffic.

## Handles
- JSON schema generation
- nullable inference
- mixed-type handling
- recursive object resolution
- enum detection

## Future Extensions
- probabilistic type inference
- schema confidence scoring
- anomaly detection
- semantic field labeling

---

# 3. Spec Agent

## Responsibility
Builds OpenAPI-compatible specifications.

## Handles
- OpenAPI generation
- path grouping
- operation synthesis
- example generation
- response organization

## Future Extensions
- AsyncAPI support
- Postman export
- SDK generation
- API diffing

---

# 4. Mock Agent

## Responsibility
Creates executable mock infrastructure.

## Handles
- route replay
- fake data generation
- latency simulation
- route hydration
- dashboard synchronization

## Future Extensions
- chaos simulation
- edge-case generation
- synthetic API fuzzing
- adversarial payload testing

---

# 5. Evaluation Agent

## Responsibility
Measures generated API quality.

## Handles
- schema validation
- spec correctness
- endpoint coverage
- replay consistency
- route integrity

## Future Extensions
- benchmark suite
- mutation testing
- API hallucination detection
- schema drift monitoring

---

# Engineering Principles

- Modular architecture
- Zero cloud dependency
- Local-first tooling
- Reusable components
- Reproducible workflows
- FOSS-first ecosystem
- Explicit interface boundaries
- Incremental extensibility

---

# Long-Term Vision

MimicAPI aims to become:

> An AI-native programmable API reconstruction and simulation platform.

Potential future capabilities:
- autonomous endpoint discovery
- AI-generated SDKs
- API behavior learning
- contract verification
- agentic integration testing
- synthetic backend generation

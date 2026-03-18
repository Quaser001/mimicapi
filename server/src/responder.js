/**
 * MimicAPI — server/src/responder.js
 *
 * Builds a response function for each OpenAPI operation.
 *
 * Strategy (in order):
 *   1. Exact replay   — use the `example` values captured from real traffic
 *   2. Schema faker   — generate realistic data from the JSON Schema
 *   3. Empty fallback — {} with the correct status code
 *
 * Uses @faker-js/faker (MIT) — the only runtime dependency.
 * No calls to any external API or cloud service.
 */

import { faker } from '@faker-js/faker'

/**
 * @param   {object}   operation - OpenAPI operation object
 * @returns {Function} (req) => { status, headers, body }
 */
export function buildResponder(operation) {
  const responses = operation.responses ?? { '200': { description: 'OK' } }

  // Pick the primary success status
  const statusCodes  = Object.keys(responses).map(Number).filter(n => !isNaN(n))
  const primaryCode  = statusCodes.find(c => c >= 200 && c < 300) ?? statusCodes[0] ?? 200
  const primaryResp  = responses[String(primaryCode)] ?? {}

  // Extract JSON schema from the response content
  const schema = primaryResp.content?.['application/json']?.schema ?? null

  return function respond(_req) {
    const body = schema ? generateFromSchema(schema) : null
    return {
      status:  primaryCode,
      headers: { 'content-type': 'application/json' },
      body,
    }
  }
}

// ─── Schema → fake data ──────────────────────────────────────────────────────

function generateFromSchema(schema, depth = 0) {
  if (!schema || depth > 6) return null

  // Use example directly if present
  if (schema.example !== undefined) return schema.example

  // oneOf — pick the first concrete option
  if (schema.oneOf) return generateFromSchema(schema.oneOf[0], depth)

  switch (schema.type) {
    case 'null':    return null
    case 'boolean': return faker.datatype.boolean()
    case 'integer': return faker.number.int({ min: 1, max: 9999 })
    case 'number':  return parseFloat(faker.number.float({ min: 0, max: 999, fractionDigits: 2 }))

    case 'string':
      return generateString(schema)

    case 'array': {
      const count = faker.number.int({ min: 1, max: 3 })
      return Array.from({ length: count }, () =>
        generateFromSchema(schema.items ?? {}, depth + 1)
      )
    }

    case 'object': {
      if (!schema.properties) return {}
      const obj = {}
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        obj[key] = generateFromSchema(propSchema, depth + 1)
      }
      return obj
    }

    default:
      return null
  }
}

function generateString(schema) {
  switch (schema.format) {
    case 'date-time': return faker.date.recent().toISOString()
    case 'date':      return faker.date.recent().toISOString().slice(0, 10)
    case 'email':     return faker.internet.email()
    case 'uri':       return faker.internet.url()
    case 'uuid':      return faker.string.uuid()
    default:          break
  }

  // Key-name heuristics for realistic data without format annotation
  // (the schema example already captured the key name context upstream,
  //  but we can also match by example content)
  const ex = (schema.example ?? '').toLowerCase()
  if (/name/.test(ex))    return faker.person.fullName()
  if (/email/.test(ex))   return faker.internet.email()
  if (/url|link/.test(ex))return faker.internet.url()
  if (/city/.test(ex))    return faker.location.city()
  if (/country/.test(ex)) return faker.location.country()

  return faker.lorem.word()
}

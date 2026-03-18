/**
 * MimicAPI — shared/schema-infer.js
 *
 * Infers a JSON Schema (draft-7) object from a sample JavaScript value.
 * Zero external dependencies — pure JS.
 *
 * Handles: string, number, integer, boolean, null, array, nested object.
 * Merges multiple samples of the same endpoint to produce a richer schema.
 *
 * Usage:
 *   import { inferSchema, mergeSchemas } from '../shared/schema-infer.js'
 *   const schema = inferSchema({ id: 1, name: "Alice", active: true })
 */

// ─── Single value → schema ───────────────────────────────────────────────────

export function inferSchema(value) {
  if (value === null || value === undefined) {
    return { type: 'null' }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array', items: {} }
    }
    // Merge schemas of all items into one representative item schema
    const itemSchemas = value.map(inferSchema)
    return { type: 'array', items: mergeSchemas(itemSchemas) }
  }

  if (typeof value === 'object') {
    const properties = {}
    const required   = []
    for (const [key, val] of Object.entries(value)) {
      properties[key] = inferSchema(val)
      required.push(key)
    }
    return { type: 'object', properties, required }
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { type: 'integer', example: value }
      : { type: 'number',  example: value }
  }

  if (typeof value === 'string') {
    // Detect well-known string formats
    const fmt = detectFormat(value)
    const schema = { type: 'string', example: value }
    if (fmt) schema.format = fmt
    return schema
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean', example: value }
  }

  return {}
}

// ─── Format detection ────────────────────────────────────────────────────────

function detectFormat(str) {
  if (!str || str.length > 100) return null
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str))  return 'date-time'
  if (/^\d{4}-\d{2}-\d{2}$/.test(str))                    return 'date'
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str))             return 'email'
  if (/^https?:\/\//.test(str))                            return 'uri'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) return 'uuid'
  return null
}

// ─── Merge N schemas → one schema ────────────────────────────────────────────

/**
 * Merges an array of schemas produced from multiple response samples.
 * Strategy:
 *   - If all schemas have the same type → keep that type.
 *   - Mixed types → oneOf.
 *   - Objects → union of all properties, required = intersection.
 *   - Arrays → merge item schemas.
 */
export function mergeSchemas(schemas) {
  if (!schemas || schemas.length === 0) return {}
  if (schemas.length === 1)             return schemas[0]

  const types = [...new Set(schemas.map(s => s.type).filter(Boolean))]

  // All same type
  if (types.length === 1) {
    const type = types[0]

    if (type === 'object') {
      return mergeObjectSchemas(schemas)
    }

    if (type === 'array') {
      const itemSchemas = schemas.map(s => s.items).filter(Boolean)
      return { type: 'array', items: mergeSchemas(itemSchemas) }
    }

    // Primitive — return with example from first non-null sample
    const withExample = schemas.find(s => s.example !== undefined)
    const base = { type }
    if (withExample)        base.example = withExample.example
    if (withExample?.format) base.format = withExample.format
    return base
  }

  // Mixed types — use oneOf
  return { oneOf: schemas }
}

function mergeObjectSchemas(schemas) {
  const allProperties = {}
  const requiredSets  = schemas.map(s => new Set(s.required ?? []))

  for (const schema of schemas) {
    for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
      if (!allProperties[key]) {
        allProperties[key] = []
      }
      allProperties[key].push(propSchema)
    }
  }

  const properties = {}
  for (const [key, propSchemas] of Object.entries(allProperties)) {
    properties[key] = mergeSchemas(propSchemas)
  }

  // A field is required only if it appeared in ALL samples
  const allKeys = Object.keys(allProperties)
  const required = allKeys.filter(key =>
    requiredSets.every(set => set.has(key))
  )

  return { type: 'object', properties, required }
}

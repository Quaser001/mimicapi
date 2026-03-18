import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { inferSchema, mergeSchemas } from '../schema-infer.js'

describe('inferSchema', () => {
  it('infers null', () => {
    assert.deepStrictEqual(inferSchema(null), { type: 'null' })
  })

  it('infers boolean', () => {
    const s = inferSchema(true)
    assert.equal(s.type, 'boolean')
    assert.equal(s.example, true)
  })

  it('infers integer', () => {
    const s = inferSchema(42)
    assert.equal(s.type, 'integer')
    assert.equal(s.example, 42)
  })

  it('infers number (float)', () => {
    const s = inferSchema(3.14)
    assert.equal(s.type, 'number')
    assert.equal(s.example, 3.14)
  })

  it('infers plain string', () => {
    const s = inferSchema('hello')
    assert.equal(s.type, 'string')
    assert.equal(s.example, 'hello')
    assert.equal(s.format, undefined)
  })

  it('detects email format', () => {
    const s = inferSchema('alice@example.com')
    assert.equal(s.format, 'email')
  })

  it('detects date-time format', () => {
    const s = inferSchema('2026-03-15T10:30:00Z')
    assert.equal(s.format, 'date-time')
  })

  it('detects date format', () => {
    const s = inferSchema('2026-03-15')
    assert.equal(s.format, 'date')
  })

  it('detects uri format', () => {
    const s = inferSchema('https://example.com')
    assert.equal(s.format, 'uri')
  })

  it('detects uuid format', () => {
    const s = inferSchema('550e8400-e29b-41d4-a716-446655440000')
    assert.equal(s.format, 'uuid')
  })

  it('infers empty array', () => {
    const s = inferSchema([])
    assert.equal(s.type, 'array')
    assert.deepStrictEqual(s.items, {})
  })

  it('infers array with items', () => {
    const s = inferSchema([1, 2, 3])
    assert.equal(s.type, 'array')
    assert.equal(s.items.type, 'integer')
  })

  it('infers object with properties', () => {
    const s = inferSchema({ name: 'Alice', age: 30 })
    assert.equal(s.type, 'object')
    assert.equal(s.properties.name.type, 'string')
    assert.equal(s.properties.age.type, 'integer')
    assert.deepStrictEqual(s.required, ['name', 'age'])
  })

  it('infers nested object', () => {
    const s = inferSchema({ user: { name: 'Alice', email: 'alice@test.com' } })
    assert.equal(s.properties.user.type, 'object')
    assert.equal(s.properties.user.properties.email.format, 'email')
  })
})

describe('mergeSchemas', () => {
  it('returns empty obj for empty input', () => {
    assert.deepStrictEqual(mergeSchemas([]), {})
  })

  it('returns single schema unchanged', () => {
    const s = { type: 'string', example: 'hello' }
    assert.deepStrictEqual(mergeSchemas([s]), s)
  })

  it('merges two object schemas — union of properties', () => {
    const a = inferSchema({ name: 'Alice', age: 30 })
    const b = inferSchema({ name: 'Bob',   city: 'NYC' })
    const merged = mergeSchemas([a, b])

    assert.equal(merged.type, 'object')
    assert.ok(merged.properties.name)
    assert.ok(merged.properties.age)
    assert.ok(merged.properties.city)

    // 'name' present in both → required; 'age' and 'city' only in one → not required
    assert.ok(merged.required.includes('name'))
    assert.ok(!merged.required.includes('age'))
    assert.ok(!merged.required.includes('city'))
  })

  it('merges mixed types into oneOf', () => {
    const a = inferSchema('hello')
    const b = inferSchema(42)
    const merged = mergeSchemas([a, b])
    assert.ok(merged.oneOf)
    assert.equal(merged.oneOf.length, 2)
  })
})

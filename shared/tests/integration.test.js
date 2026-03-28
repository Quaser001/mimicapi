import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { inferSchema, mergeSchemas } from '../schema-infer.js'
import { buildSpec, specToYAML }     from '../openapi-builder.js'
import yaml from 'js-yaml'

const FAKE_ENDPOINTS = [
  {
    method: 'GET',
    templatedUrl: 'https://api.example.com/users',
    samples: [
      {
        status: 200,
        responseBody: [
          { id: 1, name: 'Alice', email: 'alice@example.com', active: true },
          { id: 2, name: 'Bob',   email: 'bob@example.com',   active: false },
        ],
        responseHeaders: { 'content-type': 'application/json' },
        requestBody: null,
      }
    ]
  },
  {
    method: 'GET',
    templatedUrl: 'https://api.example.com/users/{userId}',
    samples: [
      {
        status: 200,
        responseBody: { id: 1, name: 'Alice', email: 'alice@example.com' },
        responseHeaders: { 'content-type': 'application/json' },
        requestBody: null,
      }
    ]
  },
  {
    method: 'POST',
    templatedUrl: 'https://api.example.com/users',
    samples: [
      {
        status: 201,
        responseBody: { id: 3, name: 'Charlie' },
        responseHeaders: { 'content-type': 'application/json' },
        requestBody: { name: 'Charlie', email: 'charlie@example.com' },
      }
    ]
  },
]

describe('end-to-end pipeline', () => {
  it('builds a valid spec from fake endpoints', () => {
    const spec = buildSpec('https://api.example.com', FAKE_ENDPOINTS)
    assert.strictEqual(spec.openapi, '3.0.3')
    assert.ok(spec.paths['/users'])
    assert.ok(spec.paths['/users/{userId}'])
    assert.ok(spec.paths['/users'].get)
    assert.ok(spec.paths['/users'].post)
    assert.strictEqual(spec.paths['/users'].post.responses['201'].description, 'Created')
  })

  it('serialises to valid YAML that parses back cleanly', () => {
    const spec     = buildSpec('https://api.example.com', FAKE_ENDPOINTS)
    const yamlStr  = specToYAML(spec)
    assert.ok(typeof yamlStr === 'string')
    assert.ok(yamlStr.length > 0)
    const parsed = yaml.load(yamlStr)
    assert.strictEqual(parsed.openapi, '3.0.3')
    assert.ok(parsed.paths)
  })

  it('infers array schema from list response', () => {
    const body   = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
    const schema = inferSchema(body)
    assert.strictEqual(schema.type, 'array')
    assert.strictEqual(schema.items.type, 'object')
    assert.ok(schema.items.properties.id)
    assert.ok(schema.items.properties.name)
  })

  it('path parameter extracted correctly', () => {
    const spec = buildSpec('https://api.example.com', FAKE_ENDPOINTS)
    const pathItem = spec.paths['/users/{userId}']
    assert.ok(pathItem)
    const params = pathItem.get.parameters
    assert.ok(Array.isArray(params))
    assert.ok(params.some(p => p.name === 'userId' && p.in === 'path'))
  })
})

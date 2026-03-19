import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildSpec, specToYAML } from '../openapi-builder.js'

describe('buildSpec', () => {
  it('produces valid OpenAPI 3.0.3 structure', () => {
    const endpoints = [
      {
        method: 'GET',
        templatedUrl: 'https://api.example.com/users',
        samples: [
          {
            status: 200,
            responseBody: [{ id: 1, name: 'Alice' }],
            responseHeaders: {},
            requestBody: null,
          },
        ],
      },
    ]

    const spec = buildSpec('https://api.example.com', endpoints)

    assert.equal(spec.openapi, '3.0.3')
    assert.ok(spec.info.title)
    assert.ok(spec.paths['/users'])
    assert.ok(spec.paths['/users'].get)
    assert.ok(spec.paths['/users'].get.responses['200'])
  })

  it('extracts path parameters', () => {
    const endpoints = [
      {
        method: 'GET',
        templatedUrl: 'https://api.example.com/users/{userId}/posts/{postId}',
        samples: [
          { status: 200, responseBody: { id: 1 }, responseHeaders: {}, requestBody: null },
        ],
      },
    ]

    const spec = buildSpec('https://api.example.com', endpoints)
    const op   = spec.paths['/users/{userId}/posts/{postId}'].get

    assert.ok(op.parameters)
    assert.equal(op.parameters.length, 2)
    assert.equal(op.parameters[0].name, 'userId')
    assert.equal(op.parameters[1].name, 'postId')
  })

  it('includes request body for POST endpoints', () => {
    const endpoints = [
      {
        method: 'POST',
        templatedUrl: 'https://api.example.com/users',
        samples: [
          {
            status: 201,
            responseBody: { id: 42, name: 'Bob' },
            responseHeaders: {},
            requestBody: { name: 'Bob', email: 'bob@test.com' },
          },
        ],
      },
    ]

    const spec = buildSpec('https://api.example.com', endpoints)
    const op   = spec.paths['/users'].post

    assert.ok(op.requestBody)
    assert.ok(op.requestBody.content['application/json'])
  })
})

describe('specToYAML', () => {
  it('serialises primitives', () => {
    assert.equal(specToYAML(null), 'null')
    assert.equal(specToYAML(true), 'true')
    assert.equal(specToYAML(42), '42')
    assert.equal(specToYAML('hello'), 'hello')
  })

  it('quotes strings with special chars', () => {
    const result = specToYAML('key: value')
    assert.ok(result.startsWith('"'))
  })

  it('serialises objects', () => {
    const yaml = specToYAML({ name: 'test', version: 1 })
    assert.ok(yaml.includes('name: test'))
    assert.ok(yaml.includes('version: 1'))
  })

  it('serialises arrays', () => {
    const yaml = specToYAML(['a', 'b', 'c'])
    assert.ok(yaml.includes('- a'))
    assert.ok(yaml.includes('- b'))
  })

  it('handles empty object and array', () => {
    assert.equal(specToYAML({}), '')
    assert.equal(specToYAML([]), '[]')
  })

  it('produces valid YAML for a full spec', () => {
    const spec = buildSpec('http://localhost', [
      {
        method: 'GET',
        templatedUrl: 'http://localhost/health',
        samples: [
          { status: 200, responseBody: { ok: true }, responseHeaders: {}, requestBody: null },
        ],
      },
    ])
    const yaml = specToYAML(spec)
    assert.ok(yaml.includes('openapi'))
    assert.ok(yaml.includes('/health'))
  })

  it('spec with empty schema serialises to parseable YAML', () => {
    // Simulate a spec that has an empty items schema (e.g. from an empty array capture)
    const spec = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/data': {
          get: {
            summary: 'GET /data',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { type: 'array', items: {} },
                  },
                },
              },
            },
          },
        },
      },
    }

    const yaml = specToYAML(spec)

    // The YAML should not contain '{}' as a value — that breaks block context parsing
    assert.ok(!yaml.includes(': {}'), 'YAML should not contain ": {}" inline syntax')

    // Verify it does not throw "a colon is missed" or similar when parsed
    // We do a basic structural check: it should contain the key path and schema type
    assert.ok(yaml.includes('/data'))
    assert.ok(yaml.includes('type: array'))
    assert.ok(yaml.includes('items:'))
  })
})

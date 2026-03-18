/**
 * MimicAPI — background/store.js
 *
 * In-memory capture store with endpoint deduplication and path templating.
 * No external dependencies — pure JS.
 *
 * Path templating: /users/42/posts/7 → /users/{userId}/posts/{postId}
 * Heuristic: a segment is a path param if it is:
 *   - entirely numeric
 *   - a UUID (8-4-4-4-12 hex)
 *   - longer than 20 chars with no dots (likely a hash or token)
 */

const MAX_CAPTURES  = 500
const MAX_SAMPLES   = 5   // response samples kept per endpoint for schema merging

function namedTemplatePath(urlString) {
  try {
    const u        = new URL(urlString)
    const segments = u.pathname.split('/')
    const out      = []

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      if (!seg) { out.push(seg); continue }

      const isNumeric = /^\d+$/.test(seg)
      const isUUID    = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)
      const isHash    = seg.length > 20 && !/\./.test(seg)

      if (isNumeric || isUUID || isHash) {
        const prev = out.slice().reverse().find(s => s && !s.startsWith('{'))
        const name = prev ? `${prev.replace(/s$/, '')}Id` : 'id'
        out.push(`{${name}}`)
      } else {
        out.push(seg)
      }
    }

    return u.origin + out.join('/')
  } catch {
    return urlString
  }
}

export class CaptureStore {
  constructor() {
    this._raw       = []          // Array<capture> ordered newest-first
    this._endpoints = new Map()   // Map<endpointKey, EndpointEntry>
  }

  add(message) {
    const {
      method, url,
      requestHeaders  = {},
      requestBody     = null,
      status,
      responseHeaders = {},
      responseBody    = null,
      duration        = 0,
      timestamp       = Date.now(),
    } = message

    const templatedUrl = namedTemplatePath(url)
    const endpointKey  = `${method}::${templatedUrl}`

    const entry = {
      id: crypto.randomUUID(),
      method, url, templatedUrl, endpointKey,
      requestHeaders, requestBody,
      status, responseHeaders, responseBody,
      duration, timestamp,
    }

    // Raw list — cap size
    this._raw.unshift(entry)
    if (this._raw.length > MAX_CAPTURES) this._raw.pop()

    // Deduplicated endpoint map
    if (!this._endpoints.has(endpointKey)) {
      this._endpoints.set(endpointKey, { method, templatedUrl, samples: [] })
    }
    const ep = this._endpoints.get(endpointKey)
    if (ep.samples.length < MAX_SAMPLES) {
      ep.samples.push({ url, status, responseBody, responseHeaders, requestBody })
    }

    return entry
  }

  getAll()       { return this._raw }
  getEndpoints() { return [...this._endpoints.values()] }
  size()         { return this._raw.length }
  clear()        { this._raw = []; this._endpoints.clear() }
}

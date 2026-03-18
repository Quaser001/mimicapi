/**
 * MimicAPI — content/interceptor.js
 *
 * Runs in MAIN world at document_start — before ANY page script executes.
 * Patches window.fetch and XMLHttpRequest to capture every request/response.
 * Relays captures via CustomEvent to bridge.js (isolated world).
 *
 * Zero proprietary dependencies. Pure browser APIs only.
 */

;(function () {
  'use strict'

  if (window.__mimicapi_patched) return
  window.__mimicapi_patched = true

  // ─── Utilities ──────────────────────────────────────────────────────────────

  function parseBody(raw) {
    if (raw === null || raw === undefined || raw === '') return null
    if (typeof raw !== 'string') return raw
    try { return JSON.parse(raw) } catch { return raw }
  }

  function headersToObject(headers) {
    if (!headers) return {}
    if (headers instanceof Headers) {
      const obj = {}
      headers.forEach((v, k) => { obj[k.toLowerCase()] = v })
      return obj
    }
    if (typeof headers === 'string') {
      return headers.trim().split(/\r?\n/).reduce((acc, line) => {
        const sep = line.indexOf(':')
        if (sep > 0) acc[line.slice(0, sep).trim().toLowerCase()] = line.slice(sep + 1).trim()
        return acc
      }, {})
    }
    // Plain object (fetch init.headers)
    if (typeof headers === 'object') {
      const obj = {}
      for (const [k, v] of Object.entries(headers)) obj[k.toLowerCase()] = v
      return obj
    }
    return {}
  }

  async function serialiseRequestBody(body) {
    if (body === null || body === undefined) return null
    if (typeof body === 'string')           return parseBody(body)
    if (body instanceof URLSearchParams)    return body.toString()
    if (body instanceof FormData) {
      const obj = {}
      body.forEach((v, k) => { if (typeof v === 'string') obj[k] = v })
      return obj
    }
    if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      try { return parseBody(new TextDecoder().decode(body)) } catch { return '[binary]' }
    }
    if (body instanceof Blob) {
      try { return parseBody(await body.text()) } catch { return '[blob]' }
    }
    return '[unsupported body type]'
  }

  async function readResponseBody(response) {
    try {
      const clone = response.clone()
      const ct = (response.headers.get('content-type') || '').toLowerCase()
      if (ct.includes('application/json'))  return await clone.json()
      if (ct.includes('text/'))             return await clone.text()
      return '[binary or unknown content-type]'
    } catch {
      return '[could not read response body]'
    }
  }

  function shouldSkip(url) {
    if (!url) return true
    return (
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('chrome://')
    )
  }

  function relay(capture) {
    if (shouldSkip(capture.url)) return
    try {
      window.dispatchEvent(
        new CustomEvent('__mimicapi_capture__', { detail: capture })
      )
    } catch { /* restricted iframe — drop silently */ }
  }

  // ─── fetch patch ────────────────────────────────────────────────────────────

  const _fetch = window.fetch.bind(window)

  window.fetch = async function mimicFetch(input, init = {}) {
    const t0 = Date.now()

    const url =
      typeof input === 'string' ? input :
      input instanceof URL      ? input.href :
      input instanceof Request  ? input.url :
      String(input)

    const method = (
      (init?.method) ||
      (input instanceof Request ? input.method : 'GET')
    ).toUpperCase()

    const reqHeaders = headersToObject(
      init?.headers ?? (input instanceof Request ? input.headers : undefined)
    )

    const [response, reqBody] = await Promise.all([
      _fetch(input, init),
      serialiseRequestBody(init?.body),
    ])

    const duration    = Date.now() - t0
    const resHeaders  = headersToObject(response.headers)
    const resBody     = await readResponseBody(response)

    relay({
      type:            'MIMICAPI_CAPTURE',
      method,
      url,
      requestHeaders:  reqHeaders,
      requestBody:     reqBody,
      status:          response.status,
      responseHeaders: resHeaders,
      responseBody:    resBody,
      duration,
      timestamp:       t0,
    })

    return response
  }

  // ─── XMLHttpRequest patch ────────────────────────────────────────────────────

  const _open      = XMLHttpRequest.prototype.open
  const _send      = XMLHttpRequest.prototype.send
  const _setHeader = XMLHttpRequest.prototype.setRequestHeader

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__mimic = { method: method.toUpperCase(), url, requestHeaders: {}, t0: null }
    return _open.call(this, method, url, ...rest)
  }

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this.__mimic) this.__mimic.requestHeaders[name.toLowerCase()] = value
    return _setHeader.call(this, name, value)
  }

  XMLHttpRequest.prototype.send = function (body) {
    if (this.__mimic) {
      this.__mimic.t0 = Date.now()

      this.addEventListener('loadend', () => {
        if (!this.__mimic) return
        const { method, url, requestHeaders, t0 } = this.__mimic
        const resHeaders = headersToObject(this.getAllResponseHeaders())
        const ct = (resHeaders['content-type'] || '').toLowerCase()

        let resBody
        if (ct.includes('application/json')) {
          try { resBody = JSON.parse(this.responseText) }
          catch { resBody = this.responseText }
        } else if (ct.includes('text/')) {
          resBody = this.responseText
        } else {
          resBody = '[binary or unknown content-type]'
        }

        let reqBody = null
        if (body != null) {
          if (typeof body === 'string') reqBody = parseBody(body)
          else if (body instanceof URLSearchParams) reqBody = body.toString()
          else if (body instanceof FormData) {
            const obj = {}
            body.forEach((v, k) => { if (typeof v === 'string') obj[k] = v })
            reqBody = obj
          } else { reqBody = '[binary body]' }
        }

        relay({
          type:            'MIMICAPI_CAPTURE',
          method,
          url,
          requestHeaders,
          requestBody:     reqBody,
          status:          this.status,
          responseHeaders: resHeaders,
          responseBody:    resBody,
          duration:        Date.now() - t0,
          timestamp:       t0,
        })
      })
    }
    return _send.call(this, body)
  }

})()

/**
 * MimicAPI — background/service-worker.js
 *
 * Receives captures from bridge.js and serves data to the devtools panel.
 *
 * Message protocol:
 *   IN  MIMICAPI_CAPTURE    → store capture, broadcast to panel
 *   IN  MIMICAPI_GET_ALL    → return { captures, endpoints, recording }
 *   IN  MIMICAPI_CLEAR      → wipe store
 *   IN  MIMICAPI_RECORDING  → { enabled: bool } toggle recording
 *   IN  MIMICAPI_BUILD_SPEC → build OpenAPI spec from captured endpoints
 *   OUT MIMICAPI_NEW_ENTRY  → broadcast to panel on each new capture
 */

import { CaptureStore }          from './store.js'
import { buildSpec, specToYAML } from './openapi-builder.js'

const store   = new CaptureStore()
let recording = true

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type) return

  switch (message.type) {

    case 'MIMICAPI_CAPTURE': {
      if (!recording) break
      const entry = store.add(message)
      chrome.runtime.sendMessage({
        type:  'MIMICAPI_NEW_ENTRY',
        entry,
        total: store.size(),
      }).catch(() => {})
      break
    }

    case 'MIMICAPI_GET_ALL':
      sendResponse({
        captures:  store.getAll(),
        endpoints: store.getEndpoints(),
        recording,
      })
      return true

    case 'MIMICAPI_CLEAR':
      store.clear()
      sendResponse({ ok: true })
      return true

    case 'MIMICAPI_RECORDING':
      recording = message.enabled ?? !recording
      sendResponse({ recording })
      return true

    case 'MIMICAPI_BUILD_SPEC': {
      const endpoints = store.getEndpoints()
      if (endpoints.length === 0) {
        sendResponse({ spec: null, error: 'No captured endpoints yet — browse a site first.' })
        return true
      }
      const all    = store.getAll()
      const oldest = all[all.length - 1]
      let baseUrl  = 'http://localhost'
      try { baseUrl = new URL(oldest?.url ?? '').origin } catch { /* use default */ }

      const specObj  = buildSpec(baseUrl, endpoints)
      const specYaml = specToYAML(specObj)
      sendResponse({ spec: specYaml, specObj })
      return true
    }
  }
})

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-recording') {
    recording = !recording
    chrome.runtime.sendMessage({
      type:      'MIMICAPI_RECORDING_CHANGED',
      recording,
    }).catch(() => {})
  }
})

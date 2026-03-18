/**
 * MimicAPI — content/bridge.js
 *
 * Runs in the default ISOLATED content-script world.
 * Listens for CustomEvents fired by interceptor.js (MAIN world)
 * and forwards them to the background service worker via chrome.runtime.
 *
 * This two-file pattern is required by Chrome MV3:
 * MAIN world scripts cannot call chrome.runtime directly.
 */

window.addEventListener('__mimicapi_capture__', (event) => {
  const capture = event.detail
  if (!capture || typeof capture !== 'object') return

  chrome.runtime.sendMessage(capture).catch(() => {
    // Background SW may be sleeping — next user action will wake it.
  })
})

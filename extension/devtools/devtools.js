/**
 * MimicAPI — devtools/devtools.js
 * Creates the MimicAPI panel inside Chrome DevTools.
 */
chrome.devtools.panels.create(
  'MimicAPI',
  '/icons/icon16.png',
  '/devtools/panel/dist/index.html',
  (_panel) => { /* panel created */ }
)

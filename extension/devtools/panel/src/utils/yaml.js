/**
 * MimicAPI — shared panel YAML serialiser
 *
 * Lightweight YAML serialiser for OpenAPI spec objects.
 * Extracted from SpecViewer.jsx and MockControls.jsx to avoid duplication.
 * Handles: string, number, boolean, null, array, object.
 * No external dependencies.
 */

export function toSimpleYAML(obj, indent = 0) {
  const pad = '  '.repeat(indent)

  if (obj === null || obj === undefined) return 'null'
  if (typeof obj === 'boolean') return String(obj)
  if (typeof obj === 'number')  return String(obj)

  if (typeof obj === 'string') {
    const needs =
      /[:#\[\]{},&*?|<>=!%@`\n]/.test(obj) ||
      /^(true|false|null|yes|no|on|off)$/i.test(obj) ||
      /^\d/.test(obj)
    return needs ? `"${obj.replace(/"/g, '\\"')}"` : obj
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    return obj.map(item => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        return `${pad}-\n${toSimpleYAML(item, indent + 1)}`
      }
      return `${pad}- ${toSimpleYAML(item, indent)}`
    }).join('\n')
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined)
    if (entries.length === 0) return '{}'
    return entries.map(([k, v]) => {
      const yk = /[^a-zA-Z0-9_\-/{}]/.test(k) ? `"${k}"` : k
      if (v === null || typeof v !== 'object') return `${pad}${yk}: ${toSimpleYAML(v, indent)}`
      if (Array.isArray(v) && v.length === 0)  return `${pad}${yk}: []`
      return `${pad}${yk}:\n${toSimpleYAML(v, indent + 1)}`
    }).join('\n')
  }

  return String(obj)
}

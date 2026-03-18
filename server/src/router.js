/**
 * MimicAPI — server/src/router.js
 * Builds Express router from OpenAPI 3.0 spec.
 * Logs every request to the shared requestLog array for the dashboard.
 */

import express           from 'express'
import { buildResponder } from './responder.js'

export function buildRouter(spec, requestLog, port) {
  const router = express.Router()
  const paths  = spec?.paths ?? {}

  for (const [specPath, methods] of Object.entries(paths)) {
    const expressPath = specPath.replace(/\{([^}]+)\}/g, ':$1')

    for (const [method, operation] of Object.entries(methods)) {
      const verb      = method.toLowerCase()
      const validVerbs = ['get','post','put','patch','delete','head','options']
      if (!validVerbs.includes(verb)) continue

      const responder = buildResponder(operation)

      router[verb](expressPath, (req, res) => {
        const t0                   = Date.now()
        const { status, headers, body } = responder(req)

        res.status(status)
        for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)

        if (body === null || body === undefined) res.end()
        else if (typeof body === 'object')       res.json(body)
        else                                     res.send(String(body))

        // Log to dashboard
        if (requestLog) {
          const d = new Date()
          requestLog.unshift({
            time:   `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`,
            method: method.toUpperCase(),
            path:   req.path,
            status,
            dur:    Date.now() - t0,
          })
          if (requestLog.length > 200) requestLog.pop()
        }
      })

      console.log(`  [mock]  ${method.toUpperCase().padEnd(7)} ${expressPath}`)
    }
  }

  return { router }
}

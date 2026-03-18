/**
 * MimicAPI — server/src/index.js
 *
 * CLI entry point. No proprietary services.
 * Usage: node src/index.js serve path/to/spec.yaml --port 3001
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { program }       from 'commander'
import express           from 'express'
import yaml              from 'js-yaml'
import { buildRouter }   from './router.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// In-memory request log for dashboard
const requestLog = []
const MAX_LOG = 200

program
  .name('mimicapi')
  .description('Serve a local mock from an OpenAPI 3.0 spec captured by MimicAPI')
  .version('0.1.0')

program
  .command('serve <specFile>')
  .description('Start the mock server from a YAML or JSON spec file')
  .option('-p, --port <number>', 'Port to listen on', '3001')
  .option('--host <host>',       'Host to bind to',   'localhost')
  .action((specFile, options) => {
    const port = parseInt(options.port, 10)
    const host = options.host

    // ── Read spec file with helpful error ──────────────────────────────────
    const specPath = resolve(process.cwd(), specFile)
    if (!existsSync(specPath)) {
      console.error(`\n  Error: cannot read spec file '${specFile}'.`)
      console.error(`  Make sure the path is correct and the file exists.`)
      console.error(`  Resolved path: ${specPath}\n`)
      process.exit(1)
    }

    let raw
    try {
      raw = readFileSync(specPath, 'utf8')
    } catch (e) {
      console.error(`\n  Error: cannot read spec file '${specFile}'.`)
      console.error(`  ${e.message}\n`)
      process.exit(1)
    }

    let spec
    try {
      spec = specFile.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw)
    } catch (e) {
      console.error(`\n  Error: failed to parse spec file '${specFile}'.`)
      console.error(`  ${e.message}\n`)
      process.exit(1)
    }

    let routes = buildRouteList(spec)
    let specYaml = raw   // Track current raw YAML for /__mimicapi/spec

    const app = express()
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(express.text({ type: '*/*' }))

    // CORS — allow any local frontend
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin',  '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
      if (req.method === 'OPTIONS') return res.sendStatus(204)
      next()
    })

    // ── Dashboard static file ────────────────────────────────────────────────
    app.get('/dashboard', (_req, res) => {
      res.sendFile(resolve(__dirname, 'public/dashboard.html'))
    })

    // ── Dashboard API ────────────────────────────────────────────────────────
    app.get('/__mimicapi/info', (_req, res) => {
      res.json({
        title:  spec?.info?.title ?? 'MimicAPI spec',
        port,
        routes: routes.map(r => ({ method: r.method, path: r.path, status: r.status })),
      })
    })

    app.get('/__mimicapi/spec', (_req, res) => {
      res.setHeader('content-type', 'text/plain')
      res.send(specYaml)
    })

    app.get('/__mimicapi/log', (_req, res) => {
      res.json({ entries: requestLog })
    })

    app.post('/__mimicapi/import', (req, res) => {
      try {
        const newSpec  = yaml.load(req.body)
        spec           = newSpec
        routes         = buildRouteList(newSpec)
        specYaml       = req.body

        // Hot-reload: rebuild mock routes
        const { router: newRouter } = buildRouter(newSpec, requestLog, port)
        mockRouter = newRouter
        console.log('  [import] Routes reloaded from imported spec')

        res.json({ ok: true, routes: routes.length })
      } catch (e) {
        res.status(400).json({ ok: false, error: e.message })
      }
    })

    // ── Request logger middleware ────────────────────────────────────────────
    app.use((req, _res_ignored, next) => {
      req.__t0 = Date.now()
      next()
    })

    // Mount mock routes from spec via a sub-router
    let mockRouter = buildRouter(spec, requestLog, port).router
    app.use((req, res, next) => {
      // Delegate to current mockRouter (swappable for hot-reload)
      mockRouter(req, res, next)
    })

    // 404 catch-all
    app.use((req, res) => {
      res.status(404).json({
        error:   'Route not found in spec',
        message: `No mock for ${req.method} ${req.path}`,
        hint:    'Capture more traffic or check the dashboard at /dashboard',
      })
    })

    app.listen(port, host, () => {
      const url = `http://${host}:${port}`
      console.log(`\n  MimicAPI mock server running`)
      console.log(`  ➜  Mock:      ${url}`)
      console.log(`  ➜  Dashboard: ${url}/dashboard`)
      console.log(`  ➜  Spec:      ${specFile}`)
      console.log(`  ➜  Routes:    ${routes.length} endpoints\n`)
    })
  })

program.parse()

function buildRouteList(spec) {
  const list = []
  for (const [path, methods] of Object.entries(spec?.paths ?? {})) {
    for (const [method, op] of Object.entries(methods)) {
      const statusCodes = Object.keys(op.responses ?? { '200': {} }).map(Number).filter(n => !isNaN(n))
      const status = statusCodes.find(c => c >= 200 && c < 300) ?? statusCodes[0] ?? 200
      list.push({ method: method.toUpperCase(), path, status })
    }
  }
  return list
}


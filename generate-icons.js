#!/usr/bin/env node
/**
 * generate-icons.js
 * Run once: node generate-icons.js
 * Creates valid PNG icons for Chrome MV3 extension.
 * Pure JS — no native dependencies.
 */
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname }         from 'path'
import { fileURLToPath }            from 'url'
import { deflateSync }              from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconDir   = resolve(__dirname, 'extension/icons')
mkdirSync(iconDir, { recursive: true })

/* ── Minimal PNG encoder ────────────────────────────────────────────────────── */

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const typeData = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typeData))
  return Buffer.concat([len, typeData, crc])
}

function createPNG(width, height, rgba) {
  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // RGBA
  ihdr[10] = ihdr[11] = ihdr[12] = 0

  // IDAT — filter byte 0 (None) per row, then deflate
  const rowLen = width * 4 + 1
  const raw = Buffer.alloc(rowLen * height)
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0 // filter: None
    rgba.copy(raw, y * rowLen + 1, y * width * 4, (y + 1) * width * 4)
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ── Draw icon ──────────────────────────────────────────────────────────────── */

function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4)

  // Rounded-rect radius
  const r = Math.round(size * 0.2)

  // Purple fill: #7c6ff7
  const R = 0x7c, G = 0x6f, B = 0xf7

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4

      // Simple rounded-rect check
      let inside = true
      if (x < r && y < r)                             inside = (x - r) ** 2 + (y - r) ** 2 <= r * r
      else if (x >= size - r && y < r)                inside = (x - (size - r - 1)) ** 2 + (y - r) ** 2 <= r * r
      else if (x < r && y >= size - r)                inside = (x - r) ** 2 + (y - (size - r - 1)) ** 2 <= r * r
      else if (x >= size - r && y >= size - r)        inside = (x - (size - r - 1)) ** 2 + (y - (size - r - 1)) ** 2 <= r * r

      if (inside) {
        rgba[i]     = R
        rgba[i + 1] = G
        rgba[i + 2] = B
        rgba[i + 3] = 255
      } else {
        rgba[i] = rgba[i + 1] = rgba[i + 2] = rgba[i + 3] = 0
      }
    }
  }

  // Draw a simple "M" in white — using a basic bitmap approach
  drawM(rgba, size)

  return createPNG(size, size, rgba)
}

function drawM(rgba, size) {
  const s = size
  // M letter bounds: roughly center 60% of icon
  const left   = Math.round(s * 0.22)
  const right  = Math.round(s * 0.78)
  const top    = Math.round(s * 0.25)
  const bottom = Math.round(s * 0.75)
  const w = Math.max(Math.round(s * 0.12), 1) // stroke width
  const midX   = Math.round(s / 2)

  function setPixel(x, y) {
    if (x < 0 || x >= s || y < 0 || y >= s) return
    const i = (y * s + x) * 4
    rgba[i] = rgba[i + 1] = rgba[i + 2] = 255 // white
    rgba[i + 3] = 255
  }

  function fillRect(x0, y0, x1, y1) {
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++)
        setPixel(xx, yy)
  }

  // Left vertical stroke
  fillRect(left, top, left + w - 1, bottom)
  // Right vertical stroke
  fillRect(right - w + 1, top, right, bottom)

  // Left diagonal (top-left to center)
  for (let yy = top; yy <= Math.round((top + bottom) / 2); yy++) {
    const progress = (yy - top) / ((bottom - top) / 2)
    const xx = Math.round(left + w + progress * (midX - left - w))
    fillRect(xx, yy, xx + w - 1, yy)
  }

  // Right diagonal (top-right to center)
  for (let yy = top; yy <= Math.round((top + bottom) / 2); yy++) {
    const progress = (yy - top) / ((bottom - top) / 2)
    const xx = Math.round(right - w - progress * (right - w - midX))
    fillRect(xx, yy, xx + w - 1, yy)
  }
}

/* ── Generate ───────────────────────────────────────────────────────────────── */

for (const size of [16, 48, 128]) {
  const png = drawIcon(size)
  writeFileSync(resolve(iconDir, `icon${size}.png`), png)
  console.log(`Created icon${size}.png (${png.length} bytes)`)
}

console.log('\n✓ PNG icons ready for Chrome extension\n')

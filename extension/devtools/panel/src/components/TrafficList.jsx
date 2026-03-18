import React, { useState } from 'react'
import styles from './TrafficList.module.css'

const METHOD_COLORS = {
  GET:     { bg: 'var(--teal-bg)',   text: 'var(--teal)'   },
  POST:    { bg: 'var(--purple-bg)', text: 'var(--purple)' },
  PUT:     { bg: 'var(--amber-bg)',  text: 'var(--amber)'  },
  PATCH:   { bg: 'var(--amber-bg)',  text: 'var(--amber)'  },
  DELETE:  { bg: 'var(--red-bg)',    text: 'var(--red)'    },
  HEAD:    { bg: 'var(--bg2)',       text: 'var(--text1)'  },
  OPTIONS: { bg: 'var(--bg2)',       text: 'var(--text1)'  },
}

function statusColor(code) {
  if (!code) return 'var(--text2)'
  if (code < 300) return 'var(--teal)'
  if (code < 400) return 'var(--amber)'
  return 'var(--red)'
}

function shortPath(url) {
  try {
    const u = new URL(url)
    return u.pathname + (u.search || '')
  } catch {
    return url
  }
}

function hostname(url) {
  try { return new URL(url).hostname } catch { return '' }
}

export default function TrafficList({ captures, selected, onSelect }) {
  const [filter, setFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')

  const filtered = captures.filter(c => {
    const matchMethod = methodFilter === 'ALL' || c.method === methodFilter
    const matchText   = !filter ||
      c.url.toLowerCase().includes(filter.toLowerCase()) ||
      String(c.status).includes(filter)
    return matchMethod && matchText
  })

  return (
    <div className={styles.root}>
      {/* Left: list */}
      <div className={styles.list}>
        <div className={styles.toolbar}>
          <input
            className={styles.search}
            placeholder="Filter by URL, status…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <select
            className={styles.methodSelect}
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
          >
            {['ALL','GET','POST','PUT','PATCH','DELETE'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            {captures.length === 0
              ? 'No captures yet — browse a site to start recording.'
              : 'No requests match the filter.'}
          </div>
        )}

        {filtered.map(c => {
          const mc = METHOD_COLORS[c.method] ?? METHOD_COLORS.GET
          return (
            <div
              key={c.id}
              className={`${styles.row} ${selected?.id === c.id ? styles.rowActive : ''}`}
              onClick={() => onSelect(c)}
            >
              <span className={styles.method} style={{ background: mc.bg, color: mc.text }}>
                {c.method}
              </span>
              <div className={styles.rowMeta}>
                <span className={styles.path}>{shortPath(c.url)}</span>
                <span className={styles.host}>{hostname(c.url)}</span>
              </div>
              <div className={styles.rowRight}>
                <span style={{ color: statusColor(c.status) }}>{c.status}</span>
                <span className={styles.dur}>{c.duration}ms</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Right: detail */}
      <div className={styles.detail}>
        {selected
          ? <CaptureDetail capture={selected} />
          : <div className={styles.empty}>Select a request to inspect it.</div>
        }
      </div>
    </div>
  )
}

function CaptureDetail({ capture }) {
  const [tab, setTab] = useState('response')
  const tabs = ['response', 'request', 'headers']

  return (
    <div className={styles.detailInner}>
      <div className={styles.detailUrl}>
        <span
          className={styles.method}
          style={{
            background: (METHOD_COLORS[capture.method] ?? METHOD_COLORS.GET).bg,
            color:      (METHOD_COLORS[capture.method] ?? METHOD_COLORS.GET).text,
          }}
        >
          {capture.method}
        </span>
        <span className={styles.detailUrlText}>{capture.url}</span>
      </div>

      <div className={styles.detailTabs}>
        {tabs.map(t => (
          <button
            key={t}
            className={`${styles.dtab} ${tab === t ? styles.dtabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={styles.detailBody}>
        {tab === 'response' && (
          <JsonBlock data={capture.responseBody} label={`Status: ${capture.status}`} />
        )}
        {tab === 'request' && (
          <JsonBlock data={capture.requestBody} label="Request body" />
        )}
        {tab === 'headers' && (
          <div>
            <HeaderTable title="Request headers" headers={capture.requestHeaders} />
            <HeaderTable title="Response headers" headers={capture.responseHeaders} />
          </div>
        )}
      </div>
    </div>
  )
}

function JsonBlock({ data, label }) {
  const text = data == null
    ? '(empty)'
    : typeof data === 'string'
      ? data
      : JSON.stringify(data, null, 2)

  const copy = () => navigator.clipboard.writeText(text)

  return (
    <div>
      <div className={styles.blockHeader}>
        <span className={styles.blockLabel}>{label}</span>
        <button className={styles.copyBtn} onClick={copy}>Copy</button>
      </div>
      <pre className={styles.pre}>{text}</pre>
    </div>
  )
}

function HeaderTable({ title, headers }) {
  const entries = Object.entries(headers ?? {})
  return (
    <div style={{ marginBottom: 16 }}>
      <div className={styles.blockLabel} style={{ marginBottom: 6 }}>{title}</div>
      {entries.length === 0
        ? <span className={styles.empty}>None</span>
        : (
          <table className={styles.headerTable}>
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k}>
                  <td className={styles.hKey}>{k}</td>
                  <td className={styles.hVal}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  )
}

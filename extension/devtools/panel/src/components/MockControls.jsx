import React, { useState } from 'react'
import { toSimpleYAML } from '../utils/yaml.js'
import styles from './MockControls.module.css'

export default function MockControls({ spec }) {
  const [port,    setPort]    = useState('3001')
  const [running, setRunning] = useState(false)
  const [copied,  setCopied]  = useState(false)

  const url = `http://localhost:${port}`

  const handleDownloadAndRun = () => {
    if (!spec) return

    // Build YAML for download
    const yaml  = typeof spec === 'string' ? spec : toSimpleYAML(spec)
    const blob  = new Blob([yaml], { type: 'text/yaml' })
    const a     = document.createElement('a')
    a.href      = URL.createObjectURL(blob)
    a.download  = 'mimicapi-spec.yaml'
    a.click()
    URL.revokeObjectURL(a.href)

    setRunning(true)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <span className={styles.label}>Mock server</span>

        <div className={styles.portRow}>
          <span className={styles.portLabel}>Port</span>
          <input
            className={styles.portInput}
            type="number"
            min="1024"
            max="65535"
            value={port}
            onChange={e => setPort(e.target.value)}
          />
        </div>

        <div className={styles.urlRow}>
          <code className={styles.url}>{url}</code>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button
          className={running ? styles.btnRunning : styles.btnStart}
          onClick={handleDownloadAndRun}
          disabled={!spec}
          title="Downloads spec.yaml + shows the CLI command to start the server"
        >
          {running ? '✓ spec downloaded' : 'Download spec + start server'}
        </button>
      </div>

      {running && (
        <div className={styles.hint}>
          <span className={styles.hintTitle}>Run in your terminal:</span>
          <code className={styles.cmd}>
            npx mimicapi serve mimicapi-spec.yaml --port {port}
          </code>
        </div>
      )}
    </div>
  )
}

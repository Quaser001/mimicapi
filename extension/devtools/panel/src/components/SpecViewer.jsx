import React, { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-yaml'
import { toSimpleYAML } from '../utils/yaml.js'
import styles from './SpecViewer.module.css'

export default function SpecViewer({ spec, specObj }) {
  const codeRef = useRef(null)

  const yaml = spec
    ? typeof spec === 'string'
      ? spec
      : toSimpleYAML(spec)
    : null

  // Apply Prism highlighting after render
  useEffect(() => {
    if (codeRef.current && yaml) {
      codeRef.current.textContent = yaml
      Prism.highlightElement(codeRef.current)
    }
  }, [yaml])

  const copySpec = () => {
    if (yaml) navigator.clipboard.writeText(yaml)
  }

  const downloadSpec = () => {
    if (!yaml) return
    const blob = new Blob([yaml], { type: 'text/yaml' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = 'mimicapi-spec.yaml'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const downloadJson = () => {
    if (!specObj && !spec) return
    const obj = specObj ?? {}
    const json = JSON.stringify(obj, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = 'mimicapi-spec.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!yaml) {
    return (
      <div className={styles.empty}>
        No spec yet — capture some traffic then click <strong>Build spec</strong>.
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <span className={styles.label}>OpenAPI 3.0.3</span>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={copySpec}>Copy YAML</button>
          <button className={styles.btnPrimary} onClick={downloadSpec}>Download .yaml</button>
          <button className={styles.btn} onClick={downloadJson}>Download .json</button>
        </div>
      </div>
      <pre className={styles.pre}>
        <code ref={codeRef} className="language-yaml">{yaml}</code>
      </pre>
    </div>
  )
}

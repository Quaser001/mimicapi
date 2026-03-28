import React, { useState, useEffect, useCallback } from 'react'
import TrafficList   from './components/TrafficList.jsx'
import SpecViewer    from './components/SpecViewer.jsx'
import MockControls  from './components/MockControls.jsx'
import styles        from './App.module.css'

// Chrome runtime bridge — works in extension, falls back for dev
const runtime = typeof chrome !== 'undefined' && chrome.runtime

function sendMsg(msg) {
  return new Promise((resolve) => {
    if (!runtime) return resolve(null)
    runtime.sendMessage(msg, resolve)
  })
}

export default function App() {
  const [captures,   setCaptures]   = useState([])
  const [spec,       setSpec]       = useState(null)
  const [specObj,    setSpecObj]    = useState(null)
  const [recording,  setRecording]  = useState(true)
  const [activeTab,  setActiveTab]  = useState('traffic')  // 'traffic' | 'spec'
  const [selected,   setSelected]   = useState(null)

  // Load existing captures on mount
  useEffect(() => {
    sendMsg({ type: 'MIMICAPI_GET_ALL' }).then((res) => {
      if (!res) return
      setCaptures(res.captures ?? [])
      setRecording(res.recording ?? true)
      if (res.spec) setSpec(res.spec)
    })
  }, [])

  // Listen for live new entries from background SW
  useEffect(() => {
    if (!runtime) return
    const handler = (message) => {
      if (message.type === 'MIMICAPI_NEW_ENTRY') {
        setCaptures(prev => [message.entry, ...prev])
      }
      if (message.type === 'MIMICAPI_RECORDING_CHANGED') {
        setRecording(message.recording)
      }
      if (message.type === 'MIMICAPI_SPEC_UPDATED') {
        setSpec(message.spec)
      }
    }
    runtime.onMessage.addListener(handler)
    return () => runtime.onMessage.removeListener(handler)
  }, [])

  const handleClear = useCallback(async () => {
    await sendMsg({ type: 'MIMICAPI_CLEAR' })
    setCaptures([])
    setSpec(null)
    setSelected(null)
  }, [])

  const handleToggleRecording = useCallback(async () => {
    const res = await sendMsg({ type: 'MIMICAPI_RECORDING', enabled: !recording })
    if (res) setRecording(res.recording)
  }, [recording])

  const handleBuildSpec = useCallback(async () => {
    const res = await sendMsg({ type: 'MIMICAPI_BUILD_SPEC' })
    if (res?.spec) {
      setSpec(res.spec)
      setSpecObj(res.specObj ?? null)
      setActiveTab('spec')
    }
  }, [])

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>M</span>
          <span className={styles.logoName}>MimicAPI</span>
          <span className={styles.count}>{captures.length} captures</span>
        </div>

        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'traffic' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('traffic')}
          >
            Traffic
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'spec' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('spec')}
          >
            OpenAPI spec
            {spec && <span className={styles.dot} />}
          </button>
        </nav>

        <div className={styles.actions}>
          <button
            className={recording ? styles.btnRed : styles.btnGreen}
            onClick={handleToggleRecording}
            title={recording ? 'Pause recording' : 'Resume recording'}
          >
            {recording ? '⏸ Pause' : '▶ Record'}
          </button>
          <button className={styles.btnPurple} onClick={handleBuildSpec} disabled={captures.length === 0}>
            Build spec
          </button>
          <button className={styles.btnGhost} onClick={handleClear} disabled={captures.length === 0}>
            Clear
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className={styles.body}>
        {activeTab === 'traffic' && (
          <TrafficList
            captures={captures}
            selected={selected}
            onSelect={setSelected}
          />
        )}
        {activeTab === 'spec' && (
          <div className={styles.specBody}>
            <SpecViewer spec={spec} specObj={specObj} />
            <MockControls spec={spec} />
          </div>
        )}
      </div>
    </div>
  )
}

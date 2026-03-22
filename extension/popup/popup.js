let isRecording = true

function sendMsg(type, data = {}) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type, ...data }, resolve)
  })
}

async function refresh() {
  const res = await sendMsg('MIMICAPI_GET_ALL')
  if (!res) return

  isRecording = res.recording ?? true
  const count = (res.captures ?? []).length

  document.getElementById('captureCount').textContent = count
  document.getElementById('statusLabel').textContent =
    isRecording ? 'Recording' : 'Paused'
  document.getElementById('dot').className =
    'dot ' + (isRecording ? 'dot-on' : 'dot-off')
  document.getElementById('toggleBtn').textContent =
    isRecording ? 'Pause recording' : 'Resume recording'
}

document.getElementById('toggleBtn').addEventListener('click', async () => {
  await sendMsg('MIMICAPI_RECORDING', { enabled: !isRecording })
  await refresh()
})

document.getElementById('clearBtn').addEventListener('click', async () => {
  await sendMsg('MIMICAPI_CLEAR')
  await refresh()
})

refresh()

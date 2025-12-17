import { useState, useRef } from 'react'
import './App.css'
import Ranking from './components/Ranking'

type Output = { id: string; model?: string; text: string }

export default function App() {
  const [videoUrl, setVideoUrl] = useState('')
  const [videoFileUrl, setVideoFileUrl] = useState<string | null>(null)
  const [outputs, setOutputs] = useState<Output[]>([])

  const [jsonEntries, setJsonEntries] = useState<any[] | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null)
  const [promptText, setPromptText] = useState<string | null>(null)
  const [groundTruth, setGroundTruth] = useState<string | null>(null)
  const [dirHandle, setDirHandle] = useState<any | null>(null)
  const [availableJsonFiles, setAvailableJsonFiles] = useState<string[] | null>(null)
  const [videoId, setVideoId] = useState<string | number | null>(null)
  const [originalVideoPath, setOriginalVideoPath] = useState<string | null>(null)
  const [allDone, setAllDone] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  async function saveRankingToDir(payload: any, suggestedName?: string) {
    if (!dirHandle) {
      alert('No folder selected to save rankings into. Please select a folder first.')
      return
    }
    if (!(dirHandle as any).getDirectoryHandle) {
      alert('Directory handle APIs not available in this browser. Cannot save rankings automatically.')
      return
    }
    try {
      const rankingsDir = await (dirHandle as any).getDirectoryHandle('rankings', { create: true })
      // derive filename from suggestedName (strip folders and extension)
      let base = suggestedName ? String(suggestedName) : 'ranking'
      base = base.split('/').pop()!.split('\\').pop()!
      base = base.replace(/\.[^/.]+$/, '')
      // ensure safe filename
      base = base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'ranking'
      const filename = `${base}.json`
      const fh = await rankingsDir.getFileHandle(filename, { create: true })
      const writable = await fh.createWritable()
      await writable.write(JSON.stringify(payload, null, 2))
      await writable.close()
      // show transient confirmation toast
      try {
        setSaveMsg(`Saved ${filename} to rankings/`)
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
        // @ts-ignore
        saveTimerRef.current = window.setTimeout(() => setSaveMsg(null), 2500)
      } catch (e) {
        // ignore toast errors
      }
    } catch (err) {
      console.error('Failed to save ranking file', err)
      alert('Failed to save ranking file: ' + (err as any)?.message)
    }
  }

  function loadEntryOutputs(entry: any) {
    if (!entry) return
    setAllDone(false)
    setPromptText(entry.prompt ?? entry.task ?? null)
    setGroundTruth(entry.ground_truth ?? entry.groundtruth ?? null)
    setVideoId(entry.id ?? entry.video_id ?? null)
    setOriginalVideoPath(typeof entry.video === 'string' ? entry.video : typeof entry.video_path === 'string' ? entry.video_path : null)
    setVideoId(entry.id ?? entry.video_id ?? null)

    const next: Output[] = []
    // include ground truth as a ranked option if present
    const gt = entry.ground_truth ?? entry.groundtruth ?? null
    if (gt) {
      next.push({ id: 'gt', model: 'Ground truth', text: gt })
    }
    for (let i = 1; i <= 6; i++) {
      const keysToTry = [`llm_response${i}`, `llm_output${i}`, `llmResponse${i}`, `response${i}`]
      for (const k of keysToTry) {
        if (Object.prototype.hasOwnProperty.call(entry, k)) {
          const text = entry[k]
          next.push({ id: `${i}`, model: `LLM ${i}`, text: text ?? '' })
          break
        }
      }
    }
    // randomize display order so users are blinded to original ordering
    function shuffleArray<T>(arr: T[]) {
      const a = arr.slice()
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = a[i]
        // swap
        // @ts-ignore
        a[i] = a[j]
        // @ts-ignore
        a[j] = tmp
      }
      return a
    }

    setOutputs(shuffleArray(next))
  }

  async function loadFileFromDir(handle: any, relPath: string): Promise<File | null> {
    try {
      const parts = relPath.split('/').filter(Boolean)
      let cur = handle
      for (let i = 0; i < parts.length - 1; i++) {
        cur = await cur.getDirectoryHandle(parts[i])
      }
      const fh = await cur.getFileHandle(parts[parts.length - 1])
      return await fh.getFile()
    } catch (err) {
      return null
    }
  }

  return (
    <div className="app-root">
      <header className="app-header">
        {/* <h1>Video LLM Ranker</h1> */}
        <div className="task-instructions">
          <strong>Task:</strong>
          <ol>
              <li><strong>SELECT</strong> the folder that includes the JSON and video files to evaluate</li>
              <li><strong>VIEW</strong> the surgical video</li>
              <li><strong>RANK</strong> the possible responses to the prompt in order of most to least preferred according to the video shown.</li>
              <li><strong>SCROLL DOWN</strong> if needed for each entry to be able to read all responses in their entirety.</li>
          </ol>
        </div>
      </header>
      <main className="app-main">
        <section className="video-column">
          <div className="video-wrap">
            {videoUrl || videoFileUrl ? (
              <video src={videoUrl || videoFileUrl || ''} controls className="video-player" />
            ) : (
              <div className="video-placeholder" style={{ padding: 24, border: '1px dashed #ddd' }}>
                <div className="muted">No video loaded. Select a folder to load JSON and videos.</div>
              </div>
            )}
          </div>
          {(originalVideoPath || videoId) && (
            <div className="video-id-badge below-video">
              Video: {originalVideoPath ? String(originalVideoPath).split('/').pop()!.split('\\').pop() : videoId}
            </div>
          )}
          {/* Prompt moved to ranking column to appear above Ranked Outputs header */}
        </section>

        <section className="ranking-column">
          <div className="controls-row">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn large"
                onClick={async () => {
                  if (!(window as any).showDirectoryPicker) {
                    alert('Directory picker not supported in this browser. Please use a Chromium-based browser.')
                    return
                  }
                  try {
                    const handle: any = await (window as any).showDirectoryPicker()
                    setDirHandle(handle)

                    // require data.json at the selected folder root
                    let dataFileHandle: any = null
                    try {
                      dataFileHandle = await handle.getFileHandle('data.json')
                    } catch (e) {
                      dataFileHandle = null
                    }

                    if (!dataFileHandle) {
                      alert('data.json not found in the selected folder. Please ensure a file named "data.json" is present at the folder root.')
                      setAvailableJsonFiles(null)
                      return
                    }

                    setAvailableJsonFiles(['data.json'])

                    const f = await dataFileHandle.getFile()
                    const text = await f.text()
                    const parsed = JSON.parse(text)
                    const arr = Array.isArray(parsed) ? parsed : [parsed]

                    // helper to derive the same base filename used when saving rankings
                    const makeBase = (suggested?: string) => {
                      let base = suggested ? String(suggested) : 'ranking'
                      base = base.split('/').pop()!.split('\\').pop()!
                      base = base.replace(/\.[^/.]+$/, '')
                      base = base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'ranking'
                      return base
                    }

                    // check existing rankings in rankings/ (if present) and filter out entries already evaluated
                    let rankingsDir: any = null
                    try {
                      rankingsDir = await handle.getDirectoryHandle('rankings')
                    } catch (e) {
                      rankingsDir = null
                    }

                    const filtered: any[] = []
                    for (let i = 0; i < arr.length; i++) {
                      const entry = arr[i]
                      const suggested = typeof entry.video === 'string' ? entry.video : typeof entry.video_path === 'string' ? entry.video_path : (entry.id ?? entry.video_id ?? `entry-${i}`)
                      const base = makeBase(suggested as string)
                      const filename = `${base}.json`
                      let exists = false
                      if (rankingsDir) {
                        try {
                          await rankingsDir.getFileHandle(filename)
                          exists = true
                        } catch (e) {
                          exists = false
                        }
                      }
                      if (!exists) filtered.push(entry)
                    }

                    if (filtered.length === 0) {
                      alert('All entries in data.json already have ranking files in rankings/. Nothing to evaluate.')
                      setAvailableJsonFiles(null)
                      setJsonEntries(null)
                      setSelectedEntry(null)
                      return
                    }

                    setJsonEntries(filtered)
                    setSelectedEntry(filtered.length ? 0 : null)
                    if (filtered.length) {
                      loadEntryOutputs(filtered[0])
                      const entry = filtered[0]
                      const videoRel = typeof entry.video === 'string' ? entry.video : typeof entry.video_path === 'string' ? entry.video_path : null
                      if (videoRel) {
                        const vf = await loadFileFromDir(handle, videoRel)
                        if (vf) {
                          if (videoFileUrl) URL.revokeObjectURL(videoFileUrl)
                          const url = URL.createObjectURL(vf)
                          setVideoFileUrl(url)
                          setVideoUrl(url)
                        }
                      }
                    }
                  } catch (err: any) {
                    console.error(err)
                    alert('Failed to read directory: ' + (err?.message ?? String(err)))
                  }
                }}
                disabled={!!dirHandle}
                title={dirHandle ? 'Folder selected' : 'Select folder'}
              >
                Select folder
              </button>
            </div>

            {/* Download button removed — rankings are saved automatically on Next into a rankings/ subfolder */}
            <button
              className="btn large"
              onClick={async () => {
                if (!jsonEntries || jsonEntries.length === 0) return
                // before advancing, save current rankings (if any) into rankings/ subfolder
                if (selectedEntry !== null) {
                  const payload = { video_id: videoId ?? null, video: originalVideoPath ?? null, rankings: outputs.map((o, i) => ({ rank: i + 1, ...o })) }
                  const suggested = originalVideoPath ?? (videoId ? String(videoId) : `entry-${selectedEntry}`)
                  await saveRankingToDir(payload, suggested)
                }
                // advance to next entry; if already at last, mark all done
                if (selectedEntry === null) {
                  setSelectedEntry(0)
                  const entry = jsonEntries[0]
                  loadEntryOutputs(entry)
                  if (dirHandle) {
                    const videoRel = typeof entry.video === 'string' ? entry.video : typeof entry.video_path === 'string' ? entry.video_path : null
                    if (videoRel) {
                      const vf = await loadFileFromDir(dirHandle, videoRel)
                      if (vf) {
                        if (videoFileUrl) URL.revokeObjectURL(videoFileUrl)
                        const url = URL.createObjectURL(vf)
                        setVideoFileUrl(url)
                        setVideoUrl(url)
                      }
                    }
                  }
                  return
                }

                const lastIdx = jsonEntries.length - 1
                if (selectedEntry < lastIdx) {
                  const nextIdx = selectedEntry + 1
                  setSelectedEntry(nextIdx)
                  const entry = jsonEntries[nextIdx]
                  loadEntryOutputs(entry)
                  if (dirHandle) {
                    const videoRel = typeof entry.video === 'string' ? entry.video : typeof entry.video_path === 'string' ? entry.video_path : null
                    if (videoRel) {
                      const vf = await loadFileFromDir(dirHandle, videoRel)
                      if (vf) {
                        if (videoFileUrl) URL.revokeObjectURL(videoFileUrl)
                        const url = URL.createObjectURL(vf)
                        setVideoFileUrl(url)
                        setVideoUrl(url)
                      }
                    }
                  }
                  return
                }

                // was at last entry -> complete
                setAllDone(true)
              }}
            >
              Next
            </button>
          </div>

          {jsonEntries && jsonEntries.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <h2>Progress</h2>
              <div className="muted">
                {allDone
                  ? `${jsonEntries.length} out of ${jsonEntries.length} finished`
                  : `${selectedEntry === null ? 0 : selectedEntry} out of ${jsonEntries.length} finished`}
              </div>
            </div>
          )}

          {promptText && !allDone && (
            <div style={{ marginBottom: 8 }}>
              <h2>Prompt</h2>
              <div className="muted prompt-text" style={{ marginTop: 8 }}>{promptText}</div>
            </div>
          )}
          {allDone ? (
            <div style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', background: '#f8fafc', textAlign: 'center', fontWeight: 600, fontSize: '2rem' }}>
              All Evaluations Completed!
            </div>
          ) : (
            <Ranking outputs={outputs} onChange={setOutputs} maxItems={6} />
          )}
        </section>
      </main>
      {saveMsg && (
        <div className="toast" role="status" aria-live="polite">
          <span className="toast-icon">✓</span>
          <span style={{ marginLeft: 8 }}>{saveMsg}</span>
        </div>
      )}
    </div>
  )
}
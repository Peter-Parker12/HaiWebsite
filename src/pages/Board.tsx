import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../api'
import type { BoardHandle, BoardScene } from '../components/BoardEditor'
import { PageHeader } from '../components/ui'
import { useStore } from '../store/store'

// Excalidraw is large, so it only loads when someone opens this tab.
const BoardEditor = lazy(() => import('../components/BoardEditor'))

interface BoardMeta {
  id: string
  name: string
  version: number
  updatedAt: string
}

type Status = 'saved' | 'saving' | 'error' | 'conflict'

function download(name: string, blob: Blob) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function Board() {
  const { projectId } = useStore()
  const [boards, setBoards] = useState<BoardMeta[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [scene, setScene] = useState<BoardScene | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Status>('saved')
  const [err, setErr] = useState('')

  const handle = useRef<BoardHandle | null>(null)
  const boardId = useRef<string | null>(null)
  const version = useRef(1)
  const lastJson = useRef('')
  const first = useRef(true)
  const pending = useRef<BoardScene | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const inflight = useRef(false)
  const dirty = useRef(false)

  const flush = useCallback(async (): Promise<void> => {
    window.clearTimeout(timer.current)
    const id = boardId.current
    const next = pending.current
    if (!id || !next) return
    if (inflight.current) {
      dirty.current = true
      return
    }
    pending.current = null
    inflight.current = true
    setStatus('saving')
    let conflict = false
    try {
      const res = await api<{ version: number }>(`/boards/${id}`, { method: 'PUT', body: { version: version.current, scene: next } })
      version.current = res.version
      setStatus('saved')
    } catch (e) {
      conflict = e instanceof ApiError && e.status === 409
      setStatus(conflict ? 'conflict' : 'error')
      if (e instanceof ApiError && e.status !== 409) setErr(e.message)
    } finally {
      inflight.current = false
      if (dirty.current && !conflict) {
        dirty.current = false
        void flush()
      }
    }
  }, [])

  const onChange = useCallback(
    (next: BoardScene) => {
      const json = JSON.stringify(next)
      if (first.current) {
        // Excalidraw reports once on load; that is not an edit.
        first.current = false
        lastJson.current = json
        return
      }
      if (json === lastJson.current) return
      lastJson.current = json
      pending.current = next
      setStatus('saving')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void flush(), 1200)
    },
    [flush],
  )

  const open = useCallback(
    async (id: string) => {
      await flush()
      setErr('')
      setScene(null)
      try {
        const res = await api<{ board: { id: string; version: number; scene: BoardScene } }>(`/boards/${id}`)
        boardId.current = id
        version.current = res.board.version
        first.current = true
        lastJson.current = ''
        pending.current = null
        setStatus('saved')
        setScene(res.board.scene)
        setActiveId(id)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Could not open the board.')
      }
    },
    [flush],
  )

  const reloadList = useCallback(async () => {
    const res = await api<{ boards: BoardMeta[] }>(`/projects/${projectId}/boards`)
    setBoards(res.boards)
    return res.boards
  }, [projectId])

  useEffect(() => {
    let alive = true
    reloadList()
      .then((list) => {
        if (alive && list[0]) return open(list[0].id)
      })
      .catch((e) => alive && setErr(e instanceof Error ? e.message : 'Could not load boards.'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
      void flush() // save anything still waiting when leaving the tab
    }
  }, [reloadList, open, flush])

  const create = async () => {
    const name = window.prompt('Name this board', `Board ${boards.length + 1}`)?.trim()
    if (!name) return
    try {
      const res = await api<{ board: BoardMeta }>(`/projects/${projectId}/boards`, { body: { name } })
      await reloadList()
      await open(res.board.id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create the board.')
    }
  }

  const rename = async () => {
    const cur = boards.find((b) => b.id === activeId)
    const name = window.prompt('Rename board', cur?.name)?.trim()
    if (!name || !activeId) return
    try {
      await api(`/boards/${activeId}`, { method: 'PATCH', body: { name } })
      await reloadList()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not rename the board.')
    }
  }

  const remove = async () => {
    const cur = boards.find((b) => b.id === activeId)
    if (!activeId || !window.confirm(`Delete "${cur?.name}"? This cannot be undone.`)) return
    try {
      pending.current = null
      await api(`/boards/${activeId}`, { method: 'DELETE' })
      boardId.current = null
      setActiveId(null)
      setScene(null)
      const list = await reloadList()
      if (list[0]) await open(list[0].id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete the board.')
    }
  }

  const exportAs = async (kind: 'png' | 'svg') => {
    const name = boards.find((b) => b.id === activeId)?.name ?? 'board'
    try {
      if (kind === 'png') download(`${name}.png`, await handle.current!.exportPng())
      else download(`${name}.svg`, new Blob([await handle.current!.exportSvg()], { type: 'image/svg+xml' }))
    } catch {
      setErr('Could not export the board.')
    }
  }

  const setHandle = useCallback((h: BoardHandle) => {
    handle.current = h
  }, [])

  return (
    <>
      <PageHeader
        step="Board"
        title="Whiteboard"
        desc="Sketch, draft and plan visually. Each project can have several boards. Only the project leader can edit them."
        actions={
          <button className="btn-accent" onClick={() => void create()}>
            <Plus size={16} /> New board
          </button>
        }
      />

      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
      {status === 'conflict' && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          This board was changed somewhere else, so your latest edits were not saved.
          <button className="btn-ghost !py-1" onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : boards.length === 0 ? (
        <div className="card text-center">
          <p className="text-sm text-ink/70">No boards yet. Create one to start sketching ideas, layouts or storyboards.</p>
          <button className="btn-primary mt-4" onClick={() => void create()}><Plus size={16} /> Create your first board</button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {boards.map((b) => (
              <button key={b.id} className={b.id === activeId ? 'btn-primary !py-1.5' : 'btn-ghost !py-1.5'} onClick={() => void open(b.id)}>
                {b.name}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-2 text-xs text-ink/50">
              {status === 'saving' ? 'Saving…' : status === 'error' ? 'Could not save' : status === 'conflict' ? '' : 'All changes saved'}
              <button className="btn-ghost !px-2 !py-1" title="Rename board" onClick={() => void rename()}><Pencil size={14} /></button>
              <button className="btn-ghost !px-2 !py-1" title="Export PNG" disabled={!scene} onClick={() => void exportAs('png')}><Download size={14} /> PNG</button>
              <button className="btn-ghost !px-2 !py-1" title="Export SVG" disabled={!scene} onClick={() => void exportAs('svg')}><Download size={14} /> SVG</button>
              <button className="btn-ghost !px-2 !py-1" title="Delete board" onClick={() => void remove()}><Trash2 size={14} /></button>
            </span>
          </div>

          <div className="h-[72vh] overflow-hidden rounded-lg border border-cloth-200 bg-white">
            {scene && activeId ? (
              <Suspense fallback={<p className="p-6 text-sm text-ink/50">Loading whiteboard…</p>}>
                <BoardEditor key={activeId} scene={scene} onChange={onChange} onReady={setHandle} />
              </Suspense>
            ) : (
              <p className="p-6 text-sm text-ink/50">Loading board…</p>
            )}
          </div>
          <p className="mt-2 text-xs text-ink/50">Images dropped onto the board are stored inside it, so keep boards under about 6 MB.</p>
        </>
      )}
    </>
  )
}

import { Excalidraw, exportToBlob, exportToSvg } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { useEffect, useRef } from 'react'

/**
 * Thin adapter around Excalidraw. The rest of the app only knows BoardScene and BoardHandle,
 * so the editor can be swapped for another one later without touching the pages or the API.
 */
export interface BoardScene {
  elements: unknown[]
  appState: Record<string, unknown>
  files: Record<string, unknown>
}

export interface BoardHandle {
  exportPng: () => Promise<Blob>
  exportSvg: () => Promise<string>
}

interface Props {
  scene: BoardScene
  onChange: (scene: BoardScene) => void
  onReady: (handle: BoardHandle) => void
}

export default function BoardEditor({ scene, onChange, onReady }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null)

  useEffect(() => {
    const snapshot = () => {
      const api = apiRef.current
      return {
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportBackground: true },
        files: api.getFiles(),
      }
    }
    onReady({
      exportPng: () => exportToBlob({ ...snapshot(), mimeType: 'image/png' }),
      exportSvg: async () => (await exportToSvg(snapshot())).outerHTML,
    })
  }, [onReady])

  return (
    <Excalidraw
      initialData={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        elements: scene.elements as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        appState: scene.appState as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        files: scene.files as any,
        scrollToContent: true,
      }}
      excalidrawAPI={(api) => {
        apiRef.current = api
      }}
      onChange={(elements, appState, files) => {
        // Keep only what is needed to restore the board: live elements, the background, and the images they use.
        const live = elements.filter((e) => !e.isDeleted)
        const used = new Set(live.map((e) => (e as { fileId?: string | null }).fileId).filter(Boolean) as string[])
        const keptFiles: Record<string, unknown> = {}
        for (const id of used) if (files[id]) keptFiles[id] = files[id]
        onChange({ elements: live, appState: { viewBackgroundColor: appState.viewBackgroundColor }, files: keptFiles })
      }}
    />
  )
}

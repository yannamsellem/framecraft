import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { create } from 'zustand'
import { useEditorStore } from './useEditorStore'
import { useTimelineStore } from './useTimelineStore'
import { combine } from 'zustand/middleware'

interface State {
  isLoaded: boolean
  isExporting: boolean
  progress: number // 0 to 1
  statusText: string
  logs: string[]
  videoCodec: string
  audioCodec: string
  containerFormat: string
  downloadUrl: string | null
  downloadFilename: string
}

interface Actions {
  setVideoCodec: (codec: string) => void
  setAudioCodec: (codec: string) => void
  setContainerFormat: (format: string) => void
  exportVideo: () => Promise<void>
  clearLogs: () => void
  clearDownload: () => void
}

export type ExportState = State & Actions

let ffmpeg: FFmpeg | null = null

const mimeTypes: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
}

export const useExportStore = create<ExportState>(
  combine<State, Actions>(
    {
      isLoaded: false,
      isExporting: false,
      progress: 0,
      statusText: '',
      logs: [],
      videoCodec: 'copy',
      audioCodec: 'copy',
      containerFormat: 'mp4',
      downloadUrl: null,
      downloadFilename: '',
    },
    (set, get) => ({
      setVideoCodec: (codec) => set({ videoCodec: codec }),
      setAudioCodec: (codec) => set({ audioCodec: codec }),
      setContainerFormat: (format) => set({ containerFormat: format }),
      clearLogs: () => set({ logs: [] }),
      clearDownload: () => {
        const url = get().downloadUrl
        if (url) URL.revokeObjectURL(url)
        set({ downloadUrl: null, downloadFilename: '', progress: 0 })
      },

      exportVideo: async () => {
        const { file } = useEditorStore.getState()
        const { blocks } = useTimelineStore.getState()
        const { videoCodec, audioCodec, containerFormat, downloadUrl } = get()

        if (!file) return

        if (downloadUrl) URL.revokeObjectURL(downloadUrl)

        set({
          isExporting: true,
          progress: 0,
          statusText: 'Loading FFmpeg engine...',
          logs: [],
          downloadUrl: null,
        })

        try {
          if (!ffmpeg) {
            ffmpeg = new FFmpeg()
            ffmpeg.on('progress', ({ progress }) => {
              set({ progress })
            })
            ffmpeg.on('log', ({ message }) => {
              set((state) => ({
                logs: [...state.logs, message].slice(-100),
              }))
            })

            await ffmpeg.load()
            set({ isLoaded: true })
          }

          set({ statusText: 'Preparing files...' })
          const ext = file.name.split('.').pop() || 'mp4'
          const inputName = `input.${ext}`

          await ffmpeg.writeFile(inputName, await fetchFile(file))

          const outName = `output.${containerFormat}`
          let execArgs: string[] = []

          if (blocks.length > 0) {
            const sortedBlocks = [...blocks].sort((a, b) => a.start - b.start)
            let concatText = ''
            for (const block of sortedBlocks) {
              concatText += `file '${inputName}'\n`
              concatText += `inpoint ${block.start.toFixed(3)}\n`
              concatText += `outpoint ${block.end.toFixed(3)}\n`
            }

            await ffmpeg.writeFile('concat.txt', concatText)

            execArgs = [
              '-f',
              'concat',
              '-safe',
              '0',
              '-i',
              'concat.txt',
              '-c:v',
              videoCodec,
              '-c:a',
              audioCodec,
              outName,
            ]
          } else {
            execArgs = [
              '-i',
              inputName,
              '-c:v',
              videoCodec,
              '-c:a',
              audioCodec,
              outName,
            ]
          }

          set({ statusText: 'Exporting video...' })

          await ffmpeg.exec(execArgs)

          set({ statusText: 'Finalizing...', progress: 1 })

          const data = await ffmpeg.readFile(outName)

          const blob = new Blob([(data as Uint8Array<ArrayBuffer>).buffer], {
            type: mimeTypes[containerFormat] || 'video/mp4',
          })
          const url = URL.createObjectURL(blob)

          await ffmpeg.deleteFile(inputName)
          await ffmpeg.deleteFile('concat.txt').catch(() => {
            // may not exist
          })
          await ffmpeg.deleteFile(outName)

          set({
            isExporting: false,
            statusText: 'Ready to download',
            downloadUrl: url,
            downloadFilename: `framecraft-export.${containerFormat}`,
          })

          setTimeout(() => set({ statusText: '' }), 5000)
        } catch (error) {
          console.error(error)
          set({
            isExporting: false,
            statusText: 'Export failed. Check console.',
          })
        }
      },
    }),
  ),
)

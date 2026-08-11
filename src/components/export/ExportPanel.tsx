import { IconDownload, IconFileExport, IconTrash } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { useExportStore } from '../../store/useExportStore'
import { Button } from '../Button'
import './ExportPanel.css'

export function ExportPanel() {
  const { file } = useEditorStore()
  const {
    isExporting,
    progress,
    statusText,
    logs,
    exportVideo,
    clearLogs,
    videoCodec,
    audioCodec,
    containerFormat,
    downloadUrl,
    downloadFilename,
    setVideoCodec,
    setAudioCodec,
    setContainerFormat,
  } = useExportStore()

  const terminalRef = useRef<HTMLDivElement>(null)

  const canExport = file !== null
  const progressPercent = Math.round(progress * 100)

  const showInfo = Boolean(statusText)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  const handleDownloadClick = () => {
    if (downloadUrl) {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = downloadFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <div className="ExportPanel">
      <div className="ExportPanel__config">
        <div className="ExportPanel__field">
          <label>Container</label>
          <select
            value={containerFormat}
            onChange={(e) => setContainerFormat(e.target.value)}
            disabled={isExporting}
          >
            <option value="mp4">MP4</option>
            <option value="mov">MOV</option>
            <option value="avi">AVI</option>
            <option value="mkv">MKV</option>
            <option value="webm">WebM</option>
          </select>
        </div>
        <div className="ExportPanel__field">
          <label>Video Codec</label>
          <select
            value={videoCodec}
            onChange={(e) => setVideoCodec(e.target.value)}
            disabled={isExporting}
          >
            <option value="copy">Copy (Fastest)</option>
            <option value="libx264">H.264 (libx264)</option>
            <option value="libx265">H.265 (libx265)</option>
            <option value="libvpx-vp9">VP9 (libvpx-vp9)</option>
          </select>
        </div>
        <div className="ExportPanel__field">
          <label>Audio Codec</label>
          <select
            value={audioCodec}
            onChange={(e) => setAudioCodec(e.target.value)}
            disabled={isExporting}
          >
            <option value="copy">Copy (Fastest)</option>
            <option value="aac">AAC</option>
            <option value="libmp3lame">MP3</option>
          </select>
        </div>
      </div>

      <div className="ExportPanel__top">
        <div className="ExportPanel__info">
          {showInfo && (
            <span className="ExportPanel__status">{statusText}</span>
          )}
          {isExporting && (
            <div className="ExportPanel__progress-container">
              <div
                className="ExportPanel__progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        <div className="ExportPanel__actions">
          <Button
            variant="primary"
            onClick={() => void exportVideo()}
            disabled={!canExport || isExporting}
            small
          >
            <IconFileExport size={18} />
            {isExporting ? `Exporting ${progressPercent}%` : 'Export'}
          </Button>
          <Button
            variant="primary"
            onClick={handleDownloadClick}
            disabled={!downloadUrl}
            small
          >
            <IconDownload size={18} />
            Download
          </Button>
        </div>
      </div>

      <details className="ExportPanel__accordion">
        <summary className="ExportPanel__accordion-summary">
          Debug / Logs
        </summary>
        <div className="ExportPanel__terminal-wrapper">
          <div className="ExportPanel__terminal-header">
            <span className="ExportPanel__terminal-title">FFmpeg Output</span>
            <button
              className="ExportPanel__clear-btn"
              onClick={clearLogs}
              disabled={isExporting || logs.length === 0}
              title="Clear Logs"
            >
              <IconTrash size={16} />
            </button>
          </div>
          <div className="ExportPanel__terminal" ref={terminalRef}>
            {logs.length === 0 && !isExporting ? (
              <span className="ExportPanel__log-line">No logs yet.</span>
            ) : (
              logs.map((log, i) => (
                // eslint-disable-next-line react-x/no-array-index-key
                <span key={i} className="ExportPanel__log-line">
                  {log}
                </span>
              ))
            )}
          </div>
        </div>
      </details>
    </div>
  )
}

import { IconUpload } from '@tabler/icons-react'
import './App.css'
import { Button } from './components/Button'
import { VideoPlayer } from './components/player/VideoPlayer'
import { Timeline } from './components/timeline/Timeline'
import { useEditorStore } from './store/useEditorStore'

function handleImportClick() {
  document.getElementById('file-upload')?.click()
}

export default function App() {
  const { file, setFile } = useEditorStore()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFile(file)
    event.target.value = ''
  }

  return (
    <div className="App">
      <header className="AppHeader">
        <h1 className="AppHeader__logo">FrameCraft</h1>
        <div className="AppHeader__actions">
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            accept="video/*"
            onChange={handleFileChange}
          />
          {file && (
            <Button small onClick={handleImportClick}>
              <IconUpload stroke={2} size={16} /> Import Video
            </Button>
          )}
        </div>
      </header>

      <main className="AppMain">
        <div className="AppPlayerContainer">
          {file ? (
            <>
              <VideoPlayer />
              <Timeline />
            </>
          ) : (
            <div className="AppEmptyState">
              <h2>Welcome to FrameCraft</h2>
              <p>Import a video file to start editing in the browser.</p>
              <Button
                className="AppEmptyState__import-btn"
                onClick={handleImportClick}
              >
                <IconUpload size={20} />
                Select Video
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

import { IconUpload } from '@tabler/icons-react'
import { useCallback, useRef } from 'react'
import './App.css'
import { Button } from './components/Button'
import { VideoPlayer } from './components/player/VideoPlayer'
import { Timeline } from './components/timeline/Timeline'
import { useEditorStore } from './store/useEditorStore'

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { file, setFile } = useEditorStore()

  const handleImportClick = useCallback(() => fileInputRef.current?.click(), [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFile(file)
    event.target.value = ''
  }

  return (
    <>
      <header className="App__header">
        <h1 className="App__header__logo">FrameCraft</h1>
        <div className="App__header__actions">
          <input
            type="file"
            ref={fileInputRef}
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
      <main className="App__main">
        <div className="App__player-container">
          {file ? (
            <>
              <VideoPlayer />
              <Timeline />
            </>
          ) : (
            <div className="App__empty-state">
              <h2>Welcome to FrameCraft</h2>
              <p>Import a media file to start editing</p>
              <Button onClick={handleImportClick} className="App__import-btn">
                <IconUpload stroke={2} size={20} /> Select Video
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default App

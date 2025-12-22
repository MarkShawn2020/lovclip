import { Provider } from 'jotai'
import ClipboardManager from './components/ClipboardManager'
import SettingsWindow from './components/SettingsWindow'
import ArchiveLibrary from './components/ArchiveLibrary'
import './App.css'

function App() {
  const currentHash = window.location.hash
  const isSettingsWindow = currentHash === '#settings'
  const isArchiveWindow = currentHash === '#archive'

  return (
    <Provider>
      {isSettingsWindow ? (
        <SettingsWindow />
      ) : isArchiveWindow ? (
        <ArchiveLibrary />
      ) : (
        <div className='App'>
          <ClipboardManager />
        </div>
      )}
    </Provider>
  )
}

export default App
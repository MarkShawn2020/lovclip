import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import './index.css'
import './api/tauri-bridge'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')

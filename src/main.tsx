import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { registerSW } from 'virtual:pwa-register'

// Register service worker and automatically check for updates
const updateSW = registerSW({
  onNeedRefresh() {
    // Force reload when a new version is ready
    updateSW(true)
  },
  onOfflineReady() {
    console.log('PWA is ready to work offline')
  },
})

// Optional: check for updates when the app becomes visible again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateSW(true)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

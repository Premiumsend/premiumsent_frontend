import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './theme.css'
import './index.css'

// Telegram Mini App SDK
import WebApp from '@twa-dev/sdk'
import { setupTelegramApp } from './utils/telegramApp.js'

// Telegram WebApp ishga tayyor bo'lganda
WebApp.ready()

// Ranglar, fullscreen va chiqishda tasdiq
setupTelegramApp()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

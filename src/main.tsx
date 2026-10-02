import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './custom-bootstrap.scss'
import './global.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

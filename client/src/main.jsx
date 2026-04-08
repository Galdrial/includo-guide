import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * ENTRY POINT
 * Initializes the React application and attaches it to the DOM root.
 * StrictMode is enabled for development-time safety checks.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

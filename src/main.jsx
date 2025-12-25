import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // Note: React.StrictMode in DEV causes effects to run twice to help detect issues.
  // This is expected behavior and our shared listener manager handles it correctly
  // by ensuring only ONE onSnapshot listener exists per UID.
  <React.StrictMode>
    <App />
  </React.StrictMode>
)





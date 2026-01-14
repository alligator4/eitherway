import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/AuthContext'
import './index.css'

const rootEl = document.getElementById('root')

if (!rootEl) {
  throw new Error('Element #root introuvable dans index.html')
}

ReactDOM.createRoot(rootEl).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)

// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const apiBase = import.meta.env.VITE_API_BASE || ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App apiBase={apiBase} />
  </BrowserRouter>
)

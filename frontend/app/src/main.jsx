import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { EventProvider } from './context/EventContext.jsx'
import  {AuthProvider}  from "./context/AuthContext.jsx";

createRoot(document.getElementById('root')).render(

  <StrictMode>
  <EventProvider>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </EventProvider>

  </StrictMode>,
)

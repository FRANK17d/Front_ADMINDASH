import { ScrollToTop } from './components/common/ScrollToTop'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import PublicRoute from './components/common/PublicRoute'
import AppLayout from './layout/AppLayout'
import Home from './pages/Dashboard/Home'
import Calendar from './pages/Calendar'
import SignIn from './pages/AuthPages/SignIn'
import Users from './pages/Users/Users'
import ForgotPass from './pages/AuthPages/ForgotPass'
import Chatbot from './pages/ChatBot/Chatbot'

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Redirección de la raíz a signin */}
          <Route path="/" element={<Navigate to="/iniciar-sesion" replace />} />
          
          {/* Auth Layout - Rutas públicas solo para admin */}
          <Route path="/iniciar-sesion" element={<PublicRoute><SignIn /></PublicRoute>} />
          <Route path="/recuperar-contraseña" element={<PublicRoute><ForgotPass /></PublicRoute>} />

          {/* Dashboard Admin - Rutas protegidas solo para administradores */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard-admin" element={<Home />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/usuarios" element={<Users />} />
            <Route path="/chatbot" element={<Chatbot />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}
export default App
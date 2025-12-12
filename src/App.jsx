import { ScrollToTop } from './components/common/ScrollToTop'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ROLES } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import PublicRoute from './components/common/PublicRoute'
import RoleRoute from './components/common/RoleRoute'
import AppLayout from './layout/AppLayout'
import SignIn from './pages/AuthPages/SignIn'
import Users from './pages/Users/Users'
import ForgotPass from './pages/AuthPages/ForgotPass'
import Chatbot from './pages/ChatBot/Chatbot'
import Reservas from './pages/Reservas/Reservas'
import Perfil from './pages/Perfil'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          {/* Redirección de la raíz a signin */}
          <Route path="/" element={<Navigate to="/iniciar-sesion" replace />} />
          
          {/* Auth Layout - Rutas públicas solo para admin */}
          <Route path="/iniciar-sesion" element={<PublicRoute><SignIn /></PublicRoute>} />
          <Route path="/recuperar-contraseña" element={<PublicRoute><ForgotPass /></PublicRoute>} />

          {/* Dashboard - Rutas protegidas */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            {/* Rutas para ADMIN */}
            <Route 
              path='/admin/pasajeros' 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Reservas/>
                </RoleRoute>
              }
            />
            <Route 
              path="/admin/chatbot" 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Chatbot />
                </RoleRoute>
              } 
            />
            <Route 
              path="/admin/perfil" 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Perfil />
                </RoleRoute>
              } 
            />
            <Route 
              path="/admin/usuarios" 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Users />
                </RoleRoute>
              } 
            />

          {/* Rutas para RECEPCIONISTA - Protegidas */}
            <Route 
              path='/recepcionista/pasajeros' 
              element={
                <RoleRoute allowedRoles={[ROLES.RECEPTIONIST]}>
                  <Reservas/>
                </RoleRoute>
              }
            />
            <Route 
              path="/recepcionista/chatbot" 
              element={
                <RoleRoute allowedRoles={[ROLES.RECEPTIONIST]}>
                  <Chatbot />
                </RoleRoute>
              } 
            />
            <Route 
              path="/recepcionista/perfil" 
              element={
                <RoleRoute allowedRoles={[ROLES.RECEPTIONIST]}>
                  <Perfil />
                </RoleRoute>
              } 
            />

            {/* Rutas para HOUSEKEEPING - Protegidas */}
            <Route 
              path='/hoteler/pasajeros' 
              element={
                <RoleRoute allowedRoles={[ROLES.HOUSEKEEPING]}>
                  <Reservas/>
                </RoleRoute>
              }
            />
            <Route 
              path="/hoteler/chatbot" 
              element={
                <RoleRoute allowedRoles={[ROLES.HOUSEKEEPING]}>
                  <Chatbot />
                </RoleRoute>
              } 
            />
            <Route 
              path="/hoteler/perfil" 
              element={
                <RoleRoute allowedRoles={[ROLES.HOUSEKEEPING]}>
                  <Perfil />
                </RoleRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}
export default App
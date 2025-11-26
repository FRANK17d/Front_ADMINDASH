import { ScrollToTop } from './components/common/ScrollToTop'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ROLES } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import PublicRoute from './components/common/PublicRoute'
import RoleRoute from './components/common/RoleRoute'
import AppLayout from './layout/AppLayout'
import Home from './pages/Dashboard/Home'
import HomeHousekeeping from './pages/Dashboard/HomeHousekeeping'
import SignIn from './pages/AuthPages/SignIn'
import Users from './pages/Users/Users'
import ForgotPass from './pages/AuthPages/ForgotPass'
import Chatbot from './pages/ChatBot/Chatbot'
import Reservas from './pages/Reservas/Reservas'
import CajaCobros from './pages/Caja-cobros/CajaCobros'
import Lavanderia from './pages/Lavanderia/Lavanderia'
import Mantenimiento from './pages/Mantenimiento/Mantenimiento'
import Perfil from './pages/Perfil'
import Mensajes from './pages/Mensajes/Mensajes'
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
              path="/admin/dashboard" 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Home />
                </RoleRoute>
              } 
            />
            <Route 
              path='/admin/reservas' 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Reservas/>
                </RoleRoute>
              }
            />
            <Route 
              path='/admin/caja-cobros' 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <CajaCobros/>
                </RoleRoute>
              }
            />
            <Route 
              path='/admin/lavanderia' 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Lavanderia/>
                </RoleRoute>
              }
            />
            <Route 
              path='/admin/caja-cobros' 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <CajaCobros/>
                </RoleRoute>
              }
            />
            <Route 
              path='/admin/mantenimiento' 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Mantenimiento/>
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
              path="/admin/mensajes" 
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Mensajes />
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
              path="/recepcionista/dashboard" 
              element={
                <RoleRoute allowedRoles={[ROLES.RECEPTIONIST]}>
                  <Home />
                </RoleRoute>
              } 
            />
            <Route 
              path='/recepcionista/reservas' 
              element={
                <RoleRoute allowedRoles={[ROLES.RECEPTIONIST]}>
                  <Reservas/>
                </RoleRoute>
              }
            />
            <Route 
              path='/recepcionista/caja-cobros' 
              element={
                <RoleRoute allowedRoles={[ROLES.RECEPTIONIST]}>
                  <CajaCobros/>
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
            <Route 
              path="/recepcionista/mensajes" 
              element={
                <RoleRoute allowedRoles={[ROLES.RECEPTIONIST]}>
                  <Mensajes />
                </RoleRoute>
              } 
            />

            {/* Rutas para HOUSEKEEPING - Protegidas */}
            <Route 
              path="/hoteler/dashboard" 
              element={
                <RoleRoute allowedRoles={[ROLES.HOUSEKEEPING]}>
                  <HomeHousekeeping />
                </RoleRoute>
              } 
            />
            <Route 
              path='/hoteler/reservas' 
              element={
                <RoleRoute allowedRoles={[ROLES.HOUSEKEEPING]}>
                  <Reservas/>
                </RoleRoute>
              }
            />
            <Route 
              path='/hoteler/lavanderia' 
              element={
                <RoleRoute allowedRoles={[ROLES.HOUSEKEEPING]}>
                  <Lavanderia/>
                </RoleRoute>
              }
            />
            <Route 
              path='/hoteler/mantenimiento' 
              element={
                <RoleRoute allowedRoles={[ROLES.HOUSEKEEPING]}>
                  <Mantenimiento/>
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
              path="/hoteler/mensajes" 
              element={
                <RoleRoute allowedRoles={[ROLES.HOUSEKEEPING]}>
                  <Mensajes />
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
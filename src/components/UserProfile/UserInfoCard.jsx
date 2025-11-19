import { useState } from "react";
import { useAuth, ROLES } from "../../context/AuthContext";
import EditProfileModal from "./EditProfileModal";

export default function UserInfoCard() {
  const { user, userRole } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const getRoleName = (role) => {
    switch(role) {
      case ROLES.ADMIN:
        return 'Administrador';
      case ROLES.RECEPTIONIST:
        return 'Recepcionista';
      default:
        return 'Usuario';
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Información Personal
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Nombre Completo
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.displayName || 'No especificado'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Correo Electrónico
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.email || 'No especificado'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Rol
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {getRoleName(userRole)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Estado
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                    Activo
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Botón de editar */}
          <div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}

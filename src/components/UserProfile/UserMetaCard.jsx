import { useState, useEffect } from "react";
import { useAuth, ROLES } from "../../context/AuthContext";
import { getOwnProfile } from "../../api/users";
import EditProfileModal from "./EditProfileModal";

export default function UserMetaCard() {
  const { user, userRole } = useAuth();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const loadProfile = async () => {
    try {
      const profile = await getOwnProfile();
      if (profile?.profile_photo_url) {
        setProfilePhotoUrl(profile.profile_photo_url);
      } else {
        setProfilePhotoUrl('');
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);
  
  const getRoleName = (role) => {
    switch(role) {
      case ROLES.ADMIN:
        return 'Administrador';
      case ROLES.RECEPTIONIST:
        return 'Recepcionista';
      case ROLES.HOUSEKEEPING:
        return 'Hotelero';
      default:
        return 'Usuario';
    }
  };
  
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden border-2 border-orange-200 rounded-full dark:border-orange-800 bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            {!isLoading && profilePhotoUrl ? (
              <img 
                src={profilePhotoUrl} 
                alt="Foto de perfil" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Si la imagen falla al cargar, mostrar el icono por defecto
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
            ) : null}
            <svg 
              className="w-12 h-12 text-orange-600 dark:text-orange-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              style={{ display: profilePhotoUrl && !isLoading ? 'none' : 'block' }}
            >
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getRoleName(userRole)}
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hotel Plaza Trujillo
              </p>
            </div>
          </div>
          <div className="order-2 xl:order-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          // Recargar la foto cuando se actualiza el perfil
          loadProfile();
        }}
      />
    </div>
  );
}

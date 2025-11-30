import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { updateOwnProfile, getOwnProfile } from '../../api/users';
import { useAuth } from '../../context/AuthContext';

const schema = yup.object({
  display_name: yup.string().required('El nombre es requerido')
}).required();

const EditProfileModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);
  const [deletePhoto, setDeletePhoto] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      display_name: user?.displayName || ''
    }
  });

  // Cargar foto actual cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const loadCurrentPhoto = async () => {
        try {
          const profile = await getOwnProfile();
          if (profile?.profile_photo_url) {
            setCurrentPhotoUrl(profile.profile_photo_url);
          } else {
            setCurrentPhotoUrl(null);
          }
        } catch (error) {
          console.error('Error cargando foto actual:', error);
        }
      };
      loadCurrentPhoto();
    }
  }, [isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no debe superar los 2MB');
        return;
      }
      
      setError('');
      setDeletePhoto(false); // Si sube nueva foto, no eliminar
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setSelectedImage(reader.result); // Base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    setDeletePhoto(true);
    setSelectedImage(null);
    setImagePreview(null);
    setCurrentPhotoUrl(null);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Si se marca eliminar, enviar cadena vacía, si hay nueva imagen enviarla, si no enviar null
      let photoToSend = null;
      if (deletePhoto) {
        photoToSend = '';
      } else if (selectedImage) {
        photoToSend = selectedImage;
      }
      
      await updateOwnProfile({
        display_name: data.display_name,
        profile_photo_url: photoToSend
      });
      
      // Recargar la página para actualizar los datos
      window.location.reload();
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError('Error al actualizar el perfil. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    setSelectedImage(null);
    setImagePreview(null);
    setCurrentPhotoUrl(null);
    setDeletePhoto(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Editar Perfil
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}

          {/* Nombre completo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              {...register('display_name')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ingresa tu nombre completo"
            />
            {errors.display_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.display_name.message}
              </p>
            )}
          </div>

          {/* Subir foto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto de Perfil
            </label>
            
            {/* Foto actual o preview de nueva imagen */}
            {(currentPhotoUrl && !deletePhoto && !imagePreview) && (
              <div className="mb-3 flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500">
                  <img 
                    src={currentPhotoUrl} 
                    alt="Foto actual" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar foto
                </button>
              </div>
            )}
            
            {/* Preview de nueva imagen */}
            {imagePreview && (
              <div className="mb-3 flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500">
                  <img 
                    src={imagePreview} 
                    alt="Nueva foto" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Mensaje si se eliminó la foto */}
            {deletePhoto && !imagePreview && (
              <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 text-center">
                La foto se eliminará al guardar
              </div>
            )}
            
            {/* Input de archivo */}
            {(!currentPhotoUrl || deletePhoto || imagePreview) && (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click para subir</span> o arrastra la imagen
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG o JPEG (MAX. 2MB)
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;

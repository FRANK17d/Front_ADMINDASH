import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import Input from "../../form/input/InputField";
import Button from "../../ui/button/Button";
import { PencilIcon, TrashBinIcon, PlusIcon, ChevronLeftIcon, AngleRightIcon, LockIcon } from "../../../icons";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../ui/modal";
import Label from "../../form/Label";
import { listUsers, createUser, updateUser, deleteUser, toggleUserStatus } from "../../../api/users";
import { useAuth } from "../../../context/AuthContext";
import LoadingSpinner from "../../common/LoadingSpinner";
import { toast } from 'react-toastify';

// Genera una contraseña robusta distinta para cada usuario creado
const generateTempPassword = () => {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*?";
  const all = uppercase + lowercase + digits + symbols;
  const length = 12;
  const passwordChars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  for (let i = passwordChars.length; i < length; i += 1) {
    passwordChars.push(all[Math.floor(Math.random() * all.length)]);
  }

  return passwordChars.sort(() => Math.random() - 0.5).join("");
};

export default function BasicTableOne() {
  const { isAdmin } = useAuth();
  const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useModal();
  const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [data, setData] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUserLoading, setEditingUserLoading] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [togglingUserStatus, setTogglingUserStatus] = useState(null); // ID del usuario siendo habilitado/inhabilitado
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [createForm, setCreateForm] = useState({ 
    name: "", 
    email: "", 
    role: "Administrador",
    salary: "",
    entry_date: ""
  });
  const itemsPerPage = 7;

  const roleLabelToApi = (label) => {
    const l = (label || "").toLowerCase();
    if (l.startsWith("admin")) return "admin";
    if (l.startsWith("hotel")) return "housekeeping";
    return "receptionist";
  };

  const roleApiToLabel = (role) => {
    if (role === "admin") return "Administrador";
    if (role === "housekeeping") return "Hotelero";
    return "Recepcionista";
  };

  const mapApiUsersToRows = (users) => {
    return (users || []).map(u => {
      // Determinar el estado basado en disabled y email_verified
      // Los administradores siempre muestran "Activo" (no necesitan verificar correo)
      let status = "Activo";
      const isAdmin = u.role === "admin";
      
      if (u.disabled) {
        status = "Inhabilitado";
      } else if (!isAdmin && u.email_verified === false) {
        // Solo aplicar "Sin confirmar" si NO es admin y el correo no está verificado
        status = "Sin confirmar";
      }
      // Si es admin y no está disabled, siempre será "Activo"
      
      return {
        id: u.uid,
        name: u.display_name || (u.email ? u.email.split("@")[0] : "Usuario"),
        role: roleApiToLabel(u.role || "receptionist"),
        roleApi: u.role || "receptionist", // Guardar el rol en formato API para verificar
        email: u.email,
        salary: u.salary || "—",
        entryDate: u.entry_date || "—",
        status: status,
        disabled: u.disabled, // Guardar el estado disabled
        image: u.profile_photo_url || null,
      };
    });
  };

  const refresh = async () => {
    try {
      setLoadingUsers(true);
      setError("");
      const res = await listUsers();
      setData(mapApiUsersToRows(res.users));
    } catch (e) {
      setError("No se pudo cargar usuarios");
      setData([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Filtrar datos basado en la búsqueda
  const filteredData = useMemo(() => {
    return data.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, data]);

  // Calcular datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // Calcular número total de páginas
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Contar cuántos administradores hay en la lista
  const adminCount = useMemo(() => {
    return data.filter(user => user.roleApi === "admin").length;
  }, [data]);

  // Verificar si un usuario es el único administrador
  const isOnlyAdmin = (user) => {
    return user.roleApi === "admin" && adminCount === 1;
  };

  // Funciones de manejo
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset a la primera página al buscar
  };
  
  const handleOpenCreateModal = () => {
    setError(""); // Limpiar errores previos
    openCreateModal();
  };
  
  const handleCloseCreateModal = () => {
    setError(""); // Limpiar errores
    setCreatingUser(false); // Resetear estado de loading
    setSuccessData(null); // Limpiar datos de éxito
    setCreateForm({ name: "", email: "", role: "Administrador", salary: "", entry_date: "" }); // Resetear formulario
    closeCreateModal();
  };

  const handleCreateUser = async () => {
    setCreatingUser(true);
    setError("");
    
    try {
      if (!isAdmin) {
        setError("No tienes permisos para crear usuarios");
        return;
      }
      const apiRole = roleLabelToApi(createForm.role);

      const tempPassword = generateTempPassword();

      const result = await createUser({
        email: createForm.email,
        password: tempPassword,
        role: apiRole,
        display_name: createForm.name,
        salary: createForm.salary || "",
        entry_date: createForm.entry_date && createForm.entry_date.trim() !== "" ? createForm.entry_date : null
      });
      
      // Guardar datos para mostrar en modal de éxito
      setSuccessData({
        email: createForm.email,
        name: createForm.name,
        tempPassword: result.password || tempPassword,
        role: createForm.role
      });
      
      // Limpiar formulario después de crear el usuario
      setCreateForm({ 
        name: "", 
        email: "", 
        role: "Administrador",
        salary: "",
        entry_date: ""
      });
      
      // Refrescar lista de usuarios
      await refresh();
      
      // Mostrar toast de éxito
      toast.success(`Usuario "${createForm.name}" creado exitosamente`, {
        position: "bottom-right",
        autoClose: 3000,
      });
      
      // No cerrar el modal, solo mostrar éxito
      setCreatingUser(false);
      
    } catch (e) {
      console.error("Error creando usuario:", e);
      const errorMessage = e.message || "No se pudo crear el usuario. Por favor, intenta nuevamente.";
      setError(errorMessage);
      // Mostrar toast de error
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEditUserClick = (user) => {
    setEditingUser(user);
    openEditModal();
  };

  const handleSaveEdit = async () => {
    setEditingUserLoading(true);
    setError(""); // Limpiar errores previos
    try {
      if (!isAdmin || !editingUser?.id) {
        const errorMessage = "No tienes permisos para editar usuarios o el usuario no es válido";
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 4000,
        });
        setEditingUserLoading(false);
        return;
      }
      
      // Validar que el rol sea válido
      if (!editingUser.role || editingUser.role.trim() === "") {
        const errorMessage = "Debe seleccionar un rol válido";
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 4000,
        });
        setEditingUserLoading(false);
        return;
      }
      
      // Preparar datos - enviar null si la fecha está vacía
      const apiRole = roleLabelToApi(editingUser.role);
      const updateData = {
        role: apiRole,
        salary: editingUser.salary || "",
        entry_date: editingUser.entryDate && editingUser.entryDate.trim() !== "" ? editingUser.entryDate : null
      };
      
      console.log('Actualizando usuario:', editingUser.id, 'con datos:', updateData);
      await updateUser(editingUser.id, updateData);
      await refresh();
      
      // Mostrar toast de éxito
      toast.success(`Usuario "${editingUser.name}" actualizado exitosamente`, {
        position: "bottom-right",
        autoClose: 3000,
      });
      
      setEditingUser(null);
      closeEditModal();
    } catch (e) {
      console.error("Error actualizando usuario:", e);
      const errorMessage = e.message || "No se pudo actualizar el usuario";
      setError(errorMessage);
      // Mostrar toast de error
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    } finally {
      setEditingUserLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setDeletingUser(true);
    try {
      if (!isAdmin) {
        const errorMessage = "No tienes permisos para eliminar usuarios";
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 4000,
        });
        setDeletingUser(false);
        return;
      }
      
      if (!userId) {
        const errorMessage = "No se pudo identificar el usuario a eliminar";
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 4000,
        });
        setDeletingUser(false);
        return;
      }

      // Verificar si es el único administrador
      if (userToDelete && isOnlyAdmin(userToDelete)) {
        const errorMessage = "No se puede eliminar el único administrador del sistema";
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 4000,
        });
        setDeletingUser(false);
        return;
      }
      
      // Obtener el nombre del usuario antes de eliminarlo para el toast
      const userName = userToDelete?.name || "Usuario";
      
      await deleteUser(userId);
      await refresh();
      
      // Mostrar toast de éxito
      toast.success(`Usuario "${userName}" eliminado exitosamente`, {
        position: "bottom-right",
        autoClose: 3000,
      });
      
      closeDeleteModal();
      setUserToDelete(null);
    } catch (e) {
      console.error(e);
      const errorMessage = e.message || "No se pudo eliminar el usuario";
      setError(errorMessage);
      // Mostrar toast de error
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    } finally {
      setDeletingUser(false);
    }
  };

  const handleOpenDeleteModal = (user) => {
    setUserToDelete(user);
    openDeleteModal();
  };

  const handleToggleUserStatus = async (user) => {
    try {
      if (!isAdmin) {
        const errorMessage = "No tienes permisos para habilitar/inhabilitar usuarios";
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 4000,
        });
        return;
      }
      
      if (!user?.id) {
        const errorMessage = "No se pudo identificar el usuario";
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 4000,
        });
        return;
      }

      // Verificar que no sea administrador - usar el rol original de la API
      const userRoleApi = user.roleApi || (user.role === "Administrador" ? "admin" : 
                      user.role === "Hotelero" ? "housekeeping" : "receptionist");
      
      if (userRoleApi === "admin") {
        const errorMessage = "No se puede habilitar/inhabilitar usuarios administradores";
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 4000,
        });
        return;
      }
      
      // Activar loading para este usuario específico
      setTogglingUserStatus(user.id);
      
      await toggleUserStatus(user.id);
      await refresh();
      
      const statusText = user.status === "Inhabilitado" ? "habilitado" : "inhabilitado";
      toast.success(`Usuario "${user.name}" ${statusText} exitosamente`, {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (e) {
      console.error("Error al cambiar estado del usuario:", e);
      const errorMessage = e.message || "No se pudo cambiar el estado del usuario";
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    } finally {
      // Desactivar loading
      setTogglingUserStatus(null);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y botón crear */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-80">
          <Input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          size="sm"
          disabled={!isAdmin}
        >
          <PlusIcon className="w-4 h-4 fill-current" />
          Crear Usuario
        </Button>
      </div>
      {error && !isCreateModalOpen && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}
      <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] max-h-[80vh] overflow-y-auto lg:max-h-none lg:overflow-visible rounded-3xl bg-white dark:bg-black dark:border dark:border-orange-500/30 p-6 lg:p-8">
          <div className="mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
              Crear Usuario
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Complete la información para crear un nuevo usuario en el sistema.
            </p>
          </div>
          
          {/* Mensaje de error dentro del modal */}
          {error && (
            <div className="mb-4 p-3 text-sm text-orange-700 bg-orange-50 border border-orange-300 rounded-lg dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-600">
              {error}
            </div>
          )}
          
          {/* Layout condicional: normal antes de crear, dos columnas después de crear */}
          <div className={successData ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
            {/* Formulario */}
            <form className="flex flex-col " onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }}>
              <div className="space-y-5 mb-6">
                <div className={successData ? "space-y-5" : "grid grid-cols-1 gap-6 lg:grid-cols-2"}>
                  <div>
                    <Label>Nombre Completo</Label>
                    <Input 
                      type="text" 
                      placeholder="Ej: Juan Pérez García" 
                      value={createForm.name} 
                      onChange={(e)=>setCreateForm(v=>({...v,name:e.target.value}))} 
                      required
                      className="dark:bg-black dark:border-orange-500/30 dark:text-white dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <Label>Correo Electrónico</Label>
                    <Input 
                      type="email" 
                      placeholder="usuario@hotelplaza.com" 
                      value={createForm.email} 
                      onChange={(e)=>setCreateForm(v=>({...v,email:e.target.value}))} 
                      required
                      className="dark:bg-black dark:border-orange-500/30 dark:text-white dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <Label>Rol</Label>
                    <select 
                      value={createForm.role} 
                      onChange={(e)=>setCreateForm(v=>({...v,role:e.target.value}))}
                      className="w-full px-2.5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:border-orange-500/30 dark:bg-black dark:text-white dark:focus:ring-orange-500 dark:focus:border-orange-500"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Recepcionista">Recepcionista</option>
                      <option value="Hotelero">Hotelero</option>
                    </select>
                  </div>

                  <div>
                    <Label>Salario <span className="text-error-500">*</span></Label>
                    <Input 
                      type="text" 
                      placeholder="2,500" 
                      value={createForm.salary} 
                      onChange={(e)=> setCreateForm(v=>({...v,salary: e.target.value}))} 
                      required
                      className="dark:bg-black dark:border-orange-500/30 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label>Fecha de Entrada <span className="text-error-500">*</span></Label>
                    <Input 
                      type="date" 
                      value={createForm.entry_date} 
                      onChange={(e)=>setCreateForm(v=>({...v,entry_date:e.target.value}))} 
                      required
                      className="dark:bg-black dark:border-orange-500/30 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-200 dark:border-orange-500/20">
                <Button type="button" size="sm" variant="outline" onClick={handleCloseCreateModal} disabled={creatingUser} className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900">
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  size="sm" 
                  className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
                  disabled={creatingUser || !createForm.name || !createForm.email || !createForm.salary || !createForm.entry_date}
                >
                  {creatingUser ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </span>
                  ) : (
                    "Crear Usuario"
                  )}
                </Button>
              </div>
            </form>

            {/* Mensaje de éxito con credenciales (a la derecha, solo cuando successData existe) */}
            {successData && (
              <div className="flex flex-col">
                <div className="flex items-center gap-5 mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Usuario Creado Exitosamente
                  </h5>
                </div>
                
                <div className="p-4 bg-orange-50 border border-orange-300 rounded-lg dark:bg-orange-900/20 dark:border-orange-600">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Credenciales de acceso:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
                      <span className="font-medium text-orange-800 dark:text-orange-300">Nombre:</span>
                      <span className="text-gray-900 dark:text-white break-words">{successData.name}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
                      <span className="font-medium text-orange-800 dark:text-orange-300">Email:</span>
                      <span className="text-gray-900 dark:text-white break-all">{successData.email}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <span className="font-medium text-orange-800 dark:text-orange-300">Contraseña:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white font-mono break-all">{successData.tempPassword}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(successData?.tempPassword || "");
                            alert("Contraseña copiada");
                          }}
                          className="p-1.5 text-orange-600 hover:bg-orange-100 rounded dark:text-orange-400 dark:hover:bg-orange-900/40"
                          title="Copiar contraseña"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
                      <span className="font-medium text-orange-800 dark:text-orange-300">Rol:</span>
                      <span className="text-gray-900 dark:text-white">{successData.role}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-900/30 dark:border-orange-600/40">
                  <h6 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Instrucciones de acceso
                  </h6>
                  <ul className="list-disc space-y-1.5 pl-5 text-xs text-gray-600 dark:text-gray-300">
                    <li>Esta es la contraseña permanente del usuario.</li>
                    <li>El usuario puede iniciar sesión inmediatamente con estas credenciales.</li>
                    <li>Antes debe verificar su correo electrónico.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Edición */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] max-h-[80vh] overflow-y-auto lg:max-h-none lg:overflow-visible rounded-3xl bg-white dark:bg-black dark:border dark:border-orange-500/30 p-6 lg:p-8">
          <div className="mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
              Editar Usuario
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Modifique la información del usuario según sea necesario.
            </p>
          </div>
          
          {/* Mensaje de error dentro del modal */}
          {error && isEditModalOpen && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
              {error}
            </div>
          )}
          
          <form className="flex flex-col">
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <Label>Nombre</Label>
                  <Input 
                    type="text" 
                    defaultValue={editingUser?.name || ""} 
                    placeholder="Nombre del usuario" 
                    disabled
                    className="bg-gray-100 dark:bg-gray-900 dark:border-orange-500/30 cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    El nombre no se puede editar
                  </p>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    defaultValue={editingUser?.email || ""} 
                    placeholder="Email del usuario" 
                    disabled
                    className="bg-gray-100 dark:bg-gray-900 dark:border-orange-500/30 cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    El email no se puede editar
                  </p>
                </div>

                <div>
                  <Label>Rol</Label>
                  <select 
                    value={editingUser?.role || ""} 
                    onChange={(e)=>setEditingUser(prev=>({...prev, role: e.target.value}))}
                    className="w-full px-4 py-2.5 pr-16 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-orange-500/30 dark:bg-black dark:text-white dark:focus:ring-orange-500"
                  >
                    <option value="">Seleccione un rol</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Recepcionista">Recepcionista</option>
                    <option value="Hotelero">Hotelero</option>
                  </select>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Cambie el rol del usuario
                  </p>
                </div>

                <div>
                  <Label>Salario</Label>
                  <Input 
                    type="text" 
                    value={editingUser?.salary || ""} 
                    placeholder="2,500" 
                    onChange={(e)=> setEditingUser(prev=>({...prev, salary: e.target.value}))}
                    className="dark:bg-black dark:border-orange-500/30 dark:text-white"
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Edite el salario mensual en soles
                  </p>
                </div>

                <div>
                  <Label>Fecha de Entrada</Label>
                  <Input 
                    type="date" 
                    defaultValue={editingUser?.entryDate || ""} 
                    onChange={(e)=>setEditingUser(prev=>({...prev, entryDate: e.target.value}))}
                    className="dark:bg-black dark:border-orange-500/30 dark:text-white"
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Edite la fecha de inicio laboral
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-200 dark:border-orange-500/20">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={closeEditModal} 
                disabled={editingUserLoading}
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                size="sm" 
                onClick={handleSaveEdit} 
                disabled={editingUserLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                {editingUserLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] max-h-[80vh] overflow-y-auto lg:max-h-none lg:overflow-visible rounded-3xl bg-white dark:bg-black dark:border dark:border-orange-500/30 p-6 lg:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
              ¿Eliminar Usuario?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Esta acción no se puede deshacer.
            </p>
          </div>

          {userToDelete && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-900/30 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center">
                  {userToDelete.image ? (
                    <img
                      width={48}
                      height={48}
                      src={userToDelete.image}
                      alt={userToDelete.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<svg class="w-7 h-7 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>';
                      }}
                    />
                  ) : (
                    <svg className="w-7 h-7 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{userToDelete.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{userToDelete.email}</p>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rol:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{userToDelete.role}</span>
                </div>
                {userToDelete.salary !== "—" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Salario:</span>
                    <span className="font-medium text-gray-900 dark:text-white">S/ {userToDelete.salary}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mensaje de advertencia si es el único administrador */}
          {userToDelete && isOnlyAdmin(userToDelete) && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    No se puede eliminar el único administrador
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    El sistema requiere al menos un administrador. Crea otro administrador antes de eliminar este usuario.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={closeDeleteModal} 
              disabled={deletingUser}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={() => userToDelete && handleDeleteUser(userToDelete.id)} 
              disabled={deletingUser || (userToDelete && isOnlyAdmin(userToDelete))}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
            >
              {deletingUser ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminando...
                </span>
              ) : (
                "Eliminar Usuario"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Usuario
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Rol
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Correo
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Salario
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Fecha Entrada
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {loadingUsers && data.length === 0 ? (
                // Skeleton loader con placeholders
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full dark:bg-gray-700 animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 w-40 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="h-4 w-16 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="h-6 w-20 bg-gray-200 rounded-full dark:bg-gray-700 animate-pulse mx-auto"></div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg dark:bg-gray-700 animate-pulse"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-lg dark:bg-gray-700 animate-pulse"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center">
                            {user.image ? (
                              <img
                                width={40}
                                height={40}
                                src={user.image}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>';
                                }}
                              />
                            ) : (
                              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {user.name}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.role}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                        {user.salary && user.salary !== "—" ? `S/ ${user.salary}` : user.salary}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                        {user.entryDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={
                            user.status === "Activo" 
                              ? "success" 
                              : user.status === "Sin confirmar" 
                              ? "warning" 
                              : "error"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => isAdmin && handleEditUserClick(user)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title="Editar usuario"
                            disabled={!isAdmin}
                          >
                            <PencilIcon className="w-4 h-4 fill-current" />
                          </button>
                          {/* Botón de habilitar/inhabilitar - solo para recepcionistas y hoteleros */}
                          {(user.roleApi === "receptionist" || user.roleApi === "housekeeping") && (
                            <button
                              onClick={() => isAdmin && handleToggleUserStatus(user)}
                              className={`p-2 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                                user.disabled
                                  ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                                  : "text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                              }`}
                              title={user.disabled ? "Habilitar usuario" : "Inhabilitar usuario"}
                              disabled={!isAdmin || togglingUserStatus === user.id}
                            >
                              {togglingUserStatus === user.id ? (
                                <svg className="w-4 h-4 animate-spin fill-current" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <LockIcon className="w-4 h-4 fill-current" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => isAdmin && handleOpenDeleteModal(user)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title={isOnlyAdmin(user) ? "No se puede eliminar el único administrador" : "Eliminar usuario"}
                            disabled={!isAdmin || isOnlyAdmin(user)}
                          >
                            <TrashBinIcon className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 order-1 lg:order-1">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} usuarios
          </div>
          <div className="flex items-center gap-2 order-2 lg:order-2">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              size="sm"
              className="bg-gray-500 hover:bg-gray-200 text-white disabled:opacity-50 flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto"
              title="Página anterior"
            >
              <ChevronLeftIcon className="w-4 h-4 sm:w-4 sm:h-4 fill-current" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                size="sm"
                className={
                  page === currentPage
                    ? "bg-orange-500 hover:bg-orange-600 text-white w-9 h-9 sm:w-auto sm:h-auto"
                    : "bg-gray-500 hover:bg-gray-200 text-gray-700 w-9 h-9 sm:w-auto sm:h-auto"
                }
              >
                {page}
              </Button>
            ))}
            
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              size="sm"
              className="bg-gray-500 hover:bg-gray-200 text-white disabled:opacity-50 flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto"
              title="Página siguiente"
            >
              <AngleRightIcon className="w-4 h-4 sm:w-4 sm:h-4 fill-current" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

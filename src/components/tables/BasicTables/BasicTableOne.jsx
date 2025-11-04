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
import { PencilIcon, TrashBinIcon, PlusIcon, UserIcon, ChevronLeftIcon, AngleRightIcon } from "../../../icons";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../ui/modal";
import Label from "../../form/Label";
import { listUsers, createUser, updateUserRole, deleteUser } from "../../../api/users";
import { useAuth, ROLES } from "../../../context/AuthContext";

export default function BasicTableOne() {
  const { isSuperadmin } = useAuth();
  const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useModal();
  const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "Administrador" });
  const itemsPerPage = 7;

  const roleLabelToApi = (label) => {
    const l = (label || "").toLowerCase();
    if (l.includes("super")) return "superadmin";
    if (l.startsWith("admin")) return "admin";
    return "receptionist";
  };

  const roleApiToLabel = (role) => {
    if (role === "superadmin") return "Superadmin";
    if (role === "admin") return "Administrador";
    return "Recepcionista";
  };

  const mapApiUsersToRows = (users) => {
    return (users || []).map(u => ({
      id: u.uid,
      name: u.display_name || (u.email ? u.email.split("@")[0] : "Usuario"),
      role: roleApiToLabel(u.role || "receptionist"),
      email: u.email,
      age: "—",
      salary: "—",
      entryDate: "—",
      attendance: "—",
      status: u.disabled ? "Inactivo" : "Activo",
      image: "/images/user/user-17.jpg",
    }));
  };

  const refresh = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await listUsers();
      setData(mapApiUsersToRows(res.users));
    } catch (e) {
      setError("No se pudo cargar usuarios");
      setData([]);
    } finally {
      setLoading(false);
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

  // Funciones de manejo
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  const handleCreateUser = async () => {
    try {
      if (!isSuperadmin) return;
      // Usar contraseña temporal para no alterar el diseño
      await createUser({
        email: createForm.email,
        password: "Temporal123!",
        role: roleLabelToApi(createForm.role),
        display_name: createForm.name,
      });
      await refresh();
      closeCreateModal();
      setCreateForm({ name: "", email: "", role: "Administrador" });
    } catch (e) {
      console.error(e);
      setError("No se pudo crear el usuario");
    }
  };

  const handleEditUserClick = (user) => {
    setEditingUser(user);
    openEditModal();
  };

  const handleSaveEdit = async () => {
    try {
      if (!isSuperadmin || !editingUser?.id) return;
      await updateUserRole(editingUser.id, roleLabelToApi(editingUser.role));
      await refresh();
    } catch (e) {
      console.error(e);
      setError("No se pudo actualizar el usuario");
    } finally {
      setEditingUser(null);
      closeEditModal();
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      if (!isSuperadmin) return;
      await deleteUser(userId);
      await refresh();
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar el usuario");
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
          onClick={openCreateModal}
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          size="sm"
          disabled={!isSuperadmin}
        >
          <PlusIcon className="w-4 h-4 fill-current" />
          Crear Usuario
        </Button>
      </div>
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Crear Usuario
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Complete la información para crear un nuevo usuario.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Información del Usuario
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Nombre</Label>
                    <Input type="text" placeholder="Ingrese el nombre completo" value={createForm.name} onChange={(e)=>setCreateForm(v=>({...v,name:e.target.value}))} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email</Label>
                    <Input type="email" placeholder="usuario@hotelplaza.com" value={createForm.email} onChange={(e)=>setCreateForm(v=>({...v,email:e.target.value}))} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Rol</Label>
                    <Input type="text" placeholder="Administrador, Recepcionista, etc." value={createForm.role} onChange={(e)=>setCreateForm(v=>({...v,role:e.target.value}))} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Salario</Label>
                    <Input type="text" placeholder="S/2,500" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Fecha de Entrada</Label>
                    <Input type="date" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Asistencia (%)</Label>
                    <Input type="text" placeholder="95%" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeCreateModal}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCreateUser} className="bg-orange-500 hover:bg-orange-600">
                Crear Usuario
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal de Edición */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar Usuario
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Modifique la información del usuario según sea necesario.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Información del Usuario
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Nombre</Label>
                    <Input type="text" defaultValue={editingUser?.name || ""} placeholder="Ingrese el nombre completo" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email</Label>
                    <Input type="email" defaultValue={editingUser?.email || ""} placeholder="usuario@hotelplaza.com" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Rol</Label>
                    <Input type="text" defaultValue={editingUser?.role || ""} onChange={(e)=>setEditingUser(prev=>({...prev, role: e.target.value}))} placeholder="Administrador, Recepcionista, etc." />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Salario</Label>
                    <Input type="text" defaultValue={editingUser?.salary || ""} placeholder="S/2,500" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Fecha de Entrada</Label>
                    <Input type="date" defaultValue={editingUser?.entryDate || ""} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Asistencia (%)</Label>
                    <Input type="text" defaultValue={editingUser?.attendance || ""} placeholder="95%" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeEditModal}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="bg-orange-500 hover:bg-orange-600">
                Guardar Cambios
              </Button>
            </div>
          </form>
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
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Salario
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Fecha Entrada
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Asistencia
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
              {paginatedData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full">
                        <img
                          width={40}
                          height={40}
                          src={user.image}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
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
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {user.salary}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {user.entryDate}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {user.attendance}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <Badge
                      size="sm"
                      color={user.status === "Activo" ? "success" : "error"}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => isSuperadmin && handleEditUserClick(user)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar usuario"
                        disabled={!isSuperadmin}
                      >
                        <PencilIcon className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => isSuperadmin && handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar usuario"
                        disabled={!isSuperadmin}
                      >
                        <TrashBinIcon className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

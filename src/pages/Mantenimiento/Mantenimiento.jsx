import { useEffect, useState, useMemo } from "react";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon, LockIcon } from "../../icons";
import { toast } from 'react-toastify';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import {
  getSystemStatus,
  updateSystemStatus,
  getBriquetteHistory,
  registerBriquetteChange,
  getMaintenanceIssues,
  reportIssue,
  deleteIssue,
  getBlockedRooms,
  blockRoom,
  unblockRoom,
} from "../../api/mantenimiento";
import { getAllRooms } from "../../api/reservations";
import { useAuth } from "../../context/AuthContext";
import { getOwnProfile } from "../../api/users";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function Mantenimiento() {
  const { user } = useAuth();
  const { isOpen: isChangeModalOpen, openModal: openChangeModal, closeModal: closeChangeModal } = useModal();
  const { isOpen: isBlockModalOpen, openModal: openBlockModal, closeModal: closeBlockModal } = useModal();
  const { isOpen: isIncidenceModalOpen, openModal: openIncidenceModal, closeModal: closeIncidenceModal } = useModal();
  const [activeTab, setActiveTab] = useState("system");
  const [allRooms, setAllRooms] = useState([]);
  
  // Estados para los datos
  const [loading, setLoading] = useState(true);
  const [waterHeatingSystem, setWaterHeatingSystem] = useState({
    operationalStatus: "Operativo",
    briquettesThisMonth: 0,
    lastMaintenance: { date: null, time: null },
    nextMaintenance: { date: null, time: null },
  });
  const [briquettesHistory, setBriquettesHistory] = useState([]);
  const [maintenanceIssues, setMaintenanceIssues] = useState([]);
  const [blockedRooms, setBlockedRooms] = useState([]);
  const [briquettesPage, setBriquettesPage] = useState(1);
  
  // Estados para los formularios
  const [changeForm, setChangeForm] = useState({
    quantity: "",
    date: "",
    time: "",
    operationalStatus: "Operativo",
  });
  const [blockForm, setBlockForm] = useState({
    room: "",
    reason: "",
    blockedUntil: "",
    blockedBy: "",
  });
  const [issueForm, setIssueForm] = useState({
    room: "",
    problem: "",
    priority: "Media",
    technician: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [system, history, issues, rooms] = await Promise.all([
        getSystemStatus(),
        getBriquetteHistory(),
        getMaintenanceIssues(),
        getBlockedRooms(),
      ]);
      
      setWaterHeatingSystem(system);
      setBriquettesHistory(history);
      setMaintenanceIssues(issues);
      setBlockedRooms(rooms);
      // Resetear página cuando se cargan nuevos datos
      setBriquettesPage(1);
    } catch (error) {
      console.error("Error cargando datos de mantenimiento:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Mantenimiento Técnico - Administrador - Hotel Plaza Trujillo";
    fetchAll();
    
    // Escuchar notificaciones de mantenimiento desde WebSocket
    const handleMaintenanceNotification = (event) => {
      const notification = event.detail;
      toast.info(
        <div>
          <div className="font-semibold">{notification.title}</div>
          <div className="text-sm mt-1">{notification.message}</div>
        </div>,
        {
          position: "bottom-right",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    };
    
    window.addEventListener('maintenanceNotification', handleMaintenanceNotification);
    
    return () => {
      window.removeEventListener('maintenanceNotification', handleMaintenanceNotification);
    };
  }, []);

  // Resetear página cuando se cambia de pestaña
  useEffect(() => {
    setBriquettesPage(1);
  }, [activeTab]);

  // Cargar habitaciones cuando se abre el modal de bloqueo
  useEffect(() => {
    if (isBlockModalOpen) {
      (async () => {
        try {
          const rooms = await getAllRooms();
          setAllRooms(rooms);
          
          // Obtener el nombre del usuario logueado desde el perfil
          let userName = "";
          try {
            const profile = await getOwnProfile();
            userName = profile?.display_name || "";
          } catch (e) {
            // Si falla, usar el displayName de Firebase o email
            userName = user?.displayName || (user?.email ? user.email.split("@")[0] : "") || "";
          }
          
          // Si no hay nombre en el perfil, usar displayName de Firebase o email
          if (!userName) {
            userName = user?.displayName || (user?.email ? user.email.split("@")[0] : "") || "";
          }
          
          // Establecer el nombre del usuario en "Bloqueado Por"
          if (userName) {
            setBlockForm(prev => ({ ...prev, blockedBy: userName }));
          }
        } catch (error) {
          console.error("Error cargando habitaciones:", error);
          setAllRooms([]);
        }
      })();
    } else {
      // Limpiar el formulario cuando se cierra el modal
      setBlockForm({ room: "", reason: "", blockedUntil: "", blockedBy: "" });
    }
  }, [isBlockModalOpen, user]);


  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "Alta":
        return "error";
      case "Media":
        return "warning";
      case "Baja":
        return "success";
      default:
        return "light";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Resuelto":
        return "success";
      case "En Proceso":
        return "warning";
      case "Pendiente":
        return "error";
      default:
        return "light";
    }
  };

  const handleReleaseRoom = async (roomId) => {
    // Encontrar la habitación para mostrar su código en el mensaje
    const room = blockedRooms.find(r => r.id === roomId);
    const roomCode = room?.room || "habitación";
    
    if (!window.confirm(`¿Está seguro de que desea liberar la habitación ${roomCode}?`)) {
      return;
    }
    
    try {
      await unblockRoom(roomId);
      await fetchAll();
      
      toast.success(`Habitación ${roomCode} liberada exitosamente`, {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error liberando habitación:", error);
      const errorMessage = error?.response?.data?.error || "Error al liberar la habitación";
      
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    }
  };

  const handleChangeBriquettes = async () => {
    try {
      await registerBriquetteChange(changeForm);
      setChangeForm({ quantity: "", date: "", time: "", operationalStatus: "Operativo" });
      closeChangeModal();
      await fetchAll();
    } catch (error) {
      console.error("Error registrando cambio de briquetas:", error);
      alert("Error al registrar el cambio de briquetas");
    }
  };

  const handleBlockRoom = async () => {
    try {
      if (!blockForm.room || !blockForm.reason || !blockForm.blockedUntil) {
        alert("Por favor complete todos los campos requeridos");
        return;
      }
      await blockRoom(blockForm);
      setBlockForm({ room: "", reason: "", blockedUntil: "", blockedBy: "" });
      closeBlockModal();
      await fetchAll();
    } catch (error) {
      console.error("Error bloqueando habitación:", error);
      alert("Error al bloquear la habitación");
    }
  };

  const handleReportIncidence = async () => {
    try {
      await reportIssue(issueForm);
      setIssueForm({ room: "", problem: "", priority: "Media", technician: "" });
      closeIncidenceModal();
      await fetchAll();
    } catch (error) {
      console.error("Error reportando incidencia:", error);
      alert("Error al reportar la incidencia");
    }
  };

  const handleDeleteIssue = async (issueId) => {
    // Encontrar la incidencia para mostrar su información en el mensaje
    const issue = maintenanceIssues.find(i => i.id === issueId);
    const issueInfo = issue ? `habitación ${issue.room}` : "incidencia";
    
    if (!window.confirm(`¿Está seguro de que desea eliminar esta incidencia de la ${issueInfo}?`)) {
      return;
    }
    
    try {
      await deleteIssue(issueId);
      await fetchAll();
      
      toast.success(`Incidencia de la ${issueInfo} eliminada exitosamente`, {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error eliminando incidencia:", error);
      const errorMessage = error?.response?.data?.error || "Error al eliminar la incidencia";
      
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Mantenimiento Técnico
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Gestión del sistema de agua caliente y mantenimiento de habitaciones
          </p>
        </div>
      </div>

      {/* Tabla con Pestañas */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap px-5 sm:px-6 pt-5 gap-4">
            <button
              onClick={() => setActiveTab("system")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                activeTab === "system"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Sistema Agua Caliente
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                activeTab === "history"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historial Briquetas
            </button>
            <button
              onClick={() => setActiveTab("issues")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                activeTab === "issues"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Incidencias
            </button>
            <button
              onClick={() => setActiveTab("blocked")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                activeTab === "blocked"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <LockIcon className="size-5" />
              Habitaciones Bloqueadas
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {/* Sistema de Agua Caliente */}
          {activeTab === "system" && (
            <div className="space-y-6">
              {/* Estado del Sistema */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/30">
                    <svg className="text-green-600 size-6 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Estado Operativo
                    </span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                      {waterHeatingSystem.operationalStatus}
                    </h4>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-900/30">
                    <svg className="text-orange-600 size-6 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Briquetas Este Mes
                    </span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                      {waterHeatingSystem.briquettesThisMonth} Unid.
                    </h4>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/30">
                    <svg className="text-blue-600 size-6 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Último Cambio
                    </span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                      {waterHeatingSystem.lastMaintenance?.date || "No registrado"}
                    </h4>
                    {waterHeatingSystem.lastMaintenance?.time && (
                      <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {waterHeatingSystem.lastMaintenance.time}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl dark:bg-purple-900/30">
                    <svg className="text-purple-600 size-6 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Próximo Cambio
                    </span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                      {waterHeatingSystem.nextMaintenance?.date || "No programado"}
                    </h4>
                    {waterHeatingSystem.nextMaintenance?.time && (
                      <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {waterHeatingSystem.nextMaintenance.time}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={openChangeModal}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5 fill-current" />
                  Registrar Cambio Briquetas
                </Button>
                <Button
                  onClick={openBlockModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
                >
                  <LockIcon className="w-5 h-5" />
                  Bloquear Habitación
                </Button>
                <Button
                  onClick={openIncidenceModal}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5 fill-current" />
                  Reportar Incidencia
                </Button>
              </div>
            </div>
          )}

          {/* Historial de Briquetas */}
          {activeTab === "history" && (
            <div>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Fecha
                        </TableCell>
                        <TableCell
                          isHeader
                          className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Hora
                        </TableCell>
                        <TableCell
                          isHeader
                          className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Cantidad
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(() => {
                        const ITEMS_PER_PAGE = 5;
                        const startIndex = (briquettesPage - 1) * ITEMS_PER_PAGE;
                        const paginatedHistory = briquettesHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                        const totalPages = Math.ceil(briquettesHistory.length / ITEMS_PER_PAGE);
                        
                        if (briquettesHistory.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={3} className="py-10 px-4 text-center text-gray-500 dark:text-gray-400 w-full">
                                <div className="flex items-center justify-center w-full">
                                  No hay historial de cambios de briquetas
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        return paginatedHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {record.date}
                            </TableCell>
                            <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">
                              {record.time}
                            </TableCell>
                            <TableCell className="py-3.5 px-2 sm:px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                              {record.quantity} unid.
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {(() => {
                const ITEMS_PER_PAGE = 5;
                const totalPages = Math.ceil(briquettesHistory.length / ITEMS_PER_PAGE);
                
                if (totalPages > 1) {
                  return (
                    <div className="flex items-center justify-between mt-4 px-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Página {briquettesPage} de {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={briquettesPage <= 1}
                          onClick={() => setBriquettesPage((p) => Math.max(1, p - 1))}
                        >
                          Anterior
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={briquettesPage >= totalPages}
                          onClick={() => setBriquettesPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Incidencias de Mantenimiento */}
          {activeTab === "issues" && (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Habitación
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Problema
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                      >
                        Prioridad
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                      >
                        Fecha Reporte
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                      >
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {maintenanceIssues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 px-4 text-center text-gray-500 dark:text-gray-400 w-full">
                          <div className="flex items-center justify-center w-full">
                            No hay incidencias registradas
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      maintenanceIssues.map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {issue.room}
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            <div className="truncate max-w-[200px] sm:max-w-none">
                              {issue.problem}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 hidden md:table-cell">
                            <Badge size="sm" color={getPriorityBadgeColor(issue.priority)}>
                              {issue.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden lg:table-cell">
                            {issue.reportedDate}
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <button
                                onClick={() => handleDeleteIssue(issue.id)}
                                className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/30"
                                title="Eliminar"
                              >
                                <TrashBinIcon className="w-4 h-4 fill-current" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Habitaciones Bloqueadas */}
          {activeTab === "blocked" && (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Habitación
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Razón Bloqueo
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                      >
                        Bloqueada Hasta
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                      >
                        Bloqueada Por
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                      >
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {blockedRooms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 px-4 text-center text-gray-500 dark:text-gray-400 w-full">
                          <div className="flex items-center justify-center w-full">
                            No hay habitaciones bloqueadas
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      blockedRooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {room.room}
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            <div className="truncate max-w-[200px] sm:max-w-none">
                              {room.reason}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden md:table-cell">
                            {room.blockedUntil}
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden lg:table-cell">
                            {room.blockedBy}
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <button
                                onClick={() => handleReleaseRoom(room.id)}
                                className="p-1.5 sm:p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                title="Liberar habitación"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Registrar Cambio de Briquetas */}
      <Modal isOpen={isChangeModalOpen} onClose={closeChangeModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-black lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Registrar Cambio de Briquetas
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Complete la información del cambio de briquetas en el sistema.
            </p>
          </div>
          <div className="px-2 space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Cantidad de Briquetas
              </label>
              <input
                type="number"
                placeholder="Ingrese la cantidad"
                value={changeForm.quantity}
                onChange={(e) => setChangeForm({ ...changeForm, quantity: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Fecha
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={changeForm.date}
                  onChange={(e) => setChangeForm({ ...changeForm, date: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6 [&::-webkit-calendar-picker-indicator]:z-10"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Hora
              </label>
              <input
                type="time"
                value={changeForm.time}
                onChange={(e) => setChangeForm({ ...changeForm, time: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Estado Operativo
              </label>
              <select 
                value={changeForm.operationalStatus}
                onChange={(e) => setChangeForm({ ...changeForm, operationalStatus: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              >
                <option>Operativo</option>
                <option>En Mantenimiento</option>
                <option>Fuera de Servicio</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeChangeModal}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleChangeBriquettes} className="bg-orange-500 hover:bg-orange-600">
              Registrar Cambio
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Bloquear Habitación */}
      <Modal isOpen={isBlockModalOpen} onClose={closeBlockModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-black lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Bloquear Habitación
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Complete la información para bloquear la habitación por mantenimiento.
            </p>
          </div>
          <div className="px-2 space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Habitación <span className="text-red-600">*</span>
              </label>
              <select
                value={blockForm.room}
                onChange={(e) => setBlockForm({ ...blockForm, room: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                required
              >
                <option value="">Seleccione una habitación</option>
                {allRooms
                  .sort((a, b) => {
                    // Ordenar por piso primero, luego por código
                    if (a.floor !== b.floor) return a.floor - b.floor;
                    return String(a.code).localeCompare(String(b.code));
                  })
                  .map((room) => (
                    <option key={room.code} value={room.code}>
                      {room.code} - Piso {room.floor} {room.type ? `(${room.type})` : ''}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Razón de Bloqueo
              </label>
              <textarea
                rows="3"
                placeholder="Describa el motivo del bloqueo"
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 resize-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Fecha Estimada de Liberación
              </label>
              <input
                type="date"
                value={blockForm.blockedUntil}
                onChange={(e) => setBlockForm({ ...blockForm, blockedUntil: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Bloqueado Por
              </label>
              <input
                type="text"
                placeholder="Nombre del responsable"
                value={blockForm.blockedBy}
                readOnly
                className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 cursor-not-allowed dark:bg-gray-900 dark:text-white dark:border-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Se usa automáticamente el nombre del usuario logueado
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeBlockModal}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleBlockRoom} className="bg-gray-600 hover:bg-gray-700">
              Bloquear Habitación
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Reportar Incidencia */}
      <Modal isOpen={isIncidenceModalOpen} onClose={closeIncidenceModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-black lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Reportar Incidencia
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Complete la información de la incidencia de mantenimiento.
            </p>
          </div>
          <div className="px-2 space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Habitación/Área
              </label>
              <input
                type="text"
                placeholder="Ej: Habitación 301, Pasillo 2do piso"
                value={issueForm.room}
                onChange={(e) => setIssueForm({ ...issueForm, room: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Problema
              </label>
              <textarea
                rows="3"
                placeholder="Describa el problema en detalle"
                value={issueForm.problem}
                onChange={(e) => setIssueForm({ ...issueForm, problem: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 resize-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Prioridad
              </label>
              <select 
                value={issueForm.priority}
                onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              >
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeIncidenceModal}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleReportIncidence} className="bg-red-600 hover:bg-red-700">
              Reportar Incidencia
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

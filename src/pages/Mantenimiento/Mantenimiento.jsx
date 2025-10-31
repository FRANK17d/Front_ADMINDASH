import { useEffect, useState } from "react";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon, LockIcon } from "../../icons";
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

export default function Mantenimiento() {
  const { isOpen: isChangeModalOpen, openModal: openChangeModal, closeModal: closeChangeModal } = useModal();
  const { isOpen: isBlockModalOpen, openModal: openBlockModal, closeModal: closeBlockModal } = useModal();
  const { isOpen: isIncidenceModalOpen, openModal: openIncidenceModal, closeModal: closeIncidenceModal } = useModal();
  const [activeTab, setActiveTab] = useState("system");

  useEffect(() => {
    document.title = "Mantenimiento Técnico - Administrador - Hotel Plaza Trujillo";
  }, []);

  // Estado del sistema de agua caliente
  const waterHeatingSystem = {
    operationalStatus: "Operativo",
    briquettesThisMonth: 45,
    lastMaintenance: "2025-01-15",
    nextMaintenance: "2025-02-15",
  };

  // Historial de briquetas
  const briquettesHistory = [
    {
      id: 1,
      date: "2025-01-28",
      time: "10:30 AM",
      location: "Caldera Principal",
      technician: "Juan Pérez",
      quantity: 15,
    },
    {
      id: 2,
      date: "2025-01-25",
      time: "09:15 AM",
      location: "Caldera Principal",
      technician: "Carlos Gómez",
      quantity: 12,
    },
    {
      id: 3,
      date: "2025-01-22",
      time: "02:45 PM",
      location: "Caldera Secundaria",
      technician: "Ana Martínez",
      quantity: 18,
    },
    {
      id: 4,
      date: "2025-01-18",
      time: "11:20 AM",
      location: "Caldera Principal",
      technician: "Juan Pérez",
      quantity: 14,
    },
  ];

  // Incidencias de mantenimiento
  const maintenanceIssues = [
    {
      id: 1,
      room: "Habitación 201",
      problem: "Fuga en sistema de agua",
      priority: "Alta",
      status: "En Proceso",
      reportedDate: "2025-01-28",
      technician: "Juan Pérez",
    },
    {
      id: 2,
      room: "Habitación 305",
      problem: "Aire acondicionado no funciona",
      priority: "Media",
      status: "Pendiente",
      reportedDate: "2025-01-27",
      technician: "-",
    },
    {
      id: 3,
      room: "Suite 402",
      problem: "Problema eléctrico en sala",
      priority: "Alta",
      status: "Resuelto",
      reportedDate: "2025-01-26",
      technician: "Carlos Gómez",
    },
    {
      id: 4,
      room: "Habitación 108",
      problem: "Cerradura defectuosa",
      priority: "Baja",
      status: "En Proceso",
      reportedDate: "2025-01-28",
      technician: "Ana Martínez",
    },
    {
      id: 5,
      room: "Habitación 215",
      problem: "Cortinas con falla",
      priority: "Baja",
      status: "Pendiente",
      reportedDate: "2025-01-27",
      technician: "-",
    },
  ];

  // Habitaciones bloqueadas
  const blockedRooms = [
    {
      id: 1,
      room: "Habitación 201",
      reason: "Mantenimiento de plomería",
      blockedDate: "2025-01-28",
      estimatedRelease: "2025-01-30",
      technician: "Juan Pérez",
    },
    {
      id: 2,
      room: "Habitación 108",
      reason: "Reparación de cerradura",
      blockedDate: "2025-01-28",
      estimatedRelease: "2025-01-29",
      technician: "Ana Martínez",
    },
    {
      id: 3,
      room: "Suite 402",
      reason: "Reparación eléctrica",
      blockedDate: "2025-01-26",
      estimatedRelease: "2025-01-28",
      technician: "Carlos Gómez",
    },
  ];

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

  const handleReleaseRoom = (roomId) => {
    console.log("Liberar habitación:", roomId);
    // Aquí iría la lógica para liberar la habitación
  };

  const handleChangeBriquettes = () => {
    console.log("Registrar cambio de briquetas");
    closeChangeModal();
  };

  const handleBlockRoom = () => {
    console.log("Bloquear habitación");
    closeBlockModal();
  };

  const handleReportIncidence = () => {
    console.log("Reportar incidencia");
    closeIncidenceModal();
  };

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
                      Último Mantenimiento
                    </span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                      {waterHeatingSystem.lastMaintenance}
                    </h4>
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
                      Próximo Mantenimiento
                    </span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                      {waterHeatingSystem.nextMaintenance}
                    </h4>
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
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                      >
                        Ubicación
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Técnico
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Cantidad
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
                    {briquettesHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {record.date}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {record.time}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden md:table-cell">
                          {record.location}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {record.technician}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                          {record.quantity} unid.
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 sm:p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                      >
                        Estado
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                      >
                        Técnico
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
                    {maintenanceIssues.map((issue) => (
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
                        <TableCell className="py-3.5 px-2 sm:px-4">
                          <Badge size="sm" color={getStatusBadgeColor(issue.status)}>
                            {issue.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden lg:table-cell">
                          {issue.technician}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden lg:table-cell">
                          {issue.reportedDate}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 sm:p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors hidden lg:inline-block"
                              title="Eliminar"
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
                        Fecha Bloqueo
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                      >
                        Liberación Estimada
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                      >
                        Técnico
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
                    {blockedRooms.map((room) => (
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
                          {room.blockedDate}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden md:table-cell">
                          {room.estimatedRelease}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden lg:table-cell">
                          {room.technician}
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
                            <button
                              className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 sm:p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Registrar Cambio de Briquetas */}
      <Modal isOpen={isChangeModalOpen} onClose={closeChangeModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
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
                Ubicación
              </label>
              <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                <option>Caldera Principal</option>
                <option>Caldera Secundaria</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Técnico
              </label>
              <input
                type="text"
                placeholder="Nombre del técnico"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Cantidad de Briquetas
              </label>
              <input
                type="number"
                placeholder="Ingrese la cantidad"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Fecha
              </label>
              <input
                type="date"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Hora
              </label>
              <input
                type="time"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
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
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
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
                Habitación
              </label>
              <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                <option>Seleccione una habitación</option>
                <option>Habitación 101</option>
                <option>Habitación 102</option>
                <option>Suite 201</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Razón de Bloqueo
              </label>
              <textarea
                rows="3"
                placeholder="Describa el motivo del bloqueo"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 resize-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Técnico Asignado
              </label>
              <input
                type="text"
                placeholder="Nombre del técnico"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Fecha Estimada de Liberación
              </label>
              <input
                type="date"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
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
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
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
                Habitación
              </label>
              <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                <option>Seleccione una habitación</option>
                <option>Habitación 101</option>
                <option>Habitación 102</option>
                <option>Suite 201</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Problema
              </label>
              <textarea
                rows="3"
                placeholder="Describa el problema"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 resize-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Prioridad
              </label>
              <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Técnico Asignado (Opcional)
              </label>
              <input
                type="text"
                placeholder="Dejar vacío para asignar después"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
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

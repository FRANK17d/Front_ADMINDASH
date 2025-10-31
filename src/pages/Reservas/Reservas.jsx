import { useEffect, useState, useRef } from "react";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "../../icons";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
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

export default function Reservas() {
  const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useModal();
  const { isOpen: isViewModalOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();
  const [viewingReservation, setViewingReservation] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("rooms"); // "rooms" or "reservations"
  const calendarRef = useRef(null);

  useEffect(() => {
    document.title = "Reservas - Administrador - Hotel Plaza Trujillo";
    
    // Inicializar eventos de calendario con reservas de ejemplo
    setEvents([
      {
        id: "1",
        title: "Carlos Mendoza - Suite 201",
        start: "2025-01-15",
        end: "2025-01-18",
        extendedProps: { calendar: "Booking" },
      },
      {
        id: "2",
        title: "Ana García - Hab. 105",
        start: "2025-01-20",
        end: "2025-01-23",
        extendedProps: { calendar: "WhatsApp" },
      },
      {
        id: "3",
        title: "Roberto Silva - Suite 302",
        start: "2025-01-25",
        end: "2025-01-28",
        extendedProps: { calendar: "DirectSale" },
      },
      {
        id: "4",
        title: "Mantenimiento - Hab. 208",
        start: "2025-01-10",
        end: "2025-01-12",
        extendedProps: { calendar: "Maintenance" },
      },
    ]);
  }, []);

  // Tarjetas de estado de habitaciones
  const roomStatusCards = [
    {
      id: 1,
      title: "Disponibles",
      count: 45,
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      id: 2,
      title: "Ocupadas",
      count: 68,
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: 3,
      title: "Reservadas",
      count: 32,
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      id: 4,
      title: "Mantenimiento",
      count: 15,
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bgColor: "bg-gray-100 dark:bg-gray-800",
      iconColor: "text-gray-600 dark:text-gray-400",
    },
  ];

  // Tabla de estado de habitaciones
  const roomsTable = [
    {
      id: 1,
      room: "101",
      type: "Individual",
      floor: "1ro",
      status: "Disponible",
      guest: "-",
      checkout: "-",
      price: "S/ 180",
    },
    {
      id: 2,
      room: "102",
      type: "Individual",
      floor: "1ro",
      status: "Ocupada",
      guest: "María Torres",
      checkout: "2025-01-15",
      price: "S/ 180",
    },
    {
      id: 3,
      room: "201",
      type: "Doble",
      floor: "2do",
      status: "Reservada",
      guest: "Carlos Mendoza",
      checkout: "2025-01-18",
      price: "S/ 245",
    },
    {
      id: 4,
      room: "202",
      type: "Suite",
      floor: "2do",
      status: "Mantenimiento",
      guest: "-",
      checkout: "-",
      price: "S/ 320",
    },
    {
      id: 5,
      room: "301",
      type: "Suite",
      floor: "3ro",
      status: "Disponible",
      guest: "-",
      checkout: "-",
      price: "S/ 320",
    },
    {
      id: 6,
      room: "302",
      type: "Suite",
      floor: "3ro",
      status: "Ocupada",
      guest: "Roberto Silva",
      checkout: "2025-01-20",
      price: "S/ 320",
    },
  ];

  // Tabla de reservas activas
  const activeReservations = [
    {
      id: 1,
      reservationId: "RES-001",
      channel: "Booking.com",
      guest: "Carlos Mendoza",
      room: "Suite 201",
      checkIn: "2025-01-15",
      checkOut: "2025-01-18",
      total: "S/ 960",
      status: "Confirmada",
      paid: true,
    },
    {
      id: 2,
      reservationId: "RES-002",
      channel: "WhatsApp",
      guest: "Ana García López",
      room: "Hab. 105",
      checkIn: "2025-01-20",
      checkOut: "2025-01-23",
      total: "S/ 735",
      status: "Check-in",
      paid: true,
    },
    {
      id: 3,
      reservationId: "RES-003",
      channel: "Venta Directa",
      guest: "Roberto Silva",
      room: "Suite 302",
      checkIn: "2025-01-25",
      checkOut: "2025-01-28",
      total: "S/ 960",
      status: "Confirmada",
      paid: false,
    },
    {
      id: 4,
      reservationId: "RES-004",
      channel: "Booking.com",
      guest: "Luis Ramírez",
      room: "Hab. 110",
      checkIn: "2025-01-31",
      checkOut: "2025-02-03",
      total: "S/ 735",
      status: "Confirmada",
      paid: true,
    },
  ];

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Disponible":
        return "success";
      case "Ocupada":
        return "warning";
      case "Reservada":
        return "primary";
      case "Mantenimiento":
        return "light";
      case "Confirmada":
        return "success";
      case "Check-in":
        return "warning";
      default:
        return "light";
    }
  };

  const handleViewReservation = (reservation) => {
    setViewingReservation(reservation);
    openViewModal();
  };

  const renderEventContent = (eventInfo) => {
    const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
    return (
      <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
        <div className="fc-daygrid-event-dot"></div>
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title truncate">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con botón crear reserva */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Gestión de Reservas
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Administra todas las reservas y habitaciones del hotel
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5 fill-current" />
          Nueva Reserva
        </Button>
      </div>

      {/* Tarjetas de estado de habitaciones */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roomStatusCards.map((card) => (
          <div
            key={card.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6"
          >
            <div className={`flex items-center justify-center w-12 h-12 ${card.bgColor} rounded-xl`}>
              <div className={card.iconColor}>{card.icon}</div>
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {card.title}
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {card.count} Hab.
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla con Pestañas */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap px-5 sm:px-6 pt-5 gap-4">
            <button
              onClick={() => setActiveTab("rooms")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                activeTab === "rooms"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Estado de Habitaciones
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                activeTab === "reservations"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Reservas Activas
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {activeTab === "rooms" && (
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
                        Tipo
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                      >
                        Piso
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Estado
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                      >
                        Huésped
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                      >
                        Check-out
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                      >
                        Precio/Noche
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
                    {roomsTable.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {room.room}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {room.type}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden md:table-cell">
                          {room.floor}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4">
                          <Badge size="sm" color={getStatusBadgeColor(room.status)}>
                            {room.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden lg:table-cell">
                          {room.guest}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden lg:table-cell">
                          {room.checkout}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90 hidden md:table-cell">
                          {room.price}
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

          {activeTab === "reservations" && (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        ID Reserva
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                      >
                        Canal
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Huésped
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                      >
                        Habitación
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                      >
                        Check-in
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                      >
                        Check-out
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                      >
                        Total
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                      >
                        Estado
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 hidden xl:table-cell"
                      >
                        Pagado
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
                    {activeReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          <div className="truncate max-w-[80px] sm:max-w-none">
                            {reservation.reservationId}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 hidden lg:table-cell">
                          <Badge
                            size="sm"
                            color={
                              reservation.channel === "Booking.com"
                                ? "purple"
                                : reservation.channel === "WhatsApp"
                                ? "green"
                                : "warning"
                            }
                          >
                            {reservation.channel}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          <div className="truncate max-w-[120px] sm:max-w-none">
                            {reservation.guest}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden md:table-cell">
                          {reservation.room}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-gray-300 hidden lg:table-cell">
                          {reservation.checkIn}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-gray-300 hidden lg:table-cell">
                          {reservation.checkOut}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90 hidden md:table-cell">
                          {reservation.total}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4">
                          <Badge size="sm" color={getStatusBadgeColor(reservation.status)}>
                            {reservation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 hidden xl:table-cell">
                          {reservation.paid ? (
                            <Badge size="sm" color="success">Sí</Badge>
                          ) : (
                            <Badge size="sm" color="error">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={() => handleViewReservation(reservation)}
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
                              title="Cancelar"
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
        </div>
      </div>

      {/* Calendario de Reservas */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Calendario de Reservas
          </h3>
          <p className="text-gray-500 text-theme-sm dark:text-gray-400 mb-4">
            Visualiza todas las reservas por canal de reserva
          </p>
          <div className="custom-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={events}
              eventContent={renderEventContent}
              height="auto"
            />
          </div>
        </div>
      </div>

      {/* Modal Crear Reserva */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Nueva Reserva
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Complete la información para crear una nueva reserva
            </p>
          </div>
          <div className="px-2">
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Canal de Reserva
                </label>
                <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                  <option>Booking.com</option>
                  <option>WhatsApp</option>
                  <option>Venta Directa</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Huésped
                </label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Habitación
                </label>
                <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                  <option>Suite 201</option>
                  <option>Hab. 105</option>
                  <option>Suite 302</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Check-in
                  </label>
                  <input
                    type="date"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Check-out
                  </label>
                  <input
                    type="date"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeCreateModal}>
              Cancelar
            </Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              Crear Reserva
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal isOpen={isViewModalOpen} onClose={closeViewModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Detalles de Reserva
            </h4>
          </div>
          {viewingReservation && (
            <div className="px-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ID Reserva</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {viewingReservation.reservationId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Canal</p>
                  <Badge size="sm">
                    {viewingReservation.channel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Huésped</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {viewingReservation.guest}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Habitación</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {viewingReservation.room}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check-in</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {viewingReservation.checkIn}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check-out</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {viewingReservation.checkOut}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">
                    {viewingReservation.total}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                  <Badge size="sm" color={getStatusBadgeColor(viewingReservation.status)}>
                    {viewingReservation.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeViewModal}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

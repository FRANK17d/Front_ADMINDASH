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
  const { isOpen: isEntryModalOpen, openModal: openEntryModal, closeModal: closeEntryModal } = useModal();
  const { isOpen: isAccountModalOpen, openModal: openAccountModal, closeModal: closeAccountModal } = useModal();
  const { isOpen: isComandaModalOpen, openModal: openComandaModal, closeModal: closeComandaModal } = useModal();
  const { isOpen: isBreakfastModalOpen, openModal: openBreakfastModal, closeModal: closeBreakfastModal } = useModal();
  const [viewingReservation, setViewingReservation] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("rooms");
  const calendarRef = useRef(null);
  const [entryForm, setEntryForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telcel: "",
    documento: "",
    nacionalidad: "",
    profesion: "",
    ocupacion: "",
    direccion: "",
    empresa: "",
    ruc: "",
    lugarNacimiento: "",
    fechaNacimiento: "",
    medioTransporte: "",
    procedencia: "",
    destino: "",
    tarifa: "",
    pago: "Efectivo",
    habitacion: "",
    llegadaHora: "",
    salidaHora: "",
  });
  const [entryPreview, setEntryPreview] = useState(null);
  const [selectedReservationForAccount, setSelectedReservationForAccount] = useState(null);
  const [ledgerItems, setLedgerItems] = useState([]);
  const [newLedgerItem, setNewLedgerItem] = useState({ concept: "Alojamiento", date: "", comprobante: "", amount: "" });
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [pagosCuenta, setPagosCuenta] = useState(0);
  const [comanda, setComanda] = useState({ numero: "", fecha: "", categoria: "Cafeteria", habitacion: "", senor: "" });
  const [comandaItems, setComandaItems] = useState([{ id: `ci${Date.now()}`, cant: 1, detalle: "", importe: "" }]);
  const [breakfastForm, setBreakfastForm] = useState({ empleado: "", fecha: "" });
  const [breakfastRows, setBreakfastRows] = useState([
    { id: "b1", hab: "111", tipo: "", nombres: "", pax: 1, americ: 0, contin: 1, normal: 1, adici: 0 },
    { id: "b2", hab: "112", tipo: "", nombres: "", pax: 2, americ: 2, contin: 0, normal: 2, adici: 0 },
  ]);

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

  useEffect(() => {
    setSelectedReservationForAccount(activeReservations[0] || null);
    setLedgerItems([
      { id: "l1", concept: "Alojamiento", date: "2025-01-15", comprobante: "FACT", amount: 320 },
      { id: "l2", concept: "Alojamiento", date: "2025-01-16", comprobante: "FACT", amount: 320 },
      { id: "l3", concept: "Lavandería - Planchado", date: "2025-01-16", comprobante: "B/V", amount: 25 },
      { id: "l4", concept: "Restaurante", date: "2025-01-16", comprobante: "B/V", amount: 60 },
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

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    setEntryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEntrySubmit = (e) => {
    e.preventDefault();
    setEntryPreview(entryForm);
    openEntryModal();
  };

  const handleAccountItemChange = (e) => {
    const { name, value } = e.target;
    setNewLedgerItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAccountItem = () => {
    if (!newLedgerItem.concept || !newLedgerItem.date || !newLedgerItem.amount) return;
    const item = {
      id: `l${Date.now()}`,
      concept: newLedgerItem.concept,
      date: newLedgerItem.date,
      comprobante: newLedgerItem.comprobante,
      amount: Number(newLedgerItem.amount),
    };
    setLedgerItems((prev) => [...prev, item]);
    setNewLedgerItem({ concept: "Alojamiento", date: "", comprobante: "", amount: "" });
    closeAccountModal();
  };

  const handleRemoveAccountItem = (id) => {
    setLedgerItems((prev) => prev.filter((i) => i.id !== id));
  };

  const totalDia = ledgerItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const acumuladoDia = Number(saldoAnterior || 0) + totalDia;
  const saldo = acumuladoDia - Number(pagosCuenta || 0);

  const handleComandaChange = (e) => {
    const { name, value } = e.target;
    setComanda((prev) => ({ ...prev, [name]: value }));
  };

  const handleComandaItemChange = (id, field, value) => {
    setComandaItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const addComandaItem = () => {
    setComandaItems((prev) => [...prev, { id: `ci${Date.now()}`, cant: 1, detalle: "", importe: "" }]);
  };

  const removeComandaItem = (id) => {
    setComandaItems((prev) => prev.filter((it) => it.id !== id));
  };

  const comandaTotal = comandaItems.reduce((sum, it) => sum + Number(it.importe || 0), 0);

  const saveComanda = () => {
    const concept = `Comanda - ${comanda.categoria}`;
    const item = { id: `lc${Date.now()}`, concept, date: comanda.fecha || new Date().toISOString().slice(0, 10), comprobante: "B/V", amount: comandaTotal };
    setLedgerItems((prev) => [...prev, item]);
    closeComandaModal();
  };

  const handleBreakfastChange = (e) => {
    const { name, value } = e.target;
    setBreakfastForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBreakfastRowChange = (id, field, value) => {
    setBreakfastRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addBreakfastRow = () => {
    setBreakfastRows((prev) => [...prev, { id: `b${Date.now()}`, hab: "", tipo: "", nombres: "", pax: 1, americ: 0, contin: 0, normal: 1, adici: 0 }]);
  };

  const removeBreakfastRow = (id) => {
    setBreakfastRows((prev) => prev.filter((r) => r.id !== id));
  };

  const breakfastTotals = breakfastRows.reduce(
    (acc, r) => {
      acc.pax += Number(r.pax || 0);
      acc.americ += Number(r.americ || 0);
      acc.contin += Number(r.contin || 0);
      acc.normal += Number(r.normal || 0);
      acc.adici += Number(r.adici || 0);
      return acc;
    },
    { pax: 0, americ: 0, contin: 0, normal: 0, adici: 0 }
  );

  const saveBreakfastReport = () => {
    closeBreakfastModal();
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
            <button
              onClick={() => setActiveTab("entry")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                activeTab === "entry"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4H8a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2z" />
              </svg>
              Ficha de Entrada
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                activeTab === "account"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              Estado de Cuenta
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {activeTab === "rooms" && (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Habitaciones</h3>
                    <p className="text-gray-500 text-theme-sm dark:text-gray-400">Listado actual de ocupación</p>
                  </div>
                  <Button onClick={openBreakfastModal} variant="outline" className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3 0 2.5 3 5 3 5s3-2.5 3-5c0-1.657-1.343-3-3-3zm0-6v4m0 12v4m-8-8h4m8 0h4"/></svg>
                    Reporte de Desayunos
                  </Button>
                </div>
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

          {activeTab === "entry" && (
            <div className="max-w-(--breakpoint-2xl)">
              <form onSubmit={handleEntrySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Nombres</label>
                    <input name="nombres" value={entryForm.nombres} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Apellidos</label>
                    <input name="apellidos" value={entryForm.apellidos} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Email</label>
                    <input name="email" value={entryForm.email} onChange={handleEntryChange} type="email" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Tel/Cel</label>
                    <input name="telcel" value={entryForm.telcel} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Documento de Identidad</label>
                    <input name="documento" value={entryForm.documento} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Nacionalidad</label>
                    <input name="nacionalidad" value={entryForm.nacionalidad} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Profesión</label>
                    <input name="profesion" value={entryForm.profesion} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Ocupación</label>
                    <input name="ocupacion" value={entryForm.ocupacion} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Dirección</label>
                    <input name="direccion" value={entryForm.direccion} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Lugar de Nacimiento</label>
                    <input name="lugarNacimiento" value={entryForm.lugarNacimiento} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Fecha de Nacimiento</label>
                    <input name="fechaNacimiento" value={entryForm.fechaNacimiento} onChange={handleEntryChange} type="date" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Tarifa</label>
                    <input name="tarifa" value={entryForm.tarifa} onChange={handleEntryChange} type="text" placeholder="S/ 0.00" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Medio de Transporte</label>
                    <input name="medioTransporte" value={entryForm.medioTransporte} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Procedencia</label>
                    <input name="procedencia" value={entryForm.procedencia} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Destino</label>
                    <input name="destino" value={entryForm.destino} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Habitación</label>
                    <input name="habitacion" value={entryForm.habitacion} onChange={handleEntryChange} type="text" placeholder="Ej. Suite 201" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Llegada (Hora)</label>
                    <input name="llegadaHora" value={entryForm.llegadaHora} onChange={handleEntryChange} type="time" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Salida (Hora)</label>
                    <input name="salidaHora" value={entryForm.salidaHora} onChange={handleEntryChange} type="time" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Pago</label>
                    <select name="pago" value={entryForm.pago} onChange={handleEntryChange} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Empresa</label>
                    <input name="empresa" value={entryForm.empresa} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">RUC</label>
                    <input name="ruc" value={entryForm.ruc} onChange={handleEntryChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <Button size="sm" variant="outline" type="button" onClick={() => setEntryForm({
                    nombres: "",
                    apellidos: "",
                    email: "",
                    telcel: "",
                    documento: "",
                    nacionalidad: "",
                    profesion: "",
                    ocupacion: "",
                    direccion: "",
                    empresa: "",
                    ruc: "",
                    lugarNacimiento: "",
                    fechaNacimiento: "",
                    medioTransporte: "",
                    procedencia: "",
                    destino: "",
                    tarifa: "",
                    pago: "Efectivo",
                    habitacion: "",
                    llegadaHora: "",
                    salidaHora: "",
                  })}>Limpiar</Button>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600" type="submit">Guardar Ficha</Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Reserva</label>
                  <select
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                    value={selectedReservationForAccount?.id || ""}
                    onChange={(e) => {
                      const found = activeReservations.find((r) => String(r.id) === e.target.value);
                      setSelectedReservationForAccount(found || null);
                    }}
                  >
                    {activeReservations.map((r) => (
                      <option key={r.id} value={r.id}>{`${r.guest} - ${r.room}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Pagos a Cuenta</label>
                  <input
                    type="number"
                    value={pagosCuenta}
                    onChange={(e) => setPagosCuenta(Number(e.target.value))}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Saldo Anterior</label>
                  <input
                    type="number"
                    value={saldoAnterior}
                    onChange={(e) => setSaldoAnterior(Number(e.target.value))}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Movimientos</h3>
                  <p className="text-gray-500 text-theme-sm dark:text-gray-400">Detalle de consumos por concepto</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={openAccountModal} className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
                    <PlusIcon className="w-5 h-5 fill-current" />
                    Agregar Movimiento
                  </Button>
                  <Button onClick={openComandaModal} variant="outline" className="flex items-center gap-2">
                    <PlusIcon className="w-5 h-5 fill-current" />
                    Nueva Comanda
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                      <TableRow>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Concepto</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell">Fecha</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell">FACT/BV</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Monto</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {ledgerItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">{item.concept}</TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden md:table-cell">{item.date}</TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden lg:table-cell">{item.comprobante}</TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">S/ {Number(item.amount).toFixed(2)}</TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleRemoveAccountItem(item.id)} className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Total Día</span>
                      <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">S/ {totalDia.toFixed(2)}</h4>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Acumulado del Día</span>
                      <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">S/ {acumuladoDia.toFixed(2)}</h4>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Saldo</span>
                      <h4 className="mt-2 font-bold text-orange-600 text-title-sm dark:text-orange-400">S/ {saldo.toFixed(2)}</h4>
                    </div>
                  </div>
                </div>
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

      <Modal isOpen={isEntryModalOpen} onClose={closeEntryModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Ficha de Entrada</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Vista previa</p>
          </div>
          {entryPreview && (
            <div className="px-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nombres</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.nombres}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Apellidos</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.apellidos}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tel/Cel</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.telcel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Documento</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.documento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nacionalidad</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.nacionalidad}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Profesión</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.profesion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ocupación</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.ocupacion}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dirección</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.direccion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lugar de Nacimiento</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.lugarNacimiento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Nacimiento</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.fechaNacimiento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tarifa</p>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">{entryPreview.tarifa}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Medio de Transporte</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.medioTransporte}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Procedencia</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.procedencia}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Destino</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.destino}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Habitación</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.habitacion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Llegada</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.llegadaHora}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Salida</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.salidaHora}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pago</p>
                  <Badge size="sm">{entryPreview.pago}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Empresa</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.empresa}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">RUC</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{entryPreview.ruc}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeEntryModal}>Cerrar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAccountModalOpen} onClose={closeAccountModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Nuevo Movimiento</h4>
          </div>
          <div className="px-2 space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Concepto</label>
              <select name="concept" value={newLedgerItem.concept} onChange={handleAccountItemChange} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                <option>Alojamiento</option>
                <option>Restaurante</option>
                <option>Bar - Cafetería</option>
                <option>Teléfono - Fax</option>
                <option>Lavandería - Planchado</option>
                <option>Cochera</option>
                <option>Frio Bar</option>
                <option>Bazar</option>
                <option>Otros</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Fecha</label>
                <input name="date" value={newLedgerItem.date} onChange={handleAccountItemChange} type="date" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">FACT/BV</label>
                <input name="comprobante" value={newLedgerItem.comprobante} onChange={handleAccountItemChange} type="text" placeholder="FACT o B/V" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Monto</label>
              <input name="amount" value={newLedgerItem.amount} onChange={handleAccountItemChange} type="number" step="0.01" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeAccountModal}>Cancelar</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={handleAddAccountItem}>Agregar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isComandaModalOpen} onClose={closeComandaModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Comanda</h4>
          </div>
          <div className="px-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">N°</label>
                <input name="numero" value={comanda.numero} onChange={handleComandaChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Fecha</label>
                <input name="fecha" value={comanda.fecha} onChange={handleComandaChange} type="date" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Habitación</label>
                <input name="habitacion" value={comanda.habitacion} onChange={handleComandaChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
              <div className="col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Señor</label>
                <input name="senor" value={comanda.senor} onChange={handleComandaChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Categoría</label>
              <select name="categoria" value={comanda.categoria} onChange={handleComandaChange} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                <option>Bazar</option>
                <option>Frio Bar</option>
                <option>Cafeteria</option>
                <option>Movilidad</option>
                <option>Vitrina</option>
                <option>Impresion</option>
                <option>Otros</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Cant.</th>
                    <th className="py-2 pr-4">Detalle</th>
                    <th className="py-2 pr-4">Importe</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {comandaItems.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 pr-4"><input type="number" min="1" value={it.cant} onChange={(e) => handleComandaItemChange(it.id, "cant", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="text" value={it.detalle} onChange={(e) => handleComandaItemChange(it.id, "detalle", e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="number" step="0.01" value={it.importe} onChange={(e) => handleComandaItemChange(it.id, "importe", e.target.value)} className="h-10 w-32 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2"><button onClick={() => removeComandaItem(it.id)} className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg">Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={addComandaItem}>Añadir ítem</Button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-6">
              <div className="text-sm text-gray-700 dark:text-gray-400">Total S/. <span className="font-semibold text-gray-800 dark:text-white">{comandaTotal.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeComandaModal}>Cancelar</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={saveComanda}>Guardar Comanda</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBreakfastModalOpen} onClose={closeBreakfastModal} className="max-w-[900px] m-4">
        <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Reporte de Desayunos</h4>
          </div>
          <div className="px-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Empleado</label>
                <input name="empleado" value={breakfastForm.empleado} onChange={handleBreakfastChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Fecha</label>
                <input name="fecha" value={breakfastForm.fecha} onChange={handleBreakfastChange} type="date" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Hab</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Nombres y Apellidos</th>
                    <th className="py-2 pr-4">N° Pax</th>
                    <th className="py-2 pr-4">Americ.</th>
                    <th className="py-2 pr-4">Contin.</th>
                    <th className="py-2 pr-4">Normal</th>
                    <th className="py-2 pr-4">Adici.</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {breakfastRows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-4"><input type="text" value={r.hab} onChange={(e) => handleBreakfastRowChange(r.id, "hab", e.target.value)} className="h-10 w-20 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="text" value={r.tipo} onChange={(e) => handleBreakfastRowChange(r.id, "tipo", e.target.value)} className="h-10 w-24 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="text" value={r.nombres} onChange={(e) => handleBreakfastRowChange(r.id, "nombres", e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="number" min="1" value={r.pax} onChange={(e) => handleBreakfastRowChange(r.id, "pax", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="number" min="0" value={r.americ} onChange={(e) => handleBreakfastRowChange(r.id, "americ", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="number" min="0" value={r.contin} onChange={(e) => handleBreakfastRowChange(r.id, "contin", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="number" min="0" value={r.normal} onChange={(e) => handleBreakfastRowChange(r.id, "normal", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="number" min="0" value={r.adici} onChange={(e) => handleBreakfastRowChange(r.id, "adici", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2"><button onClick={() => removeBreakfastRow(r.id)} className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg">Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={addBreakfastRow}>Añadir fila</Button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-400">Total Pax: <span className="font-semibold">{breakfastTotals.pax}</span></div>
              <div className="text-sm text-gray-700 dark:text-gray-400">Americ.: <span className="font-semibold">{breakfastTotals.americ}</span></div>
              <div className="text-sm text-gray-700 dark:text-gray-400">Contin.: <span className="font-semibold">{breakfastTotals.contin}</span></div>
              <div className="text-sm text-gray-700 dark:text-gray-400">Normal: <span className="font-semibold">{breakfastTotals.normal}</span></div>
              <div className="text-sm text-gray-700 dark:text-gray-400">Adici.: <span className="font-semibold">{breakfastTotals.adici}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeBreakfastModal}>Cancelar</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={saveBreakfastReport}>Guardar Reporte</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

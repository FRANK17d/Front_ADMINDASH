import { useEffect, useState, useRef, useMemo } from "react";
 
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "../../icons";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../styles/big-calendar.css";
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
import { listReservations, getCalendarEvents, getCalendarNotes, setCalendarNote, deleteCalendarNote, createReservation, lookupDocument, getAvailableRooms, deleteReservation, updateReservation } from "../../api/reservations";
import { getBlockedRooms } from "../../api/mantenimiento";
import { useAuth, ROLES } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from 'react-toastify';

export default function Reservas() {
  const { user, userRole } = useAuth();
  const isHousekeeping = userRole === ROLES.HOUSEKEEPING;
  const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useModal();
  const { isOpen: isViewModalOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();
  const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isAccountModalOpen, openModal: openAccountModal, closeModal: closeAccountModal } = useModal();
  const { isOpen: isComandaModalOpen, openModal: openComandaModal, closeModal: closeComandaModal } = useModal();
  const { isOpen: isBreakfastModalOpen, openModal: openBreakfastModal, closeModal: closeBreakfastModal } = useModal();
  const { isOpen: isConfirmModalOpen, openModal: openConfirmModal, closeModal: closeConfirmModal } = useModal();
  const { isOpen: isNoteModalOpen, openModal: openNoteModal, closeModal: closeNoteModal } = useModal();
  const [viewingReservation, setViewingReservation] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("rooms");
  const calendarRef = useRef(null);
  const checkInInputRef = useRef(null);
  const checkOutInputRef = useRef(null);
  const arrivalTimeInputRef = useRef(null);
  const departureTimeInputRef = useRef(null);
  const editCheckInInputRef = useRef(null);
  const editCheckOutInputRef = useRef(null);
  const editArrivalTimeInputRef = useRef(null);
  const editDepartureTimeInputRef = useRef(null);
  const [reservationPendingDeletion, setReservationPendingDeletion] = useState(null);
  
  const [activeReservations, setActiveReservations] = useState([]);
  const [blockedRooms, setBlockedRooms] = useState([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const initialReservation = { channel: "Booking.com", guest: "", room: "", roomType: "", checkIn: "", checkOut: "", total: "", status: "Confirmada", paid: false, documentType: "DNI", documentNumber: "", arrivalTime: "", departureTime: "", numPeople: 1, numAdults: 1, numChildren: 0, numRooms: 1, companions: [], documentInfo: null, address: "", department: "", province: "", district: "", taxpayerType: "", businessStatus: "", businessCondition: "" };
  const [newReservation, setNewReservation] = useState(initialReservation);
  const [editReservation, setEditReservation] = useState(null);
  const [editOriginalReservation, setEditOriginalReservation] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingBreakfast, setIsSavingBreakfast] = useState(false);
  const isCreateValid = Boolean(newReservation.checkIn && newReservation.checkOut && newReservation.room && newReservation.roomType && (newReservation.guest || newReservation.documentNumber));
  const [touched, setTouched] = useState({ checkIn: false, checkOut: false, room: false, roomType: false, guest: false, documentNumber: false });
  const [isDocLookupLoading, setIsDocLookupLoading] = useState(false);
  const [companionLookupIndex, setCompanionLookupIndex] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [editRooms, setEditRooms] = useState([]);
  const [selectedReservationForAccount, setSelectedReservationForAccount] = useState(null);
  const [ledgerItems, setLedgerItems] = useState([]);
  const [newLedgerItem, setNewLedgerItem] = useState({ concept: "Alojamiento", date: "", comprobante: "", amount: "" });
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [pagosCuenta, setPagosCuenta] = useState(0);
  const [dayNotes, setDayNotes] = useState({});
  const [noteDate, setNoteDate] = useState(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const items = await getCalendarNotes();
        const map = {};
        for (const it of items) { map[it.date] = it.text || ""; }
        setDayNotes(map);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);
  const [comanda, setComanda] = useState({ numero: "", fecha: "", categoria: "Cafeteria", habitacion: "", senor: "" });
  const [comandaItems, setComandaItems] = useState([{ id: `ci${Date.now()}`, cant: 1, detalle: "", importe: "" }]);
  const [breakfastForm, setBreakfastForm] = useState({ empleado: "", fecha: "" });
  const [breakfastRows, setBreakfastRows] = useState([
    { id: "b1", hab: "111", nombres: "", americ: 0, contin: 1, adici: 0 },
    { id: "b2", hab: "112", nombres: "", americ: 2, contin: 0, adici: 0 },
  ]);
  const [roomsFloorFilter, setRoomsFloorFilter] = useState('1ro');
  const [availableRoomsCount, setAvailableRoomsCount] = useState(0);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  moment.locale('es');
  const localizer = momentLocalizer(moment);
  const calendarFormats = {
    monthHeaderFormat: (date) => moment(date).locale('es').format('MMMM [de] YYYY'),
    dayHeaderFormat: (date) => moment(date).locale('es').format('dddd D [de] MMMM'),
    weekdayFormat: (date) => moment(date).locale('es').format('ddd'),
    dayFormat: (date) => moment(date).locale('es').format('D'),
    agendaHeaderFormat: ({ start, end }) => `${moment(start).locale('es').format('D [de] MMM')} – ${moment(end).locale('es').format('D [de] MMM')}`,
    agendaDateFormat: (date) => moment(date).locale('es').format('dddd D [de] MMMM'),
    agendaTimeFormat: (date) => moment(date).locale('es').format('HH:mm'),
    eventTimeRangeFormat: ({ start, end }) => `${moment(start).locale('es').format('HH:mm')} – ${moment(end).locale('es').format('HH:mm')}`,
  };
  const bigEvents = useMemo(() => {
    const toLocalDate = (s) => (s ? moment(String(s).slice(0,10), 'YYYY-MM-DD').toDate() : new Date());
    const mapped = (events || []).map((e) => {
      const id = e.id;
      const found = (activeReservations || []).find((r) => String(r.reservationId || r.id) === String(id));
      const status = found ? getAutoStatus(found) : "Confirmada";
      const startDate = toLocalDate(e.start);
      const endRaw = e.end || e.start;
      const endDate = moment(toLocalDate(endRaw)).add(1, 'day').toDate();
      return {
        id,
        title: e.title,
        start: startDate,
        end: endDate,
        status,
        allDay: true,
      };
    });
    return mapped.filter((ev) => ev.status !== 'Cancelada' && ev.status !== 'Check-out');
  }, [events, activeReservations]);
  const eventPropGetter = (event) => {
    const map = {
      Confirmada: "#22c55e",
      "Check-in": "#fb6514",
      "Check-out": "#6b7280",
      Cancelada: "#ef4444",
      Reservada: "#8b5cf6",
    };
    const bg = map[event.status] || "#0ea5e9";
    return { style: { backgroundColor: bg, border: "none", color: "#fff" } };
  };

  const dayPropGetter = (date) => {
    if (moment(date).isSame(moment(), 'day')) {
      return { style: { backgroundColor: '#1f2937', border: '2px solid #fb6514' } };
    }
    return {};
  };

  const DateHeaderWithNote = ({ label, date }) => {
    const ds = moment(date).format('YYYY-MM-DD');
    const note = dayNotes[ds];
    return (
      <div className="flex flex-col">
        <button type="button" className="rbc-button-link">{label}</button>
        {note ? <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300 truncate">{note}</div> : null}
      </div>
    );
  };

  const CustomToolbar = (toolbar) => {
    const d = toolbar.date instanceof Date ? toolbar.date : new Date(toolbar.date);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const label = `${months[d.getMonth()]} de ${d.getFullYear()}`;
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => toolbar.onNavigate('TODAY')}>Hoy</button>
          <button type="button" onClick={() => toolbar.onNavigate('PREV')}>Anterior</button>
          <button type="button" onClick={() => toolbar.onNavigate('NEXT')}>Siguiente</button>
        </span>
        <span className="rbc-toolbar-label">{label}</span>
        <span className="rbc-btn-group">
          <button type="button" className={toolbar.view === 'month' ? 'rbc-active' : ''} onClick={() => toolbar.onView('month')}>Mes</button>
          <button type="button" className={toolbar.view === 'agenda' ? 'rbc-active' : ''} onClick={() => toolbar.onView('agenda')}>Agenda</button>
        </span>
      </div>
    );
  };

  const MonthHeaderEs = ({ date }) => {
    const idx = moment(date).day();
    const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return <span>{labels[idx] || ''}</span>;
  };

  const GlobalHeaderEs = ({ date }) => {
    const idx = moment(date).day();
    const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return <span role="columnheader" aria-sort="none">{labels[idx] || ''}</span>;
  };

  const AgendaDateEs = ({ day, date }) => {
    const d = day || date;
    const dt = d instanceof Date ? d : new Date(d);
    const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const label = `${weekdays[dt.getDay()]} ${dt.getDate()} de ${months[dt.getMonth()]}`;
    return <span>{label}</span>;
  };

  const handleSelectEvent = (ev) => {
    const id = ev?.id;
    const found = activeReservations.find((r) => String(r.reservationId || r.id) === String(id));
    if (found) {
      setViewingReservation(found);
      openViewModal();
    }
  };

  const handleSelectSlot = ({ start }) => {
    const ds = moment(start).format('YYYY-MM-DD');
    setNoteDate(ds);
    setNoteText(dayNotes[ds] || "");
    openNoteModal();
  };


  useEffect(() => {
    document.title = "Reservas - Administrador - Hotel Plaza Trujillo";
    (async () => {
      try {
        setIsLoadingReservations(true);
        const [resvs, evts, blocked] = await Promise.all([
          listReservations(), 
          getCalendarEvents(),
          getBlockedRooms()
        ]);
        setActiveReservations(resvs);
        setEvents(evts);
        setBlockedRooms(blocked);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingReservations(false);
      }
    })();
  }, []);

  async function handleDeleteReservation(reservation) {
    if (isHousekeeping) return; // Bloquear eliminación para hotelero
    try {
      const identifier = reservation?.reservationId || reservation?.id;
      if (!identifier) {
        toast.error("No se pudo identificar la reserva a eliminar", {
          position: "bottom-right",
          autoClose: 4000,
        });
        return;
      }
      
      const guestName = reservation?.guest || "Reserva";
      await deleteReservation(identifier);
      const [resvs, evts] = await Promise.all([listReservations(), getCalendarEvents()]);
      setActiveReservations(resvs);
      setEvents(evts);
      await refreshAvailableRoomsCount();
      
      // Mostrar toast de éxito
      toast.success(`Reserva de "${guestName}" eliminada exitosamente`, {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (e) {
      console.error(e);
      const errorMessage = e.message || "No se pudo eliminar la reserva";
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    }
  }

  useEffect(() => {
    setSelectedReservationForAccount(activeReservations[0] || null);
    setLedgerItems([
      { id: "l1", concept: "Alojamiento", date: "2025-01-15", comprobante: "FACT", amount: 320 },
      { id: "l2", concept: "Alojamiento", date: "2025-01-16", comprobante: "FACT", amount: 320 },
      { id: "l3", concept: "Lavandería - Planchado", date: "2025-01-16", comprobante: "B/V", amount: 25 },
      { id: "l4", concept: "Restaurante", date: "2025-01-16", comprobante: "B/V", amount: 60 },
    ]);
  }, []);

  

  useEffect(() => {
    const ci = newReservation.checkIn;
    const co = newReservation.checkOut;
    (async () => {
      try {
        if (ci && co) {
          const av = await getAvailableRooms(ci, co);
          console.log('Habitaciones disponibles:', av);
          setRooms(av && Array.isArray(av) ? av.map((r) => ({ code: r.code, floor: r.floor, type: r.type })) : []);
        } else {
          setRooms([]);
        }
      } catch (e) {
        console.error('Error al obtener habitaciones disponibles:', e);
        setRooms([]);
      }
    })();
  }, [newReservation.checkIn, newReservation.checkOut]);

  useEffect(() => {
    const ci = newReservation.checkIn;
    const co = newReservation.checkOut;
    (async () => {
      try {
        if (ci && co) {
          const av = await getAvailableRooms(ci, co);
          setRooms(av.map((r) => ({ code: r.code, floor: r.floor, type: r.type })));
        }
      } catch (e) {}
    })();
  }, [activeReservations]);

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

  const predefinedRooms = {
    1: [
      { code: '111', type: 'DE' },
      { code: '112', type: 'DF' },
      { code: '113', type: 'M' },
    ],
    2: [
      { code: '210', type: 'M' },
      { code: '211', type: 'DF' },
      { code: '212', type: 'DF' },
      { code: '213', type: 'M' },
      { code: '214', type: 'DF' },
      { code: '215', type: 'M' },
    ],
    3: [
      { code: '310', type: 'M' },
      { code: '311', type: 'DF' },
      { code: '312', type: 'DF' },
      { code: '313', type: 'M' },
      { code: '314', type: 'DF' },
      { code: '315', type: 'TF' },
    ],
  };

  // Obtener habitaciones disponibles para el modal de editar
  useEffect(() => {
    const ci = editReservation?.checkIn;
    const co = editReservation?.checkOut;
    (async () => {
      try {
        if (ci && co) {
          const av = await getAvailableRooms(ci, co);
          const availableRooms = av && Array.isArray(av) ? av.map((r) => ({ code: r.code, floor: r.floor, type: r.type })) : [];
          // Incluir la habitación actual si no está en la lista de disponibles (para mantenerla seleccionada)
          const currentRoom = editReservation?.room;
          if (currentRoom && !availableRooms.find(r => String(r.code) === String(currentRoom))) {
            // Buscar la habitación en predefinedRooms para obtener su información
            let foundRoom = null;
            for (const floorKey in predefinedRooms) {
              const floorRooms = predefinedRooms[floorKey];
              if (Array.isArray(floorRooms)) {
                const room = floorRooms.find(r => String(r.code) === String(currentRoom));
                if (room) {
                  foundRoom = { code: room.code, floor: Number(floorKey), type: room.type };
                  break;
                }
              }
            }
            if (foundRoom) {
              availableRooms.push(foundRoom);
            }
          }
          setEditRooms(availableRooms);
        } else {
          setEditRooms([]);
        }
      } catch (e) {
        console.error('Error al obtener habitaciones disponibles para editar:', e);
        setEditRooms([]);
      }
    })();
  }, [editReservation?.checkIn, editReservation?.checkOut, editReservation?.room]);

  useEffect(() => {
    setSelectedReservationForAccount(activeReservations[0] || null);
  }, [activeReservations]);

  useEffect(() => {
    if (!viewingReservation) return;
    const found = activeReservations.find((r) => String(r.reservationId || r.id) === String(viewingReservation.reservationId || viewingReservation.id));
    if (found) setViewingReservation(found);
  }, [activeReservations]);

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
      case "Bloqueada":
        return "error";
      case "Confirmada":
        return "success";
      case "Check-in":
        return "warning";
      case "Check-out":
        return "primary";
      case "Cancelada":
        return "error";
      default:
        return "light";
    }
  };

  function getAutoStatus(reservation) {
    const s = reservation?.status || "";
    if (s === "Cancelada") return "Cancelada";
    const ci = reservation?.checkIn;
    const co = reservation?.checkOut;
    if (!ci || !co) return s || "Confirmada";
    const todayStr = getTodayLocal();
    const nowHM = (() => { const d = new Date(); const hh = String(d.getHours()).padStart(2, "0"); const mm = String(d.getMinutes()).padStart(2, "0"); return `${hh}:${mm}`; })();
    const arr = reservation?.arrivalTime || reservation?.arrival_time || "";
    const arrHM = arr ? String(arr).slice(0, 5) : "";
    const dep = reservation?.departureTime || reservation?.departure_time || "";
    const depHM = dep ? String(dep).slice(0, 5) : "";
    
    // Antes del check-in
    if (todayStr < ci) return "Confirmada";
    
    // Si hay hora de salida configurada, el estado depende de la fecha de checkout y la hora de salida
    if (depHM) {
      // Si estamos antes del día de checkout, no puede ser Check-out aún
      if (todayStr < co) {
        // Si estamos en el día de check-in o después, es Check-in
        if (todayStr >= ci) {
          // Verificar hora de llegada si es el día de check-in
          if (todayStr === ci && arrHM && nowHM < arrHM) {
            return "Confirmada";
          }
          return "Check-in";
        }
        return "Confirmada";
      }
      
      // Si estamos en el día de checkout o después
      if (todayStr >= co) {
        // Si es el mismo día de checkout, comparar la hora actual con la hora de salida
        if (todayStr === co) {
          if (nowHM >= depHM) {
            return "Check-out";
          } else {
            return "Check-in";
          }
        }
        // Si ya pasó el día de checkout, es Check-out
        return "Check-out";
      }
    }
    
    // Si NO hay hora de salida configurada, usar la lógica normal con fechas
    // Si check-in y check-out son el mismo día
    if (ci === co) {
      if (todayStr < ci) return "Confirmada";
      if (todayStr === ci) {
        if (arrHM && nowHM < arrHM) return "Confirmada";
        // En el mismo día, siempre es Check-in (no puede ser Check-out sin hora de salida)
        return "Check-in";
      }
      // Después del día
      if (todayStr > ci) return "Check-out";
    } else {
      // Días diferentes - lógica normal
      // Día de check-in
      if (todayStr === ci) {
        if (arrHM && nowHM < arrHM) return "Confirmada";
        return "Check-in";
      }
      // Entre check-in y check-out
      if (todayStr > ci && todayStr < co) return "Check-in";
      // Después del check-out
      if (todayStr >= co) return "Check-out";
    }
    return "Check-in";
  }

  const getStatusSelectClasses = (status) => {
    const c = getStatusBadgeColor(status);
    if (c === "success") return "border-success-300 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500 dark:border-success-500/30";
    if (c === "warning") return "border-warning-300 bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400 dark:border-warning-500/30";
    if (c === "primary") return "border-primary-300 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30";
    if (c === "error") return "border-error-300 bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500 dark:border-error-500/30";
    return "border-gray-300 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  };

  function getTodayLocal() {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }

  function getTomorrowLocal() {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60 * 1000);
    const t = new Date(local.getTime() + 24 * 60 * 60 * 1000);
    return t.toISOString().slice(0, 10);
  }

  const roomsTable = useMemo(() => {
    const floorLabel = (f) => (String(f) === '1' ? '1ro' : String(f) === '2' ? '2do' : '3ro');
    const statuses = new Map();
    const today = getTodayLocal();
    
    // Verificar habitaciones bloqueadas
    const blockedRoomCodes = new Set();
    const todayDate = new Date(today + 'T00:00:00');
    for (const blocked of blockedRooms) {
      if (blocked.blockedUntil) {
        const blockedUntilDate = new Date(blocked.blockedUntil + 'T00:00:00');
        // Si la fecha de bloqueo es mayor o igual a hoy, la habitación está bloqueada
        if (blockedUntilDate >= todayDate) {
          blockedRoomCodes.add(String(blocked.room));
        }
      }
    }
    
    for (const r of activeReservations) {
      if ((r.status || '').toLowerCase() === 'cancelada') continue;
      const s = getAutoStatus(r);
      const codes = Array.isArray(r.rooms) ? r.rooms : (r.room ? [r.room] : []);
      for (const code of codes) {
        const key = String(code);
        // Si la habitación está bloqueada, tiene prioridad sobre otros estados
        if (blockedRoomCodes.has(key)) {
          statuses.set(key, { status: 'Bloqueada', guest: '-', checkout: '-', type: r.roomType || '-' });
          continue;
        }
        if (s === 'Check-in') {
          statuses.set(key, { status: 'Ocupada', guest: r.guest || '-', checkout: r.checkOut || '-', type: r.roomType || '-' });
        } else if (s === 'Confirmada') {
          const ci = r.checkIn;
          const co = r.checkOut;
          if (ci && co && today >= ci && today < co) {
            statuses.set(key, { status: 'Reservada', guest: r.guest || '-', checkout: r.checkOut || '-', type: r.roomType || '-' });
          }
        }
      }
    }
    const rows = [];
    for (const [floor, items] of Object.entries(predefinedRooms || {})) {
      for (const it of items) {
        const code = String(it.code);
        // Verificar si la habitación está bloqueada (tiene prioridad sobre otros estados)
        let st;
        if (blockedRoomCodes.has(code)) {
          st = { status: 'Bloqueada', guest: '-', checkout: '-', type: '-' };
        } else {
          st = statuses.get(code) || { status: 'Disponible', guest: '-', checkout: '-', type: '-' };
        }
        rows.push({
          id: Number(code),
          room: code,
          type: st.type,
          floor: floorLabel(floor),
          status: st.status,
          guest: st.guest,
          checkout: st.checkout,
          price: '-',
        });
      }
    }
    rows.sort((a, b) => {
      const order = { '1ro': 1, '2do': 2, '3ro': 3 };
      if (order[a.floor] !== order[b.floor]) return order[a.floor] - order[b.floor];
      return String(a.room).localeCompare(String(b.room));
    });
    return rows;
  }, [activeReservations, predefinedRooms, blockedRooms]);

  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 4;
  const historyList = useMemo(() => {
    const list = activeReservations.filter((r) => getAutoStatus(r) === "Check-out");
    const term = historySearch.trim().toLowerCase();
    const filtered = term
      ? list.filter((r) => (String(r.guest || "").toLowerCase().includes(term) || String(r.documentNumber || "").toLowerCase().includes(term)))
      : list;
    return filtered.sort((a, b) => String(b.checkOut || "").localeCompare(String(a.checkOut || "")));
  }, [activeReservations, historySearch]);
  const totalHistoryPages = Math.max(1, Math.ceil(historyList.length / historyPageSize));
  const safeHistoryPage = Math.min(historyPage, totalHistoryPages);
  const paginatedHistory = historyList.slice((safeHistoryPage - 1) * historyPageSize, safeHistoryPage * historyPageSize);

  const [reservationsSearch, setReservationsSearch] = useState("");
  const [reservationsPage, setReservationsPage] = useState(1);
  const reservationsPageSize = 4;
  const filteredReservations = useMemo(() => {
    const term = reservationsSearch.trim().toLowerCase();
    if (!term) return activeReservations;
    return activeReservations.filter((r) => 
      String(r.guest || "").toLowerCase().includes(term) || 
      String(r.documentNumber || "").toLowerCase().includes(term)
    );
  }, [activeReservations, reservationsSearch]);
  const totalReservationsPages = Math.max(1, Math.ceil(filteredReservations.length / reservationsPageSize));
  const safeReservationsPage = Math.min(reservationsPage, totalReservationsPages);
  const paginatedReservations = useMemo(() => {
    const start = (safeReservationsPage - 1) * reservationsPageSize;
    return filteredReservations.slice(start, start + reservationsPageSize);
  }, [filteredReservations, safeReservationsPage]);

  const refreshAvailableRoomsCount = async () => {
    try {
      const totalRooms = Object.values(predefinedRooms || {}).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
      const today = getTodayLocal();
      const occupied = new Set();
      for (const r of activeReservations) {
        if ((r.status || '').toLowerCase() === 'cancelada') continue;
        const s = getAutoStatus(r);
        if (s === 'Check-in') {
          const roomsArr = Array.isArray(r.rooms) ? r.rooms : (r.room ? [r.room] : []);
          for (const code of roomsArr) occupied.add(String(code));
          continue;
        }
        const ci = r.checkIn;
        const co = r.checkOut;
        if (ci && co && today >= ci && today < co) {
          const roomsArr = Array.isArray(r.rooms) ? r.rooms : (r.room ? [r.room] : []);
          for (const code of roomsArr) occupied.add(String(code));
        }
      }
      
      // Contar habitaciones bloqueadas que aún no han expirado
      const blocked = new Set();
      const todayDate = new Date(today + 'T00:00:00');
      for (const blockedRoom of blockedRooms) {
        if (blockedRoom.blockedUntil) {
          const blockedUntilDate = new Date(blockedRoom.blockedUntil + 'T00:00:00');
          if (blockedUntilDate >= todayDate) {
            blocked.add(String(blockedRoom.room));
          }
        }
      }
      
      // Restar tanto las ocupadas como las bloqueadas
      setAvailableRoomsCount(Math.max(totalRooms - occupied.size - blocked.size, 0));
    } catch (e) {
      setAvailableRoomsCount(0);
    }
  };

  useEffect(() => {
    (async () => {
      await refreshAvailableRoomsCount();
    })();
  }, [activeReservations, blockedRooms]);

  // Calcular habitaciones ocupadas (solo Check-in)
  const occupiedRoomsCount = useMemo(() => {
    const today = getTodayLocal();
    const occupied = new Set();
    for (const r of activeReservations) {
      if ((r.status || '').toLowerCase() === 'cancelada') continue;
      const s = getAutoStatus(r);
      if (s === 'Check-in') {
        const roomsArr = Array.isArray(r.rooms) ? r.rooms : (r.room ? [r.room] : []);
        for (const code of roomsArr) occupied.add(String(code));
      }
    }
    return occupied.size;
  }, [activeReservations]);

  const handleSetCancelled = async (reservation) => {
    try {
      const identifier = reservation?.reservationId || reservation?.id;
      if (!identifier) return;
      await updateReservation(identifier, { status: "Cancelada" });
      const resvs = await listReservations();
      setActiveReservations(resvs);
      await refreshAvailableRoomsCount();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetStatus = async (reservation, status) => {
    if (isHousekeeping) return; // Bloquear cambio de estado para hotelero
    try {
      const identifier = reservation?.reservationId || reservation?.id;
      if (!identifier) {
        toast.error("No se pudo identificar la reserva", {
          position: "bottom-right",
          autoClose: 4000,
        });
        return;
      }
      
      const guestName = reservation?.guest || "Reserva";
      const statusMessages = {
        "Cancelada": "cancelada",
        "Check-in": "registrada con check-in",
        "Check-out": "registrada con check-out",
        "Confirmada": "confirmada"
      };
      const statusMessage = statusMessages[status] || "actualizada";
      
      await updateReservation(identifier, { status });
      const resvs = await listReservations();
      setActiveReservations(resvs);
      await refreshAvailableRoomsCount();
      
      // Mostrar toast de éxito
      toast.success(`Reserva de "${guestName}" ${statusMessage} exitosamente`, {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (e) {
      console.error(e);
      const errorMessage = e.message || "No se pudo actualizar el estado de la reserva";
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    }
  };

  const handleViewReservation = (reservation) => {
    setViewingReservation(reservation);
    openViewModal();
  };

  const handleOpenEditReservation = (reservation) => {
    if (isHousekeeping) return; // Bloquear edición para hotelero
    const s = getAutoStatus(reservation);
    if (s === "Cancelada" || (reservation?.status || "") === "Cancelada") return;
    const found = activeReservations.find((r) => r.id === reservation?.id || String(r.reservationId || "") === String(reservation?.reservationId || "")) || reservation;
    const today = new Date().toISOString().slice(0,10);
    setEditOriginalReservation(found);
    setEditReservation({
      id: found?.id,
      reservationId: found?.reservationId,
      guest: found?.guest || "",
      room: found?.room || "",
      roomType: found?.roomType || "",
      checkIn: found?.checkIn || today,
      checkOut: found?.checkOut || today,
      arrivalTime: (found?.arrivalTime || found?.arrival_time || "").slice(0,5),
      departureTime: (found?.departureTime || found?.departure_time || "").slice(0,5),
      total: found?.total || "",
      paid: Boolean(found?.paid),
      channel: found?.channel || "",
      address: found?.address || "",
      department: found?.department || "",
      province: found?.province || "",
      district: found?.district || "",
    });
    openEditModal();
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

  const buildBreakfastRowsForDate = (fecha) => {
    const date = fecha || getTodayLocal();
    const list = [];
    for (const r of activeReservations) {
      if ((r.status || '').toLowerCase() === 'cancelada') continue;
      const ci = r.checkIn;
      const co = r.checkOut;
      if (!ci || !co) continue;
      if (date >= ci && date < co) {
        const codes = Array.isArray(r.rooms) ? r.rooms : (r.room ? [r.room] : []);
        const name = String(r.guest || '');
        if (codes.length === 0) {
          list.push({ id: `b${Date.now()}${Math.random().toString(36).slice(2,6)}`, hab: '', nombres: name, americ: 0, contin: 0, adici: 0 });
        } else {
          for (const code of codes) {
            list.push({ id: `b${Date.now()}${Math.random().toString(36).slice(2,6)}`, hab: String(code || ''), nombres: name, americ: 0, contin: 0, adici: 0 });
          }
        }
      }
    }
    return list.length ? list : [{ id: `b${Date.now()}`, hab: '', nombres: '', americ: 0, contin: 0, adici: 0 }];
  };

  const handleOpenBreakfastModal = () => {
    const fecha = breakfastForm.fecha || getTodayLocal();
    const empleadoAuto = (user?.displayName || (user?.email ? user.email.split("@")[0] : "")) || "";
    setBreakfastForm((prev) => ({ ...prev, fecha, empleado: prev.empleado || empleadoAuto }));
    setBreakfastRows(buildBreakfastRowsForDate(fecha));
    openBreakfastModal();
  };

  const handleBreakfastChange = (e) => {
    const { name, value } = e.target;
    setBreakfastForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'fecha') {
      setBreakfastRows(buildBreakfastRowsForDate(value));
    }
  };

  const handleBreakfastRowChange = (id, field, value) => {
    setBreakfastRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addBreakfastRow = () => {
    setBreakfastRows((prev) => [...prev, { id: `b${Date.now()}`, hab: "", nombres: "", americ: 0, contin: 0, adici: 0 }]);
  };

  const removeBreakfastRow = (id) => {
    setBreakfastRows((prev) => prev.filter((r) => r.id !== id));
  };

  const breakfastTotals = breakfastRows.reduce(
    (acc, r) => {
      acc.americ += Number(r.americ || 0);
      acc.contin += Number(r.contin || 0);
      acc.adici += Number(r.adici || 0);
      return acc;
    },
    { americ: 0, contin: 0, adici: 0 }
  );

  const saveBreakfastReport = async () => {
    setIsSavingBreakfast(true);
    try {
      const empleado = (breakfastForm.empleado || '').trim();
      const fecha = breakfastForm.fecha || getTodayLocal();
      if (!empleado || !fecha) {
        closeBreakfastModal();
        setIsSavingBreakfast(false);
        return;
      }
      const rows = breakfastRows.map((r) => ({
        hab: String(r.hab || ''),
        nombres: String(r.nombres || ''),
        americ: Number(r.americ || 0),
        contin: Number(r.contin || 0),
        adici: Number(r.adici || 0),
      }));
      const payload = {
        empleado,
        fecha,
        rows,
        totals: {
          americ: breakfastTotals.americ,
          contin: breakfastTotals.contin,
          adici: breakfastTotals.adici,
        },
        createdAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('breakfastReports') || '[]');
      const next = Array.isArray(existing) ? existing : [];
      next.push(payload);
      localStorage.setItem('breakfastReports', JSON.stringify(next));
      generateBreakfastPDF(payload);
      closeBreakfastModal();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingBreakfast(false);
    }
    generateBreakfastPDF(payload);
    closeBreakfastModal();
  };

  const generateBreakfastPDF = async (data) => {
    const toDataUrl = async () => {
      try {
        const res = await fetch('/logo-plaza-trujillo.png');
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return null;
      }
    };
    const doc = new jsPDF();
    const logoUrl = await toDataUrl();
    let y = 18;
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', 14, 10, 40, 20);
        y = 36;
      } catch (e) {}
    }
    doc.setFontSize(16);
    doc.text('Reporte de Desayunos', 14, y);
    doc.setFontSize(11);
    doc.text(`Empleado: ${String(data.empleado || '')}`, 14, y + 8);
    doc.text(`Fecha: ${String(data.fecha || '')}`, 120, y + 8);
    const americ = Number(data?.totals?.americ || 0);
    const contin = Number(data?.totals?.contin || 0);
    const adici = Number(data?.totals?.adici || 0);
    doc.text(`Americ.: ${americ}   Contin.: ${contin}   Adici.: ${adici}`, 14, y + 16);
    const body = (data.rows || []).map((r) => [String(r.hab || ''), String(r.nombres || ''), Number(r.americ || 0), Number(r.contin || 0), Number(r.adici || 0)]);
    autoTable(doc, {
      head: [["Hab", "Nombres y Apellidos", "Americ.", "Contin.", "Adici."]],
      body,
      startY: y + 22,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [251, 101, 20] },
    });
    doc.save(`Reporte_Desayunos_${String(data.fecha || '')}.pdf`);
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
            Gestión de Reservas/Ventas
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Administra reservas/ventas y habitaciones del hotel
          </p>
        </div>
        {!isHousekeeping && (
          <Button
            onClick={openCreateModal}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5 fill-current" />
            Nueva Reserva/Venta
          </Button>
        )}
      </div>

      {/* Tarjetas de estado de habitaciones */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingReservations ? (
          // Placeholders mientras carga
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6 animate-pulse"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="flex items-end justify-between mt-5">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          [
          {
            id: 1,
            title: "Disponibles",
            count: availableRoomsCount,
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
            count: occupiedRoomsCount,
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
            count: activeReservations.filter((r) => getAutoStatus(r) === "Confirmada").length,
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
            count: (() => {
              const today = getTodayLocal();
              const todayDate = new Date(today + 'T00:00:00');
              return blockedRooms.filter(blocked => {
                if (!blocked.blockedUntil) return false;
                const blockedUntilDate = new Date(blocked.blockedUntil + 'T00:00:00');
                return blockedUntilDate >= todayDate;
              }).length;
            })(),
            icon: (
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            bgColor: "bg-gray-100 dark:bg-gray-800",
            iconColor: "text-gray-600 dark:text-gray-400",
          },
        ].map((card) => (
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
        ))
        )}
      </div>

      {/* Tabla con Pestañas */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap px-5 sm:px-6 pt-5 gap-4">
            <button
              onClick={() => setActiveTab("rooms")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg cursor-pointer ${
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
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg cursor-pointer ${
                activeTab === "reservations"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Reservas/Ventas Activas
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg cursor-pointer ${
                activeTab === "account"
                  ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              Historial de Clientes
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
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                      <button type="button" className={`px-3 py-2 text-sm ${roomsFloorFilter === '1ro' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 dark:bg-black dark:text-gray-300'}`} onClick={() => setRoomsFloorFilter('1ro')}>1ro</button>
                      <button type="button" className={`px-3 py-2 text-sm ${roomsFloorFilter === '2do' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 dark:bg-black dark:text-gray-300'}`} onClick={() => setRoomsFloorFilter('2do')}>2do</button>
                      <button type="button" className={`px-3 py-2 text-sm ${roomsFloorFilter === '3ro' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 dark:bg-black dark:text-gray-300'}`} onClick={() => setRoomsFloorFilter('3ro')}>3ro</button>
                    </div>
                    <Button onClick={handleOpenBreakfastModal} variant="outline" className="flex items-center gap-2 cursor-pointer">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3 0 2.5 3 5 3 5s3-2.5 3-5c0-1.657-1.343-3-3-3zm0-6v4m0 12v4m-8-8h4m8 0h4"/></svg>
                      Reporte de Desayunos
                    </Button>
                  </div>
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
                        className="hidden"
                      >
                        Precio/Noche
                      </TableCell>
                      
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {roomsTable.filter((room) => !roomsFloorFilter || room.floor === roomsFloorFilter).map((room) => (
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
                        <TableCell className="hidden">
                          {room.price}
                        </TableCell>
                        
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === "reservations" && (
            activeReservations.length === 0 ? (
              <div className="py-20 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No hay reservas registradas
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Buscar por huésped o documento de identidad</label>
                  <input
                    type="text"
                    placeholder="Nombre del huésped o número de documento"
                    value={reservationsSearch}
                    onChange={(e) => { setReservationsSearch(e.target.value); setReservationsPage(1); }}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </div>
                <div className="no-scrollbar overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                      <TableRow>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
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
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Habitación
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Check-in
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Check-out
                      </TableCell>
                      <TableCell
                        isHeader
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
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
                        className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
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
                    {paginatedReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="py-3.5 px-2 sm:px-4">
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
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {reservation.room}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-gray-300">
                          {reservation.checkIn}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-gray-300">
                          {reservation.checkOut}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                          {reservation.total}
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4">
                          <Badge size="sm" color={getStatusBadgeColor(getAutoStatus(reservation))}>{getAutoStatus(reservation)}</Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-2 sm:px-4">
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
                              className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Ver detalles"
                            >
                              <EyeIcon className="w-4 h-4 fill-current text-gray-600 dark:text-gray-300" />
                            </button>
                            {!isHousekeeping && (
                              <>
                                <button
                                  onClick={() => handleOpenEditReservation(reservation)}
                                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${getAutoStatus(reservation) === 'Cancelada' ? 'text-orange-300 bg-transparent cursor-not-allowed' : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50 cursor-pointer'}`}
                                  title="Editar"
                                  disabled={getAutoStatus(reservation) === 'Cancelada'}
                                >
                                  <PencilIcon className="w-4 h-4 fill-current" />
                                </button>
                                <button
                                  onClick={() => { setReservationPendingDeletion(reservation); openConfirmModal(); }}
                                  className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer hidden lg:inline-block"
                                  title="Cancelar"
                                >
                                  <TrashBinIcon className="w-4 h-4 fill-current" />
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                        
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-400">
                  Página {safeReservationsPage} de {totalReservationsPages}
                </div>
                {filteredReservations.length > reservationsPageSize && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="cursor-pointer" disabled={safeReservationsPage <= 1} onClick={() => setReservationsPage((p) => Math.max(p - 1, 1))}>Anterior</Button>
                    <Button size="sm" variant="outline" className="cursor-pointer" disabled={safeReservationsPage >= totalReservationsPages} onClick={() => setReservationsPage((p) => Math.min(p + 1, totalReservationsPages))}>Siguiente</Button>
                  </div>
                )}
              </div>
            </div>
            )
          )}


          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Buscar</label>
                  <input
                    type="text"
                    placeholder="Nombre o DNI"
                    value={historySearch}
                    onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Historial de Clientes</h3>
                <p className="text-gray-500 text-theme-sm dark:text-gray-400">Clientes con estado Check-out</p>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                      <TableRow>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cliente</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Documento</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Habitación</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipo</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Check-out</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Canal</TableCell>
                        <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Total</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {paginatedHistory.length > 0 ? (
                        paginatedHistory.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">{r.guest || '-'}</TableCell>
                            <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">{(r.documentType || '-') + ' ' + (r.documentNumber || '')}</TableCell>
                            <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">{Array.isArray(r.rooms) ? r.rooms.join(', ') : (r.room || '-')}</TableCell>
                            <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">{r.roomType || '-'}</TableCell>
                            <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-gray-300">{r.checkOut || '-'}</TableCell>
                            <TableCell className="py-3.5 px-2 sm:px-4"><Badge size="sm">{r.channel || '-'}</Badge></TableCell>
                            <TableCell className="py-3.5 px-2 sm:px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">{r.total || '-'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="py-12 px-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No hay registros disponibles</p>
                              <p className="text-gray-400 dark:text-gray-500 text-xs">No se encontraron clientes con estado Check-out</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-400">
                  Página {safeHistoryPage} de {totalHistoryPages}
                </div>
                {historyList.length > historyPageSize && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="cursor-pointer" disabled={safeHistoryPage <= 1} onClick={() => setHistoryPage((p) => Math.max(p - 1, 1))}>Anterior</Button>
                    <Button size="sm" variant="outline" className="cursor-pointer" disabled={safeHistoryPage >= totalHistoryPages} onClick={() => setHistoryPage((p) => Math.min(p + 1, totalHistoryPages))}>Siguiente</Button>
                  </div>
                )}
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
          <div className="custom-calendar" style={{ minHeight: 400 }}>
            <Calendar
              culture="es"
              localizer={localizer}
              formats={calendarFormats}
              events={bigEvents}
              defaultView="month"
              date={calendarDate}
              view={calendarView}
              views={["month", "agenda"]}
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={eventPropGetter}
              dayPropGetter={dayPropGetter}
              components={{ toolbar: CustomToolbar, header: GlobalHeaderEs, month: { header: MonthHeaderEs, dateHeader: DateHeaderWithNote }, agenda: { date: AgendaDateEs } }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onNavigate={(d) => setCalendarDate(d)}
              onView={(v) => setCalendarView(v)}
              messages={{
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                allDay: "Todo el día",
                week: "Semana",
                work_week: "Semana laboral",
                day: "Día",
                month: "Mes",
                previous: "Anterior",
                next: "Siguiente",
                today: "Hoy",
                agenda: "Agenda",
                showMore: (total) => `+${total} más`,
              }}
              popup
              selectable
              style={{ height: 600 }}
            />
          </div>
        </div>
      </div>

      {/* Modal Crear Reserva */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} className="m-2 w-[95vw] max-w-[95vw]">
        <div className="no-scrollbar relative w-full max-w-full max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-6 lg:p-8 dark:bg-black dark:border dark:border-orange-500/30">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Nueva Reserva/Venta
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Complete la información para crear una nueva reserva o venta presencial
            </p>
          </div>
          <div className="px-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Tipo de documento</label>
                    <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={newReservation.documentType} onChange={(e) => setNewReservation((p) => ({ ...p, documentType: e.target.value }))}>
                      <option>DNI</option>
                      <option>RUC</option>
                      <option>CE</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Número</label>
                    <div className="flex gap-2">
                      <input type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={newReservation.documentNumber} onChange={(e) => setNewReservation((p) => ({ ...p, documentNumber: e.target.value }))} onBlur={() => setTouched((p) => ({ ...p, documentNumber: true }))} />
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer disabled:bg-orange-300 disabled:cursor-not-allowed" disabled={isDocLookupLoading} onClick={async () => {
                        if (!newReservation.documentType || !newReservation.documentNumber) return;
                        setIsDocLookupLoading(true);
                        try {
                          const res = await lookupDocument(newReservation.documentType, newReservation.documentNumber);
                          if (res?.name) {
                            const d = res?.raw?.data || {};
                            const address = d?.direccion_completa || d?.direccion || "";
                            const department = d?.departamento || "";
                            const province = d?.provincia || "";
                            const district = d?.distrito || "";
                            const taxpayerType = d?.tipo_contribuyente || d?.tipoContribuyente || d?.tipo || "";
                            const businessStatus = d?.estado || d?.estado_contribuyente || d?.estadoContribuyente || "";
                            const businessCondition = d?.condicion || d?.condicion_contribuyente || d?.condicionContribuyente || "";
                            setNewReservation((p) => ({
                              ...p,
                              guest: res.name,
                              documentInfo: d,
                              address,
                              department,
                              province,
                              district,
                              taxpayerType,
                              businessStatus,
                              businessCondition,
                            }));
                          }
                        } catch (e) {}
                        finally { setIsDocLookupLoading(false); }
                      }}>{isDocLookupLoading ? (<span className="inline-flex items-center gap-2"><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" /></svg> Buscando...</span>) : ("Buscar")}</Button>
                    </div>
                  </div>
                  {touched.documentNumber && !newReservation.guest && !newReservation.documentNumber ? (
                    <p className="mt-1 text-xs text-red-600">Completa Huésped o Número de documento</p>
                  ) : null}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Canal de Reserva
                  </label>
                  <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={newReservation.channel} onChange={(e) => setNewReservation((p) => ({ ...p, channel: e.target.value }))}>
                    <option>Booking.com</option>
                    <option>WhatsApp</option>
                    <option>Venta Directa</option>
                  </select>
                </div>
              </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Huésped <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                      value={newReservation.guest}
                      onChange={(e) => setNewReservation((p) => ({ ...p, guest: e.target.value }))}
                      required
                      onBlur={() => setTouched((p) => ({ ...p, guest: true }))}
                    />
                    {touched.guest && !newReservation.guest && !newReservation.documentNumber ? (
                      <p className="mt-1 text-xs text-red-600">Completa Huésped o Número de documento</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Dirección</label>
                    <input type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={newReservation.address} onChange={(e) => setNewReservation((p) => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>

              

              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Departamento</label>
                    <input type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={newReservation.department} onChange={(e) => setNewReservation((p) => ({ ...p, department: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Provincia</label>
                    <input type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={newReservation.province} onChange={(e) => setNewReservation((p) => ({ ...p, province: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Distrito</label>
                    <input type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={newReservation.district} onChange={(e) => setNewReservation((p) => ({ ...p, district: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Habitación <span className="text-red-600">*</span></label>
                    <select disabled={!newReservation.checkIn || !newReservation.checkOut} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" value={newReservation.room || ""} onChange={(e) => setNewReservation((p) => ({ ...p, room: String(e.target.value || '').trim() }))} required onBlur={() => setTouched((p) => ({ ...p, room: true }))}>
                      {!newReservation.checkIn || !newReservation.checkOut ? (
                        <option value="">Selecciona fechas</option>
                      ) : (
                        <>
                          <option value="">Selecciona hab</option>
                          {rooms && Array.isArray(rooms) && rooms.length > 0 ? (
                            rooms.sort((a, b) => Number(a.floor) - Number(b.floor) || String(a.code).localeCompare(String(b.code))).map((r) => (
                              <option key={String(r.code)} value={String(r.code)}>{`${String(r.code)} - Piso ${r.floor}`}</option>
                            ))
                          ) : (
                            <option value="">No hay habitaciones disponibles para estas fechas</option>
                          )}
                        </>
                      )}
                    </select>
                    {touched.room && !newReservation.room && newReservation.checkIn && newReservation.checkOut ? (
                      <p className="mt-1 text-xs text-red-600">Campo obligatorio</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Tipo de Habitación <span className="text-red-600">*</span>
                    </label>
                    <select 
                      className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white ${
                        touched.roomType && !newReservation.roomType
                          ? "border-red-500 focus:border-red-500 dark:border-red-500"
                          : "border-gray-300 focus:border-orange-300 dark:border-gray-700"
                      }`}
                      value={newReservation.roomType || ""} 
                      onChange={(e) => {
                        setNewReservation((p) => ({ ...p, roomType: e.target.value }));
                        setTouched((t) => ({ ...t, roomType: true }));
                      }}
                      onBlur={() => setTouched((t) => ({ ...t, roomType: true }))}
                    >
                      <option value="">Seleccionar</option>
                      <option>Simple</option>
                      <option>Doble</option>
                      <option>Triple</option>
                      <option>Matrimonial</option>
                    </select>
                    {touched.roomType && !newReservation.roomType && (
                      <p className="mt-1 text-sm text-red-600">Este campo es obligatorio</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Check-in <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={checkInInputRef}
                        type="date"
                        min={getTodayLocal()}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                        value={newReservation.checkIn}
                        onChange={(e) => setNewReservation((p) => ({ ...p, checkIn: e.target.value, arrivalTime: "" }))}
                        required
                        onBlur={() => setTouched((p) => ({ ...p, checkIn: true }))}
                      />
                      {touched.checkIn && !newReservation.checkIn ? (
                        <p className="mt-1 text-xs text-red-600">Campo obligatorio</p>
                      ) : null}
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-600 hover:text-gray-800 cursor-pointer" onClick={() => { const el = checkInInputRef.current; if (!el) return; if (typeof el.showPicker === 'function') { el.showPicker(); } else { el.focus(); } }}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Check-out <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={checkOutInputRef}
                        type="date"
                        min={newReservation.checkIn || getTodayLocal()}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                        value={newReservation.checkOut}
                        onChange={(e) => setNewReservation((p) => ({ ...p, checkOut: e.target.value, departureTime: "" }))}
                        required
                        onBlur={() => setTouched((p) => ({ ...p, checkOut: true }))}
                      />
                      {touched.checkOut && !newReservation.checkOut ? (
                        <p className="mt-1 text-xs text-red-600">Campo obligatorio</p>
                      ) : null}
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-600 hover:text-gray-800 cursor-pointer" onClick={() => { const el = checkOutInputRef.current; if (!el) return; if (typeof el.showPicker === 'function') { el.showPicker(); } else { el.focus(); } }}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {newReservation.documentType === 'RUC' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Estado</label>
                      <input type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={newReservation.businessStatus} onChange={(e) => setNewReservation((p) => ({ ...p, businessStatus: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Condición</label>
                      <input type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={newReservation.businessCondition} onChange={(e) => setNewReservation((p) => ({ ...p, businessCondition: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Hora de llegada
                  </label>
                  <div className="relative">
                    <input 
                      ref={arrivalTimeInputRef} 
                      type="time" 
                      disabled={!newReservation.checkIn}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" 
                      value={newReservation.arrivalTime} 
                      onChange={(e) => setNewReservation((p) => ({ ...p, arrivalTime: e.target.value }))} 
                    />
                    <button 
                      type="button" 
                      disabled={!newReservation.checkIn}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-600 hover:text-gray-800 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed" 
                      onClick={() => { const el = arrivalTimeInputRef.current; if (!el || !newReservation.checkIn) return; if (typeof el.showPicker === 'function') { el.showPicker(); } else { el.focus(); } }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    </button>
                  </div>
                  {!newReservation.checkIn && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Selecciona primero la fecha de Check-in</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Hora de Salida
                  </label>
                  <div className="relative">
                    <input 
                      ref={departureTimeInputRef} 
                      type="time" 
                      disabled={!newReservation.checkOut}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" 
                      value={newReservation.departureTime} 
                      onChange={(e) => setNewReservation((p) => ({ ...p, departureTime: e.target.value }))} 
                    />
                    <button 
                      type="button" 
                      disabled={!newReservation.checkOut}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-600 hover:text-gray-800 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed" 
                      onClick={() => { const el = departureTimeInputRef.current; if (!el || !newReservation.checkOut) return; if (typeof el.showPicker === 'function') { el.showPicker(); } else { el.focus(); } }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    </button>
                  </div>
                  {!newReservation.checkOut && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Selecciona primero la fecha de Check-out</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Adultos</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={String(newReservation.numAdults || 0)} onChange={(e) => {
                    const raw = (e.target.value || "").replace(/\D/g, "");
                    const val = Number(raw || 0);
                    setNewReservation((p) => ({ ...p, numAdults: val, numPeople: val + Number(p.numChildren || 0) }));
                  }} />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Niños</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={String(newReservation.numChildren || 0)} onChange={(e) => {
                    const raw = (e.target.value || "").replace(/\D/g, "");
                    const val = Number(raw || 0);
                    setNewReservation((p) => ({ ...p, numChildren: val, numPeople: val + Number(p.numAdults || 0) }));
                  }} />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Total Personas</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={String(newReservation.numPeople || 0)} onChange={(e) => {
                    const raw = (e.target.value || "").replace(/\D/g, "");
                    setNewReservation((p) => ({ ...p, numPeople: Number(raw || 0) }));
                  }} />
                </div>
              </div>
              
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="md:col-span-1">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Total (S/)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                      value={String(newReservation.total || "")}
                      onChange={(e) => {
                        const raw = (e.target.value || "").replace(/[^\d.,]/g, "").replace(",", ".");
                        const parts = raw.split(".");
                        const normalized = parts.length > 1 ? parts[0] + "." + parts[1].slice(0,2) : parts[0];
                        setNewReservation((p) => ({ ...p, total: normalized }));
                      }}
                      onBlur={(e) => {
                        const num = Number((e.target.value || "0").replace(",", "."));
                        setNewReservation((p) => ({ ...p, total: isNaN(num) ? "" : num.toFixed(2) }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Pagado</label>
                    <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                      <button type="button" className={`px-3 py-2 text-sm ${newReservation.paid ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 dark:bg-black dark:text-gray-300'}`} onClick={() => setNewReservation((p) => ({ ...p, paid: true }))}>Sí</button>
                      <button type="button" className={`px-3 py-2 text-sm ${!newReservation.paid ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 dark:bg-black dark:text-gray-300'}`} onClick={() => setNewReservation((p) => ({ ...p, paid: false }))}>No</button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Acompañantes</label>
                  <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setNewReservation((p) => ({ ...p, companions: [...(p.companions || []), { name: "", documentType: "DNI", documentNumber: "" }] }))}>Agregar</Button>
                </div>
                {(newReservation.companions || []).map((c, idx) => (
                  <div key={idx} className={idx > 0 ? "mb-3 border-t border-gray-200 dark:border-gray-800 pt-3 mt-3" : "mb-3"}>
                    <div className="grid grid-cols-3 gap-2">
                      <select className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={c.documentType} onChange={(e) => setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, documentType: e.target.value } : it) }))}>
                        <option>DNI</option>
                        <option>RUC</option>
                        <option>CE</option>
                      </select>
                      <input type="text" className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={c.documentNumber} onChange={(e) => setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, documentNumber: e.target.value } : it) }))} onBlur={async (e) => { try { const res = await lookupDocument(c.documentType, e.target.value); const d = res?.raw?.data || {}; const name = res?.name || ""; const address = d?.direccion_completa || d?.direccion || ""; const department = d?.departamento || ""; const province = d?.provincia || ""; const district = d?.distrito || ""; const taxpayerType = d?.tipo_contribuyente || d?.tipoContribuyente || d?.tipo || ""; const businessStatus = d?.estado || d?.estado_contribuyente || d?.estadoContribuyente || ""; const businessCondition = d?.condicion || d?.condicion_contribuyente || d?.condicionContribuyente || ""; setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, name, address, department, province, district, taxpayerType, businessStatus, businessCondition } : it) })); } catch (er) {} }} onKeyDown={async (ev) => { if (ev.key === 'Enter') { try { const res = await lookupDocument(c.documentType, c.documentNumber); const d = res?.raw?.data || {}; const name = res?.name || ""; const address = d?.direccion_completa || d?.direccion || ""; const department = d?.departamento || ""; const province = d?.provincia || ""; const district = d?.distrito || ""; const taxpayerType = d?.tipo_contribuyente || d?.tipoContribuyente || d?.tipo || ""; const businessStatus = d?.estado || d?.estado_contribuyente || d?.estadoContribuyente || ""; const businessCondition = d?.condicion || d?.condicion_contribuyente || d?.condicionContribuyente || ""; setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, name, address, department, province, district, taxpayerType, businessStatus, businessCondition } : it) })); } catch (er) {} } }} />
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer disabled:bg-orange-300 disabled:cursor-not-allowed" disabled={companionLookupIndex === idx} onClick={async () => {
                        setCompanionLookupIndex(idx);
                        try {
                          const res = await lookupDocument(c.documentType, c.documentNumber);
                          const d = res?.raw?.data || {};
                          const name = res?.name || "";
                          const address = d?.direccion_completa || d?.direccion || "";
                          const department = d?.departamento || "";
                          const province = d?.provincia || "";
                          const district = d?.distrito || "";
                          const taxpayerType = d?.tipo_contribuyente || d?.tipoContribuyente || d?.tipo || "";
                          const businessStatus = d?.estado || d?.estado_contribuyente || d?.estadoContribuyente || "";
                          const businessCondition = d?.condicion || d?.condicion_contribuyente || d?.condicionContribuyente || "";
                          setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, name, address, department, province, district, taxpayerType, businessStatus, businessCondition } : it) }));
                        } catch (e) {}
                        finally { setCompanionLookupIndex(null); }
                      }}>{companionLookupIndex === idx ? (<span className="inline-flex items-center gap-2"><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" /></svg> Buscando...</span>) : ("Buscar")}</Button>
                    </div>
                    <div className="mt-2">
                      <input type="text" placeholder="Nombre" className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={c.name || ''} onChange={(e) => setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, name: e.target.value } : it) }))} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <div className="md:col-span-3">
                        <input type="text" placeholder="Dirección" className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={c.address || ''} onChange={(e) => setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, address: e.target.value } : it) }))} />
                      </div>
                      <div>
                        <input type="text" placeholder="Departamento" className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={c.department || ''} onChange={(e) => setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, department: e.target.value } : it) }))} />
                        <div className="mt-2">
                          <button onClick={() => setNewReservation((p) => ({ ...p, companions: (p.companions || []).filter((_, i) => i !== idx) }))} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg transition text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer" title="Eliminar acompañante">
                            <TrashBinIcon className="w-4 h-4 fill-current" />
                            <span className="text-sm">Eliminar</span>
                          </button>
                        </div>
                      </div>
                      <input type="text" placeholder="Provincia" className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={c.province || ''} onChange={(e) => setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, province: e.target.value } : it) }))} />
                      <input type="text" placeholder="Distrito" className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={c.district || ''} onChange={(e) => setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, district: e.target.value } : it) }))} />
                    </div>
                    {c.documentType === 'RUC' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        <input type="text" placeholder="Estado" className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={c.businessStatus || ''} onChange={(e) => setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, businessStatus: e.target.value } : it) }))} />
                        <input type="text" placeholder="Condición" className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={c.businessCondition || ''} onChange={(e) => setNewReservation((p) => ({ ...p, companions: p.companions.map((it, i) => i === idx ? { ...it, businessCondition: e.target.value } : it) }))} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => { setNewReservation(initialReservation); setTouched({ checkIn: false, checkOut: false, room: false, guest: false, documentNumber: false }); closeCreateModal(); }}>
              Cancelar
            </Button>
            <Button 
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600 cursor-pointer disabled:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50" 
              disabled={!isCreateValid || isHousekeeping || isCreating} 
              onClick={async () => {
              try {
                setIsCreating(true);
                await createReservation(newReservation);
                const [resvs, evts] = await Promise.all([listReservations(), getCalendarEvents()]);
                setActiveReservations(resvs);
                setEvents(evts);
                await refreshAvailableRoomsCount();
                
                // Obtener el nombre del huésped para el toast
                const guestName = newReservation.guest || newReservation.documentNumber || "Reserva";
                
                // Mostrar toast de éxito
                toast.success(`Reserva de "${guestName}" creada exitosamente`, {
                  position: "bottom-right",
                  autoClose: 3000,
                });
                
                setNewReservation(initialReservation);
                setTouched({ checkIn: false, checkOut: false, room: false, guest: false, documentNumber: false });
                closeCreateModal();
              } catch (e) {
                console.error(e);
                const errorMessage = e.message || "No se pudo crear la reserva";
                toast.error(errorMessage, {
                  position: "bottom-right",
                  autoClose: 4000,
                });
              } finally {
                setIsCreating(false);
              }
            }}>
              {isCreating ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
                  </svg>
                  Creando...
                </span>
              ) : (
                "Crear Reserva/Venta"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar Reserva */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setEditReservation(null); closeEditModal(); }} className="m-2 w-[95vw] max-w-[700px]">
        <div className="no-scrollbar relative w-full max-w-full max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-6 lg:p-8 dark:bg-black dark:border dark:border-orange-500/30">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar Reserva/Venta
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Actualiza la información de la reserva o venta presencial
            </p>
          </div>
          {editReservation && (
            <div className="px-2 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Huésped</label>
                  <input type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={editReservation.guest} onChange={(e) => setEditReservation((p) => ({ ...p, guest: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Habitación <span className="text-red-600">*</span></label>
                  <select disabled={!editReservation.checkIn || !editReservation.checkOut} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" value={editReservation.room || ""} onChange={(e) => setEditReservation((p) => ({ ...p, room: String(e.target.value || '').trim() }))} required>
                    {!editReservation.checkIn || !editReservation.checkOut ? (
                      <option value="">Selecciona fechas</option>
                    ) : (
                      <>
                        <option value="">Selecciona hab</option>
                        {editRooms && Array.isArray(editRooms) && editRooms.length > 0 ? (
                          editRooms.sort((a, b) => Number(a.floor) - Number(b.floor) || String(a.code).localeCompare(String(b.code))).map((r) => (
                            <option key={String(r.code)} value={String(r.code)}>{`${String(r.code)} - Piso ${r.floor}`}</option>
                          ))
                        ) : (
                          <option value="">No hay habitaciones disponibles para estas fechas</option>
                        )}
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Tipo de Habitación <span className="text-red-600">*</span>
                  </label>
                  <select 
                    className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white ${
                      !editReservation.roomType
                        ? "border-red-500 focus:border-red-500 dark:border-red-500"
                        : "border-gray-300 focus:border-orange-300 dark:border-gray-700"
                    }`}
                    value={editReservation.roomType || ""} 
                    onChange={(e) => setEditReservation((p) => ({ ...p, roomType: e.target.value }))}
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option>Simple</option>
                    <option>Doble</option>
                    <option>Triple</option>
                    <option>Matrimonial</option>
                  </select>
                  {!editReservation.roomType && (
                    <p className="mt-1 text-sm text-red-600">Este campo es obligatorio</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Check-in</label>
                  <div className="relative">
                    <input
                      ref={editCheckInInputRef}
                      type="date"
                      min={getTodayLocal()}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                      value={editReservation.checkIn}
                      onChange={(e) => setEditReservation((p) => ({ ...p, checkIn: e.target.value, arrivalTime: "" }))}
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-600 hover:text-gray-800 cursor-pointer" onClick={() => { const el = editCheckInInputRef.current; if (!el) return; if (typeof el.showPicker === 'function') { el.showPicker(); } else { el.focus(); } }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Check-out</label>
                  <div className="relative">
                    <input
                      ref={editCheckOutInputRef}
                      type="date"
                      min={editReservation.checkIn || getTodayLocal()}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
                      value={editReservation.checkOut}
                      onChange={(e) => setEditReservation((p) => ({ ...p, checkOut: e.target.value, departureTime: "" }))}
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-600 hover:text-gray-800 cursor-pointer" onClick={() => { const el = editCheckOutInputRef.current; if (!el) return; if (typeof el.showPicker === 'function') { el.showPicker(); } else { el.focus(); } }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Hora de llegada
                  </label>
                  <div className="relative">
                    <input 
                      ref={editArrivalTimeInputRef} 
                      type="time" 
                      step="60" 
                      disabled={!editReservation.checkIn}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" 
                      value={String(editReservation.arrivalTime || "")} 
                      onChange={(e) => setEditReservation((p) => ({ ...p, arrivalTime: e.target.value }))} 
                    />
                    <button 
                      type="button" 
                      disabled={!editReservation.checkIn}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-600 hover:text-gray-800 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed" 
                      onClick={() => { const el = editArrivalTimeInputRef.current; if (!el || !editReservation.checkIn) return; if (typeof el.showPicker === 'function') { el.showPicker(); } else { el.focus(); } }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    </button>
                  </div>
                  {!editReservation.checkIn && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Selecciona primero la fecha de Check-in</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Hora de Salida
                  </label>
                  <div className="relative">
                    <input 
                      ref={editDepartureTimeInputRef} 
                      type="time" 
                      step="60" 
                      disabled={!editReservation.checkOut}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" 
                      value={String(editReservation.departureTime || "")} 
                      onChange={(e) => setEditReservation((p) => ({ ...p, departureTime: e.target.value }))} 
                    />
                    <button 
                      type="button" 
                      disabled={!editReservation.checkOut}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-600 hover:text-gray-800 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed" 
                      onClick={() => { const el = editDepartureTimeInputRef.current; if (!el || !editReservation.checkOut) return; if (typeof el.showPicker === 'function') { el.showPicker(); } else { el.focus(); } }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    </button>
                  </div>
                  {!editReservation.checkOut && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Selecciona primero la fecha de Check-out</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Total (S/)</label>
                  <input type="text" inputMode="decimal" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" value={String(editReservation.total || "")} onChange={(e) => {
                    const raw = (e.target.value || "").replace(/[^\d.,]/g, "").replace(",", ".");
                    const parts = raw.split(".");
                    const normalized = parts.length > 1 ? parts[0] + "." + parts[1].slice(0,2) : parts[0];
                    setEditReservation((p) => ({ ...p, total: normalized }));
                  }} onBlur={(e) => {
                    const num = Number((e.target.value || "0").replace(",", "."));
                    setEditReservation((p) => ({ ...p, total: isNaN(num) ? "" : num.toFixed(2) }));
                  }} />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Pagado</label>
                  <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                    <button type="button" className={`px-3 py-2 text-sm ${editReservation.paid ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 dark:bg-black dark:text-gray-300'}`} onClick={() => setEditReservation((p) => ({ ...p, paid: true }))}>Sí</button>
                    <button type="button" className={`px-3 py-2 text-sm ${!editReservation.paid ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 dark:bg-black dark:text-gray-300'}`} onClick={() => setEditReservation((p) => ({ ...p, paid: false }))}>No</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => { setEditReservation(null); closeEditModal(); }}>
              Cancelar
            </Button>
            {editReservation && !isHousekeeping && (
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={['Check-in','Check-out','Cancelada'].includes(getAutoStatus(editReservation))}
                onClick={async () => {
                  if (['Check-in','Check-out','Cancelada'].includes(getAutoStatus(editReservation))) return;
                  await handleSetStatus(editReservation, "Cancelada");
                  setEditReservation(null);
                  closeEditModal();
                }}
              >
                Cancelar reserva
              </Button>
            )}
            {!isHousekeeping && (
              <Button 
                size="sm" 
                className="bg-orange-500 hover:bg-orange-600 cursor-pointer disabled:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50" 
                disabled={isSavingEdit}
                onClick={async () => {
              try {
                if (!editReservation.roomType) {
                  toast.error("El tipo de habitación es obligatorio", {
                    position: "bottom-right",
                    autoClose: 4000,
                  });
                  return;
                }
                setIsSavingEdit(true);
                const identifier = editReservation?.reservationId || editReservation?.id;
                if (!identifier) {
                  toast.error("No se pudo identificar la reserva a editar", {
                    position: "bottom-right",
                    autoClose: 4000,
                  });
                  setIsSavingEdit(false);
                  return;
                }
                
                const guestName = editReservation?.guest || "Reserva";
                const payload = {};
                const keys = ["guest","room","roomType","checkIn","checkOut","arrivalTime","departureTime","total","paid","channel","address","department","province","district"];
                for (const k of keys) {
                  if (!editOriginalReservation) { payload[k] = editReservation[k]; continue; }
                  if (k === "arrivalTime") {
                    const newVal = editReservation.arrivalTime ? (/^\d{2}:\d{2}$/.test(editReservation.arrivalTime) ? `${editReservation.arrivalTime}:00` : editReservation.arrivalTime) : "";
                    const origVal = (editOriginalReservation.arrivalTime || editOriginalReservation.arrival_time || "");
                    if (newVal !== origVal) {
                      payload["arrivalTime"] = newVal;
                      payload["arrival_time"] = newVal;
                    }
                  } else if (k === "departureTime") {
                    // Formatear el nuevo valor
                    let newVal = editReservation.departureTime || "";
                    if (newVal && /^\d{2}:\d{2}$/.test(newVal)) {
                      newVal = `${newVal}:00`;
                    }
                    // Obtener el valor original (puede venir como departureTime o departure_time)
                    const origDepTime = editOriginalReservation.departureTime || editOriginalReservation.departure_time || "";
                    // Normalizar el valor original para comparar
                    let origVal = "";
                    if (origDepTime) {
                      const origStr = String(origDepTime);
                      if (/^\d{2}:\d{2}/.test(origStr)) {
                        origVal = origStr.slice(0,5) + ":00";
                      } else {
                        origVal = origStr;
                      }
                    }
                    // Comparar valores normalizados (sin espacios)
                    const newValClean = newVal.trim();
                    const origValClean = origVal.trim();
                    if (newValClean !== origValClean) {
                      payload["departureTime"] = newValClean || null;
                      payload["departure_time"] = newValClean || null;
                      console.log("Enviando departureTime:", newValClean, "original:", origValClean);
                    }
                  } else {
                    if (editReservation[k] !== editOriginalReservation[k]) payload[k] = editReservation[k];
                  }
                }
                if (Object.keys(payload).length > 0) {
                  await updateReservation(identifier, payload);
                }
                let resvs = await listReservations();
                if (payload.roomType) {
                  resvs = resvs.map((r) => (r.id === identifier || String(r.reservationId || "") === String(identifier)) ? { ...r, roomType: payload.roomType } : r);
                }
                setActiveReservations(resvs);
                
                // Mostrar toast de éxito
                toast.success(`Reserva de "${guestName}" actualizada exitosamente`, {
                  position: "bottom-right",
                  autoClose: 3000,
                });
                
                setEditReservation(null);
                setEditOriginalReservation(null);
                closeEditModal();
              } catch (e) {
                console.error(e);
                const errorMessage = e.message || "No se pudo actualizar la reserva";
                toast.error(errorMessage, {
                  position: "bottom-right",
                  autoClose: 4000,
                });
              } finally {
                setIsSavingEdit(false);
              }
            }}>
              {isSavingEdit ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
            )}
          </div>
        </div>
      </Modal>
      <Modal isOpen={isConfirmModalOpen} onClose={() => { setReservationPendingDeletion(null); closeConfirmModal(); }} className="m-4 w-[95vw] max-w-[420px]">
        <div className="relative w-full rounded-2xl bg-white p-6 dark:bg-black dark:border dark:border-orange-500/30">
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Confirmar cancelación</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">¿Está seguro de eliminar esta reserva?</p>
          {reservationPendingDeletion ? (
            <div className="mb-4 text-sm text-gray-700 dark:text-gray-200">
              <div>{reservationPendingDeletion.guest || "Sin nombre"}</div>
              <div className="text-gray-500 dark:text-gray-400">{reservationPendingDeletion.room || "Sin habitación"}</div>
            </div>
          ) : null}
          <div className="flex items-center gap-3 justify-end pt-2">
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => { setReservationPendingDeletion(null); closeConfirmModal(); }}>Cancelar</Button>
            <Button 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50" 
              disabled={isDeleting}
              onClick={async () => {
              if (!reservationPendingDeletion) return;
              try {
                setIsDeleting(true);
                await handleDeleteReservation(reservationPendingDeletion);
                setReservationPendingDeletion(null);
                closeConfirmModal();
              } catch (e) {
                console.error(e);
              } finally {
                setIsDeleting(false);
              }
            }}>
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
                  </svg>
                  Eliminando...
                </span>
              ) : (
                "Eliminar"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal isOpen={isViewModalOpen} onClose={closeViewModal} className="m-4 w-[95vw] max-w-[800px]">
        <div className="no-scrollbar relative w-full max-w-full max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-4 lg:p-8 dark:bg-black dark:border dark:border-orange-500/30">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Detalles de Reserva/Venta
            </h4>
          </div>
        {viewingReservation && (
          <div className="px-2 space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Habitaciones</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {(viewingReservation.rooms && viewingReservation.rooms.length > 0) ? viewingReservation.rooms.join(', ') : (viewingReservation.room || '-')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Habitación</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{viewingReservation.roomType || '-'}</p>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hora de llegada</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {viewingReservation.arrivalTime || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Personas</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {String(viewingReservation.numAdults || 0)} Adultos, {String(viewingReservation.numChildren || 0)} Niños
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                  <Badge size="sm" color={getStatusBadgeColor(getAutoStatus(viewingReservation))}>
                    {getAutoStatus(viewingReservation)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Documento</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {(viewingReservation.documentType || '-') + ' ' + (viewingReservation.documentNumber || '')}
                  </p>
                </div>
                {viewingReservation.documentType === 'RUC' ? (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tipo / Estado / Condición</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {(viewingReservation.taxpayerType || '-') + ' / ' + (viewingReservation.businessStatus || '-') + ' / ' + (viewingReservation.businessCondition || '-')}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dirección</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{viewingReservation.address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Departamento</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{viewingReservation.department || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Provincia</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{viewingReservation.province || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Distrito</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{viewingReservation.district || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Acompañantes</p>
                <div className="mt-1 space-y-1">
                  {(viewingReservation.companions || []).length === 0 ? (
                    <p className="text-gray-700 dark:text-gray-300">-</p>
                  ) : (
                    (viewingReservation.companions || []).map((c, i) => (
                      <p key={i} className="text-gray-800 dark:text-white">{c.name}</p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={closeViewModal}>
              Cerrar
            </Button>
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
              <select name="concept" value={newLedgerItem.concept} onChange={handleAccountItemChange} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
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
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={closeAccountModal}>Cancelar</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 cursor-pointer" onClick={handleAddAccountItem}>Agregar</Button>
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
              <select name="categoria" value={comanda.categoria} onChange={handleComandaChange} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
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
                  <tr className="text-left sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                    <th className="py-2 pr-4">Cant.</th>
                    <th className="py-2 pr-4">Detalle</th>
                    <th className="py-2 pr-4">Importe</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="align-top divide-y divide-gray-100 dark:divide-gray-800">
                  {comandaItems.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 pr-4"><input type="number" min="1" value={it.cant} onChange={(e) => handleComandaItemChange(it.id, "cant", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="text" value={it.detalle} onChange={(e) => handleComandaItemChange(it.id, "detalle", e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="number" step="0.01" value={it.importe} onChange={(e) => handleComandaItemChange(it.id, "importe", e.target.value)} className="h-10 w-32 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2"><button onClick={() => removeComandaItem(it.id)} className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg cursor-pointer">Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
               <div className="mt-4 flex items-center justify-between">
                <Button size="sm" variant="outline" className="cursor-pointer flex items-center gap-2" onClick={addBreakfastRow}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12h14"/></svg>
                  Añadir fila
                </Button>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total filas: {breakfastRows.length}</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-6">
              <div className="text-sm text-gray-700 dark:text-gray-400">Total S/. <span className="font-semibold text-gray-800 dark:text-white">{comandaTotal.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={closeComandaModal}>Cancelar</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 cursor-pointer" onClick={saveComanda}>Guardar Comanda</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBreakfastModalOpen} onClose={closeBreakfastModal} className="max-w-[900px] m-4">
        <div className="no-scrollbar relative w-full max-w-[900px] max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Reporte de Desayunos</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Registra el consumo de desayunos por habitación y tipo.</p>
          </div>
          <div className="px-2 space-y-4 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Empleado</label>
                <input name="empleado" value={breakfastForm.empleado} onChange={handleBreakfastChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Fecha</label>
                <input name="fecha" value={breakfastForm.fecha} onChange={handleBreakfastChange} type="date" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
              </div>
            </div>
            <div className="no-scrollbar overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Hab</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Nombres y Apellidos</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-center">Americ.</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-center">Contin.</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-center">Adici.</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-center w-20">Acciones</th>
                  </tr>
                </thead>
                <tbody className="align-top divide-y divide-gray-100 dark:divide-gray-800">
                  {breakfastRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-3 px-4"><input type="text" value={r.hab} onChange={(e) => handleBreakfastRowChange(r.id, "hab", e.target.value)} className="h-10 w-20 rounded-lg border border-gray-300 px-3 text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" /></td>
                      <td className="py-3 px-4"><input type="text" value={r.nombres} onChange={(e) => handleBreakfastRowChange(r.id, "nombres", e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" /></td>
                      <td className="py-3 px-4"><input type="number" min="0" value={r.americ} onChange={(e) => handleBreakfastRowChange(r.id, "americ", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3 text-center text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" /></td>
                      <td className="py-3 px-4"><input type="number" min="0" value={r.contin} onChange={(e) => handleBreakfastRowChange(r.id, "contin", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3 text-center text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" /></td>
                      <td className="py-3 px-4"><input type="number" min="0" value={r.adici} onChange={(e) => handleBreakfastRowChange(r.id, "adici", Number(e.target.value))} className="h-10 w-20 rounded-lg border border-gray-300 px-3 text-center text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" /></td>
                      <td className="py-3 px-4 text-center">
                         <button onClick={() => removeBreakfastRow(r.id)} className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg cursor-pointer" title="Eliminar fila">
                           <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M9 6V4h6v2M10 11v6M14 11v6M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></svg>
                         </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3">
                <Button size="sm" variant="outline" className="cursor-pointer flex items-center gap-2" onClick={addBreakfastRow}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12h14"/></svg>Añadir fila</Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={closeBreakfastModal}>Cancelar</Button>
            <Button 
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600 cursor-pointer disabled:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50" 
              disabled={isSavingBreakfast}
              onClick={saveBreakfastReport}
            >
              {isSavingBreakfast ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                "Guardar Reporte"
              )}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Modal Nota de Día */}
      <Modal isOpen={isNoteModalOpen} onClose={closeNoteModal} className="m-2 w-[95vw] max-w-[500px]">
        <div className="relative w-full max-w-full rounded-3xl bg-white p-6 dark:bg-black dark:border dark:border-orange-500/30">
          <div className="px-2">
            <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">Nota del día</h4>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{noteDate || '-'}</p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 dark:focus:border-orange-800"
              placeholder="Escribe una nota breve"
            />
            <div className="mt-5 flex items-center gap-2">
              <Button onClick={async () => { try { const t = noteText.trim(); const saved = await setCalendarNote(noteDate, t); setDayNotes((prev) => ({ ...prev, [saved.date]: saved.text || "" })); closeNoteModal(); } catch (e) { console.error(e); } }}>Guardar</Button>
              <Button variant="outline" className="cursor-pointer" onClick={async () => { try { await deleteCalendarNote(noteDate); setDayNotes((prev) => { const next = { ...prev }; delete next[noteDate]; return next; }); closeNoteModal(); } catch (e) { console.error(e); } }}>Eliminar</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

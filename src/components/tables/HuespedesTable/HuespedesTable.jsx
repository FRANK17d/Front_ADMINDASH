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
import { PencilIcon, TrashBinIcon, PlusIcon, ChevronLeftIcon, AngleRightIcon, EyeIcon, CloseIcon } from "../../../icons";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../ui/modal";
import Label from "../../form/Label";
import { getHuespedes, createHuesped, updateHuesped, deleteHuesped, lookupDocumento } from "../../../api/huespedes";
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from 'date-fns/locale/es';

// Registrar locale español para el DatePicker
registerLocale('es', es);

// Función helper para formatear fechas sin problemas de zona horaria
const formatDateLocal = (dateString) => {
  if (!dateString) return '';
  // Parsear la fecha como string directamente para evitar problemas de zona horaria
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
};

// Función helper para formatear hora en formato AM/PM
const formatTimeAMPM = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  if (!hours || !minutes) return timeString;

  let hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // Si es 0, mostrar 12

  return `${hour}:${minutes} ${ampm}`;
};

// Función helper para parsear hora 24h a componentes 12h (hora, minutos, ampm)
const parseTime12h = (timeString) => {
  if (!timeString) return { hour: '12', minute: '00', ampm: 'PM' };
  const [hours, minutes] = timeString.split(':');
  if (!hours) return { hour: '12', minute: '00', ampm: 'PM' };

  let hour = parseInt(hours, 10);
  if (isNaN(hour)) return { hour: '12', minute: '00', ampm: 'PM' };

  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;

  return {
    hour: String(hour).padStart(2, '0'),
    minute: (minutes || '00').slice(0, 2).padStart(2, '0'),
    ampm
  };
};

// Función helper para construir hora 24h desde componentes 12h
const buildTime24h = (hour, minute, ampm) => {
  let h = parseInt(hour, 10);
  if (isNaN(h)) h = 12;
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  // Asegurarse de que minute siempre tenga un valor válido
  const m = (minute || '00').padStart(2, '0');
  return `${String(h).padStart(2, '0')}:${m}`;
};

export default function HuespedesTable({ onCountChange }) {
  const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useModal();
  const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isViewModalOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingHuesped, setEditingHuesped] = useState(null);
  const [viewingHuesped, setViewingHuesped] = useState(null);
  const [huespedToDelete, setHuespedToDelete] = useState(null);
  const [data, setData] = useState([]);
  const [loadingHuespedes, setLoadingHuespedes] = useState(false);
  const [creatingHuesped, setCreatingHuesped] = useState(false);
  const [editingHuespedLoading, setEditingHuespedLoading] = useState(false);
  const [deletingHuesped, setDeletingHuesped] = useState(false);
  const [error, setError] = useState("");
  const [_lookupLoading, setLookupLoading] = useState(false);
  const [habitacionesPopover, setHabitacionesPopover] = useState(null); // ID del huésped con popover abierto
  const [acompanantesPopover, setAcompanantesPopover] = useState(null); // ID del huésped con popover de acompañantes abierto
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 }); // Posición del popover activo

  const [createForm, setCreateForm] = useState({
    canal_venta: "RECEPCION",
    tipo_comprobante: "BOLETA",
    numero_boleta: "",
    numero_factura: "",
    nombres_apellidos: "",
    tipo_documento: "DNI",
    numero_documento: "",
    numero_ruc: "",
    nombre_o_razon_social: "",
    estado: "",
    condicion: "",
    direccion_completa: "",
    fecha_nacimiento: "",
    nacionalidad: "Peruana",
    procedencia: "",
    celular: "",
    check_in: "",
    hora_entrada: "",
    check_out: "",
    hora_salida: "",
    tipo_habitacion: "SIMPLE",
    numero_habitacion: "111",
    tarifa_noche: "",
    adultos: 1,
    ninos: 0,
    metodo_pago: "EFECTIVO",
    tipo_desayuno: "NINGUNO",
    observacion: "",
    acompanantes: [],
    habitaciones_adicionales: [],
  });

  const [editForm, setEditForm] = useState({});

  const itemsPerPage = 5;

  const sanitizePayload = (form) => {
    const payload = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // Manejar habitaciones_adicionales
      if (key === "habitaciones_adicionales" && Array.isArray(value)) {
        payload[key] = value.map(hab => {
          const sanitizedHab = {};
          Object.entries(hab).forEach(([habKey, habValue]) => {
            if (habValue === undefined) return;
            // Manejar tarifa como número
            if (habKey === "tarifa") {
              const v = typeof habValue === "string" ? habValue.trim() : habValue;
              if (v === "" || v === null) {
                sanitizedHab[habKey] = null;
                return;
              }
              const num = parseFloat(v);
              if (!Number.isNaN(num)) sanitizedHab[habKey] = num;
              return;
            }
            // Strings vacíos convertir a null
            if (typeof habValue === "string") {
              const v = habValue.trim();
              if (v === "") {
                sanitizedHab[habKey] = null;
                return;
              }
              sanitizedHab[habKey] = v;
              return;
            }
            sanitizedHab[habKey] = habValue;
          });
          return sanitizedHab;
        });
        return;
      }

      if (key === "tarifa_noche") {
        const v = typeof value === "string" ? value.trim() : value;
        if (v === "" || v === null) return;
        const num = parseFloat(v);
        if (!Number.isNaN(num)) payload[key] = num;
        return;
      }
      if (key === "adultos" || key === "ninos") {
        const v = typeof value === "string" ? value.trim() : value;
        if (v === "" || v === null) return;
        const num = parseInt(v, 10);
        if (!Number.isNaN(num)) payload[key] = num;
        return;
      }
      if (typeof value === "string") {
        const v = value.trim();
        // Permitir enviar null si el string está vacío para poder limpiar campos opcionales
        if (v === "") {
          payload[key] = null;
          return;
        }
        payload[key] = v;
        return;
      }
      payload[key] = value;
    });
    return payload;
  };

  const extractErrorMessages = (err) => {
    const messages = [];
    const data = err?.response?.data || {};
    const errors = data?.errors ?? data?.error ?? data?.message;
    if (err?.message === 'NOT_AUTHENTICATED') {
      messages.push('No autenticado. Inicie sesión para continuar');
    } else if (typeof errors === 'object' && errors) {
      Object.entries(errors).forEach(([field, detail]) => {
        const text = Array.isArray(detail) ? detail.join(', ') : String(detail);
        messages.push(`${field}: ${text}`);
      });
    } else if (typeof errors === 'string') {
      messages.push(errors);
    } else if (err?.message) {
      messages.push(err.message);
    } else {
      messages.push('No se pudo crear el huésped');
    }
    return messages;
  };

  const handleLookupDocumentoCreate = async () => {
    try {
      if (!createForm.numero_documento || !["DNI", "CE"].includes(createForm.tipo_documento)) return;
      setLookupLoading(true);
      const res = await lookupDocumento(createForm.tipo_documento, createForm.numero_documento);
      const name = res?.name || "";
      if (name) {
        setCreateForm({ ...createForm, nombres_apellidos: name });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo autocompletar";
      toast.error(msg, { position: "bottom-right", autoClose: 2500 });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLookupRucCreate = async () => {
    try {
      const ruc = (createForm.numero_ruc || "").trim();
      if (ruc.length !== 11) return;
      setLookupLoading(true);
      const res = await lookupDocumento("RUC", ruc);
      const raw = res?.raw?.data || {};
      const nombre = res?.name || raw?.nombre_o_razon_social || raw?.razon_social || "";
      const estado = raw?.estado || raw?.estado_del_contribuyente || "";
      const condicion = raw?.condicion || raw?.condicion_del_contribuyente || "";
      const direccion = raw?.direccion_completa || raw?.domicilio_fiscal || raw?.direccion || [raw?.via, raw?.numero, raw?.interior, raw?.zona, raw?.distrito, raw?.provincia, raw?.departamento].filter(Boolean).join(" ");
      setCreateForm({
        ...createForm,
        nombre_o_razon_social: nombre || createForm.nombre_o_razon_social,
        estado: estado || createForm.estado,
        condicion: condicion || createForm.condicion,
        direccion_completa: direccion || createForm.direccion_completa,
      });
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo autocompletar RUC";
      toast.error(msg, { position: "bottom-right", autoClose: 2500 });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLookupDocumentoEdit = async () => {
    try {
      if (!editForm.numero_documento || !["DNI", "CE"].includes(editForm.tipo_documento)) return;
      setLookupLoading(true);
      const res = await lookupDocumento(editForm.tipo_documento, editForm.numero_documento);
      const name = res?.name || "";
      if (name) {
        setEditForm({ ...editForm, nombres_apellidos: name });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo autocompletar";
      toast.error(msg, { position: "bottom-right", autoClose: 2500 });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLookupRucEdit = async () => {
    try {
      const ruc = (editForm.numero_ruc || "").trim();
      if (ruc.length !== 11) return;
      setLookupLoading(true);
      const res = await lookupDocumento("RUC", ruc);
      const raw = res?.raw?.data || {};
      const nombre = res?.name || raw?.nombre_o_razon_social || raw?.razon_social || "";
      const estado = raw?.estado || raw?.estado_del_contribuyente || "";
      const condicion = raw?.condicion || raw?.condicion_del_contribuyente || "";
      const direccion = raw?.direccion_completa || raw?.domicilio_fiscal || raw?.direccion || [raw?.via, raw?.numero, raw?.interior, raw?.zona, raw?.distrito, raw?.provincia, raw?.departamento].filter(Boolean).join(" ");
      setEditForm({
        ...editForm,
        nombre_o_razon_social: nombre || editForm.nombre_o_razon_social,
        estado: estado || editForm.estado,
        condicion: condicion || editForm.condicion,
        direccion_completa: direccion || editForm.direccion_completa,
      });
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo autocompletar RUC";
      toast.error(msg, { position: "bottom-right", autoClose: 2500 });
    } finally {
      setLookupLoading(false);
    }
  };

  // Lookup para acompañantes (Crear)
  const handleLookupAcompananteCreate = async (index) => {
    try {
      const acompanante = createForm.acompanantes[index];
      if (!acompanante?.numero_documento || !["DNI", "CE"].includes(acompanante.tipo_documento)) return;
      setLookupLoading(true);
      const res = await lookupDocumento(acompanante.tipo_documento, acompanante.numero_documento);
      const name = res?.name || "";
      if (name) {
        const newAcompanantes = [...createForm.acompanantes];
        newAcompanantes[index].nombres_apellidos = name;
        setCreateForm({ ...createForm, acompanantes: newAcompanantes });
        toast.success(`Nombre autocompletado: ${name}`, { position: "bottom-right", autoClose: 2000 });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo autocompletar";
      toast.error(msg, { position: "bottom-right", autoClose: 2500 });
    } finally {
      setLookupLoading(false);
    }
  };

  // Lookup para acompañantes (Editar)
  const handleLookupAcompananteEdit = async (index) => {
    try {
      const acompanante = editForm.acompanantes?.[index];
      if (!acompanante?.numero_documento || !["DNI", "CE"].includes(acompanante.tipo_documento)) return;
      setLookupLoading(true);
      const res = await lookupDocumento(acompanante.tipo_documento, acompanante.numero_documento);
      const name = res?.name || "";
      if (name) {
        const newAcompanantes = [...editForm.acompanantes];
        newAcompanantes[index].nombres_apellidos = name;
        setEditForm({ ...editForm, acompanantes: newAcompanantes });
        toast.success(`Nombre autocompletado: ${name}`, { position: "bottom-right", autoClose: 2000 });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo autocompletar";
      toast.error(msg, { position: "bottom-right", autoClose: 2500 });
    } finally {
      setLookupLoading(false);
    }
  };

  // Lookup para habitaciones adicionales (Crear)
  const handleLookupHabitacionCreate = async (index) => {
    try {
      const habitacion = createForm.habitaciones_adicionales[index];
      if (!habitacion?.numero_documento || !["DNI", "CE"].includes(habitacion.tipo_documento)) return;
      setLookupLoading(true);
      const res = await lookupDocumento(habitacion.tipo_documento, habitacion.numero_documento);
      const name = res?.name || "";
      if (name) {
        const newHabitaciones = [...createForm.habitaciones_adicionales];
        newHabitaciones[index].nombres_apellidos = name;
        setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
        toast.success(`Nombre autocompletado: ${name}`, { position: "bottom-right", autoClose: 2000 });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo autocompletar";
      toast.error(msg, { position: "bottom-right", autoClose: 2500 });
    } finally {
      setLookupLoading(false);
    }
  };

  // Lookup para habitaciones adicionales (Editar)
  const handleLookupHabitacionEdit = async (index) => {
    try {
      const habitacion = editForm.habitaciones_adicionales?.[index];
      if (!habitacion?.numero_documento || !["DNI", "CE"].includes(habitacion.tipo_documento)) return;
      setLookupLoading(true);
      const res = await lookupDocumento(habitacion.tipo_documento, habitacion.numero_documento);
      const name = res?.name || "";
      if (name) {
        const newHabitaciones = [...editForm.habitaciones_adicionales];
        newHabitaciones[index].nombres_apellidos = name;
        setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
        toast.success(`Nombre autocompletado: ${name}`, { position: "bottom-right", autoClose: 2000 });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo autocompletar";
      toast.error(msg, { position: "bottom-right", autoClose: 2500 });
    } finally {
      setLookupLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setLoadingHuespedes(true);
      setError("");
      const res = await getHuespedes();
      if (res.success) {
        setData(res.data || []);
      }
    } catch (_e) {
      setError("No se pudo cargar huéspedes");
      setData([]);
    } finally {
      setLoadingHuespedes(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Cerrar popover de habitaciones al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (habitacionesPopover !== null) {
        // Si el clic no fue dentro del popover, cerrarlo
        const popoverElement = document.getElementById(`popover-hab-${habitacionesPopover}`);
        const badgeElement = document.getElementById(`badge-hab-${habitacionesPopover}`);
        if (popoverElement && !popoverElement.contains(e.target) && badgeElement && !badgeElement.contains(e.target)) {
          setHabitacionesPopover(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [habitacionesPopover]);

  // Cerrar popover de acompañantes al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (acompanantesPopover !== null) {
        const popoverElement = document.getElementById(`popover-acomp-${acompanantesPopover}`);
        const badgeElement = document.getElementById(`badge-acomp-${acompanantesPopover}`);
        if (popoverElement && !popoverElement.contains(e.target) && badgeElement && !badgeElement.contains(e.target)) {
          setAcompanantesPopover(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [acompanantesPopover]);

  // Filtrar datos basado en la búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const terms = searchTerm.toLowerCase().trim().split(/\s+/);
    const searchString = searchTerm.toLowerCase().trim();

    return data.filter(huesped => {
      const name = (huesped.nombres_apellidos || '').toLowerCase();
      const doc = (huesped.numero_documento || '').toLowerCase();
      const ruc = (huesped.numero_ruc || '').toLowerCase();

      // Check if ALL name terms are present in the name field (allows "Juan Perez" to match "Juan Carlos Perez")
      const matchesName = terms.every(t => name.includes(t));

      return matchesName || doc.includes(searchString) || ruc.includes(searchString);
    });
  }, [searchTerm, data]);

  // Calcular datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // Calcular número total de páginas
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    if (typeof onCountChange === 'function') {
      onCountChange(filteredData.length);
    }
  }, [filteredData, onCountChange]);

  // Handlers de paginación
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset paginación cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handler para crear huésped
  const handleCreateHuesped = async () => {
    try {
      setError("");
      setCreatingHuesped(true);

      const nombre = (createForm.nombres_apellidos || '').trim();
      const documento = (createForm.numero_documento || '').trim();
      const fechaNacimiento = (createForm.fecha_nacimiento || '').trim();
      const checkIn = (createForm.check_in || '').trim();
      const tarifa = createForm.tarifa_noche;

      const faltantes = [];
      if (!documento) faltantes.push('Número de Documento');
      if (!nombre) faltantes.push('Nombres y Apellidos');
      if (!fechaNacimiento) faltantes.push('Fecha de Nacimiento');
      if (!checkIn) faltantes.push('Fecha de Arribo (Check-in)');
      if (!tarifa || tarifa === '' || tarifa === null) faltantes.push('Tarifa por Noche');

      if (faltantes.length) {
        const msg = `Complete los campos: ${faltantes.join(', ')}`;
        setError(`Campos obligatorios faltantes: ${faltantes.join(', ')}`);
        toast.warn(msg, { position: 'bottom-right', autoClose: 3500 });
        return;
      }

      const payload = sanitizePayload(createForm);
      if (Object.keys(payload).length === 0) {
        toast.warn("Ingrese al menos un dato para registrar", { position: "bottom-right", autoClose: 2500 });
        return;
      }

      const res = await createHuesped(payload);

      if (res.success) {
        toast.success(`Huésped "${createForm.nombres_apellidos}" registrado exitosamente`, {
          position: "bottom-right",
          autoClose: 3000,
        });

        closeCreateModal();
        setCreateForm({
          canal_venta: "RECEPCION",
          tipo_comprobante: "BOLETA",
          numero_boleta: "",
          numero_factura: "",
          nombres_apellidos: "",
          tipo_documento: "DNI",
          numero_documento: "",
          numero_ruc: "",
          nombre_o_razon_social: "",
          estado: "",
          condicion: "",
          direccion_completa: "",
          fecha_nacimiento: "",
          nacionalidad: "Peruana",
          procedencia: "",
          celular: "",
          check_in: "",
          hora_entrada: "",
          check_out: "",
          hora_salida: "",
          tipo_habitacion: "SIMPLE",
          numero_habitacion: "111",
          tarifa_noche: "",
          adultos: 1,
          ninos: 0,
          metodo_pago: "EFECTIVO",
          tipo_desayuno: "NINGUNO",
          observacion: "",
          acompanantes: [],
          habitaciones_adicionales: [],
        });
        await refresh();
      }
    } catch (e) {
      const msgs = extractErrorMessages(e);
      setError(msgs.join(' | '));
      toast.error(msgs[0] || 'No se pudo crear el huésped', {
        position: "bottom-right",
        autoClose: 4000,
      });
    } finally {
      setCreatingHuesped(false);
    }
  };

  // Handler para editar huésped
  const handleEditHuespedClick = (huesped) => {
    setEditingHuesped(huesped);
    setEditForm({
      canal_venta: huesped.canal_venta || "RECEPCION",
      tipo_comprobante: huesped.tipo_comprobante || "BOLETA",
      numero_boleta: huesped.numero_boleta || "",
      numero_factura: huesped.numero_factura || "",
      nombres_apellidos: huesped.nombres_apellidos || "",
      tipo_documento: huesped.tipo_documento || "DNI",
      numero_documento: huesped.numero_documento || "",
      numero_ruc: huesped.numero_ruc || "",
      nombre_o_razon_social: huesped.nombre_o_razon_social || "",
      estado: huesped.estado || "",
      condicion: huesped.condicion || "",
      direccion_completa: huesped.direccion_completa || "",
      fecha_nacimiento: huesped.fecha_nacimiento || "",
      nacionalidad: huesped.nacionalidad || "Peruana",
      procedencia: huesped.procedencia || "",
      celular: huesped.celular || "",
      check_in: huesped.check_in || "",
      hora_entrada: huesped.hora_entrada || "",
      check_out: huesped.check_out || "",
      hora_salida: huesped.hora_salida || "",
      tipo_habitacion: huesped.tipo_habitacion || "SIMPLE",
      numero_habitacion: huesped.numero_habitacion || "111",
      tarifa_noche: huesped.tarifa_noche || "",
      adultos: huesped.adultos || 1,
      ninos: huesped.ninos || 0,
      metodo_pago: huesped.metodo_pago || "EFECTIVO",
      tipo_desayuno: huesped.tipo_desayuno || "NINGUNO",
      observacion: huesped.observacion || "",
      acompanantes: huesped.acompanantes || [],
      habitaciones_adicionales: huesped.habitaciones_adicionales || [],
    });
    openEditModal();
  };

  const handleUpdateHuesped = async () => {
    try {
      setError("");
      setEditingHuespedLoading(true);

      const nombre = (editForm.nombres_apellidos || '').trim();
      const documento = (editForm.numero_documento || '').trim();
      const faltantes = [];
      if (!nombre) faltantes.push('Nombres y Apellidos');
      if (!documento) faltantes.push('Número de Documento');

      if (faltantes.length) {
        toast.warn(`Complete campos faltantes: ${faltantes.join(', ')}`, {
          position: "bottom-right",
          autoClose: 3500
        });
        setEditingHuespedLoading(false);
        return;
      }

      const res = await updateHuesped(editingHuesped.id, sanitizePayload(editForm));

      if (res.success) {
        toast.success(`Huésped "${editForm.nombres_apellidos}" actualizado exitosamente`, {
          position: "bottom-right",
          autoClose: 3000,
        });

        closeEditModal();
        setEditingHuesped(null);
        await refresh();
      }
    } catch (e) {
      console.error(e);
      // Manejar errores que pueden venir como objeto
      let errorMessage = "No se pudo actualizar el huésped";
      if (e.response?.data) {
        const data = e.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors) {
          // Si errors es un objeto, convertirlo a string
          if (typeof data.errors === 'object') {
            const errorParts = [];
            for (const [field, messages] of Object.entries(data.errors)) {
              if (Array.isArray(messages)) {
                errorParts.push(`${field}: ${messages.join(', ')}`);
              } else if (typeof messages === 'string') {
                errorParts.push(`${field}: ${messages}`);
              }
            }
            errorMessage = errorParts.join(' | ') || "Error de validación";
          } else {
            errorMessage = String(data.errors);
          }
        } else if (data.detail) {
          errorMessage = data.detail;
        }
      } else if (e.message) {
        errorMessage = e.message;
      }
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    } finally {
      setEditingHuespedLoading(false);
    }
  };

  // Handler para eliminar huésped
  const handleDeleteHuesped = async (id) => {
    try {
      setDeletingHuesped(true);
      setError("");

      await deleteHuesped(id);

      const huespedName = huespedToDelete?.nombres_apellidos || "Huésped";

      toast.success(`Huésped "${huespedName}" eliminado exitosamente`, {
        position: "bottom-right",
        autoClose: 3000,
      });

      closeDeleteModal();
      setHuespedToDelete(null);
      await refresh();
    } catch (e) {
      console.error(e);
      const errorMessage = e.message || "No se pudo eliminar el huésped";
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
      });
    } finally {
      setDeletingHuesped(false);
    }
  };

  const handleOpenDeleteModal = (huesped) => {
    setHuespedToDelete(huesped);
    openDeleteModal();
  };

  const handleViewHuesped = (huesped) => {
    setViewingHuesped(huesped);
    openViewModal();
  };

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      {/* Barra de búsqueda y botón crear */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Buscar por nombre, documento o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 w-full md:w-auto"
          size="sm"
        >
          <PlusIcon className="w-4 h-4 fill-current" />
          Nuevo Pasajero
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Modal de Creación */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} className="max-w-[800px] m-4">
        <div className="no-scrollbar relative w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-black dark:border dark:border-orange-500/30 p-6 lg:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Registrar Nuevo Pasajero
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Complete la información del huésped
            </p>
          </div>

          <div className="space-y-6">
            {/* Información de Venta */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Información de Venta
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="canal_venta">Canal de Venta</Label>
                  <select
                    id="canal_venta"
                    value={createForm.canal_venta}
                    onChange={(e) => setCreateForm({ ...createForm, canal_venta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="BOOKING">Booking</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="RECEPCION">Recepción</option>
                    <option value="EXPEDIA">Expedia</option>
                    <option value="AIRBNB">Airbnb</option> 
                  </select>
                </div>
                <div>
                  <Label htmlFor="tipo_comprobante">Tipo de Comprobante</Label>
                  <select
                    id="tipo_comprobante"
                    value={createForm.tipo_comprobante}
                    onChange={(e) => setCreateForm({ ...createForm, tipo_comprobante: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="BOLETA">Boleta</option>
                    <option value="FACTURA">Factura</option>
                  </select>
                </div>
                {createForm.tipo_comprobante === "BOLETA" && (
                  <div>
                    <Label htmlFor="numero_boleta">N° de Boleta</Label>
                    <Input
                      id="numero_boleta"
                      placeholder="Ej: B001-00001"
                      value={createForm.numero_boleta}
                      onChange={(e) => setCreateForm({ ...createForm, numero_boleta: e.target.value })}
                    />
                  </div>
                )}
                {createForm.tipo_comprobante === "FACTURA" && (
                  <div>
                    <Label htmlFor="numero_factura">N° de Factura</Label>
                    <Input
                      id="numero_factura"
                      placeholder="Ej: F001-00001"
                      value={createForm.numero_factura}
                      onChange={(e) => setCreateForm({ ...createForm, numero_factura: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Información Personal */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Información Personal
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                    <select
                      id="tipo_documento"
                      value={createForm.tipo_documento}
                      onChange={(e) => setCreateForm({ ...createForm, tipo_documento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="CIP">CIP</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="numero_documento">Número de Documento</Label>
                    <Input
                      id="numero_documento"
                      value={createForm.numero_documento}
                      onChange={(e) => setCreateForm({ ...createForm, numero_documento: e.target.value })}
                      onBlur={handleLookupDocumentoCreate}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="nombres_apellidos">Nombres y Apellidos Completos</Label>
                    <Input
                      id="nombres_apellidos"
                      value={createForm.nombres_apellidos}
                      onChange={(e) => setCreateForm({ ...createForm, nombres_apellidos: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="celular">Número de Celular</Label>
                    <Input
                      id="celular"
                      value={createForm.celular}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setCreateForm({ ...createForm, celular: value });
                      }}
                      maxLength="9"
                      placeholder="9 dígitos"
                    />
                  </div>
                </div>

                {/* Nuevos campos reubicados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                    <DatePicker
                      id="fecha_nacimiento"
                      selected={createForm.fecha_nacimiento ? new Date(createForm.fecha_nacimiento + 'T00:00:00') : null}
                      onChange={(date) => {
                        if (date) {
                          const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                          setCreateForm({ ...createForm, fecha_nacimiento: formatted });
                        } else {
                          setCreateForm({ ...createForm, fecha_nacimiento: '' });
                        }
                      }}
                      locale="es"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={100}
                      scrollableYearDropdown
                      maxDate={new Date()}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Seleccionar fecha"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                      calendarClassName="dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nacionalidad">Nacionalidad</Label>
                    <Input
                      id="nacionalidad"
                      value={createForm.nacionalidad}
                      onChange={(e) => setCreateForm({ ...createForm, nacionalidad: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="procedencia">Procedencia</Label>
                    <Input
                      id="procedencia"
                      value={createForm.procedencia}
                      onChange={(e) => setCreateForm({ ...createForm, procedencia: e.target.value })}
                    />
                  </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_ruc">Número de RUC (Opcional)</Label>
                    <Input
                      id="numero_ruc"
                      value={createForm.numero_ruc}
                      onChange={(e) => setCreateForm({ ...createForm, numero_ruc: e.target.value })}
                      onBlur={handleLookupRucCreate}
                      maxLength="11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombre_o_razon_social">Nombre o Razón Social</Label>
                    <Input
                      id="nombre_o_razon_social"
                      value={createForm.nombre_o_razon_social}
                      onChange={(e) => setCreateForm({ ...createForm, nombre_o_razon_social: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estado">Estado RUC</Label>
                    <Input
                      id="estado"
                      value={createForm.estado}
                      onChange={(e) => setCreateForm({ ...createForm, estado: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="condicion">Condición RUC</Label>
                    <Input
                      id="condicion"
                      value={createForm.condicion}
                      onChange={(e) => setCreateForm({ ...createForm, condicion: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="direccion_completa">Dirección Completa</Label>
                  <Input
                    id="direccion_completa"
                    value={createForm.direccion_completa}
                    onChange={(e) => setCreateForm({ ...createForm, direccion_completa: e.target.value })}
                  />
                </div>
              </div>
            </div >

            {/* Información de Hospedaje */}
            < div className="space-y-4" >
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Información de Hospedaje
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in">Fecha de Arrivo</Label>
                  <DatePicker
                    id="check_in"
                    selected={createForm.check_in ? new Date(createForm.check_in + 'T00:00:00') : null}
                    onChange={(date) => {
                      if (date) {
                        const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        // Solo mantener sincronizado si ya es DAY USE (ambas fechas iguales)
                        if (createForm.check_in && createForm.check_out && createForm.check_in === createForm.check_out) {
                          setCreateForm({ ...createForm, check_in: formatted, check_out: formatted });
                        } else {
                          setCreateForm({ ...createForm, check_in: formatted });
                        }
                      } else {
                        setCreateForm({ ...createForm, check_in: '' });
                      }
                    }}
                    locale="es"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar fecha"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                    calendarClassName="dark:bg-gray-800"
                  />
                  <div className="mt-2">
                    <Label>Hora de Entrada</Label>
                    <div className="flex gap-2 items-center">
                      <select
                        value={parseTime12h(createForm.hora_entrada).hour}
                        onChange={(e) => {
                          const parsed = parseTime12h(createForm.hora_entrada);
                          setCreateForm({ ...createForm, hora_entrada: buildTime24h(e.target.value, parsed.minute, parsed.ampm) });
                        }}
                        className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                      >
                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-gray-500 dark:text-gray-400 font-bold">:</span>
                      <input
                        type="text"
                        maxLength="2"
                        defaultValue={parseTime12h(createForm.hora_entrada).minute}
                        key={`min-entrada-${createForm.hora_entrada}`}
                        onBlur={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                          if (!val) val = '00';
                          if (parseInt(val) > 59) val = '59';
                          val = val.padStart(2, '0');
                          e.target.value = val;
                          const parsed = parseTime12h(createForm.hora_entrada);
                          setCreateForm({ ...createForm, hora_entrada: buildTime24h(parsed.hour, val, parsed.ampm) });
                        }}
                        className="w-14 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                        placeholder="00"
                      />
                      <select
                        value={parseTime12h(createForm.hora_entrada).ampm}
                        onChange={(e) => {
                          const parsed = parseTime12h(createForm.hora_entrada);
                          setCreateForm({ ...createForm, hora_entrada: buildTime24h(parsed.hour, parsed.minute, e.target.value) });
                        }}
                        className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white font-medium"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="check_out">Fecha de Salida</Label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm.check_in && createForm.check_in === createForm.check_out}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Establecer fecha de hoy (zona horaria local) en ambos campos
                            const now = new Date();
                            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                            setCreateForm({ ...createForm, check_in: today, check_out: today });
                          } else {
                            // Al deseleccionar, limpiar check_out para que el usuario elija otra fecha
                            setCreateForm({ ...createForm, check_out: '' });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400">DAY USE</span>
                    </label>
                  </div>
                  <DatePicker
                    id="check_out"
                    selected={createForm.check_out ? new Date(createForm.check_out + 'T00:00:00') : null}
                    onChange={(date) => {
                      if (date) {
                        const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        setCreateForm({ ...createForm, check_out: formatted });
                      } else {
                        setCreateForm({ ...createForm, check_out: '' });
                      }
                    }}
                    locale="es"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    minDate={createForm.check_in ? new Date(createForm.check_in + 'T00:00:00') : null}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar fecha"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                    calendarClassName="dark:bg-gray-800"
                  />
                  {createForm.check_in && createForm.check_in === createForm.check_out && (
                    <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                      Huésped llega y se va el mismo día
                    </p>
                  )}
                  <div className="mt-2">
                    <Label>Hora de Salida</Label>
                    <div className="flex gap-2 items-center">
                      <select
                        value={parseTime12h(createForm.hora_salida).hour}
                        onChange={(e) => {
                          const parsed = parseTime12h(createForm.hora_salida);
                          setCreateForm({ ...createForm, hora_salida: buildTime24h(e.target.value, parsed.minute, parsed.ampm) });
                        }}
                        className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                      >
                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-gray-500 dark:text-gray-400 font-bold">:</span>
                      <input
                        type="text"
                        maxLength="2"
                        defaultValue={parseTime12h(createForm.hora_salida).minute}
                        key={`min-salida-${createForm.hora_salida}`}
                        onBlur={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                          if (!val) val = '00';
                          if (parseInt(val) > 59) val = '59';
                          val = val.padStart(2, '0');
                          e.target.value = val;
                          const parsed = parseTime12h(createForm.hora_salida);
                          setCreateForm({ ...createForm, hora_salida: buildTime24h(parsed.hour, val, parsed.ampm) });
                        }}
                        className="w-14 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                        placeholder="00"
                      />
                      <select
                        value={parseTime12h(createForm.hora_salida).ampm}
                        onChange={(e) => {
                          const parsed = parseTime12h(createForm.hora_salida);
                          setCreateForm({ ...createForm, hora_salida: buildTime24h(parsed.hour, parsed.minute, e.target.value) });
                        }}
                        className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white font-medium"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_habitacion">Tipo de Habitación</Label>
                  <select
                    id="tipo_habitacion"
                    value={createForm.tipo_habitacion}
                    onChange={(e) => setCreateForm({ ...createForm, tipo_habitacion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="SIMPLE">Simple</option>
                    <option value="DOBLE">Doble</option>
                    <option value="MATRIMONIAL">Matrimonial</option>
                    <option value="TRIPLE">Triple</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="numero_habitacion">Número de Habitación</Label>
                  <select
                    id="numero_habitacion"
                    value={createForm.numero_habitacion}
                    onChange={(e) => setCreateForm({ ...createForm, numero_habitacion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  >
                    {['111', '112', '113', '210', '211', '212', '213', '214', '215', '310', '311', '312', '313', '314', '315'].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tarifa_noche">
                    {createForm.check_in && createForm.check_in === createForm.check_out
                      ? 'Tarifa DAY USE (S/.)'
                      : 'Tarifa por Noche (S/.)'}
                  </Label>
                  <Input
                    id="tarifa_noche"
                    type="number"
                    step="0.01"
                    value={createForm.tarifa_noche}
                    onChange={(e) => setCreateForm({ ...createForm, tarifa_noche: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="adultos">Adultos</Label>
                  <Input
                    id="adultos"
                    type="number"
                    min="1"
                    value={createForm.adultos}
                    onChange={(e) => setCreateForm({ ...createForm, adultos: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="ninos">Niños</Label>
                  <Input
                    id="ninos"
                    type="number"
                    min="0"
                    value={createForm.ninos}
                    onChange={(e) => setCreateForm({ ...createForm, ninos: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metodo_pago">Método de Pago</Label>
                  <select
                    id="metodo_pago"
                    value={createForm.metodo_pago}
                    onChange={(e) => setCreateForm({ ...createForm, metodo_pago: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="YAPE">Yape</option>
                    <option value="PLIN">Plin</option>
                    <option value="TARJETA">Tarjeta Débito/Crédito</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="tipo_desayuno">Tipo de Desayuno</Label>
                  <select
                    id="tipo_desayuno"
                    value={createForm.tipo_desayuno}
                    onChange={(e) => setCreateForm({ ...createForm, tipo_desayuno: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="NINGUNO">Ninguno</option>
                    <option value="CONTINENTAL">Desayuno Continental</option>
                    <option value="AMERICANO">Desayuno Americano</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="observacion">Observación</Label>
                <textarea
                  id="observacion"
                  value={createForm.observacion}
                  onChange={(e) => setCreateForm({ ...createForm, observacion: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div >

            {/* Acompañantes */}
            < div className="space-y-4" >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acompañantes
                </h4>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setCreateForm({
                      ...createForm,
                      acompanantes: [
                        ...createForm.acompanantes,
                        {
                          tipo_documento: "DNI",
                          numero_documento: "",
                          nombres_apellidos: "",
                          fecha_nacimiento: "",
                          nacionalidad: "Peruana",
                          procedencia: "",
                          tipo_desayuno: "NINGUNO",
                        },
                      ],
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4 fill-current" />
                  Agregar Persona
                </Button>
              </div>

              {
                createForm.acompanantes.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    No hay acompañantes registrados. Haga clic en "Agregar Persona" para añadir.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {createForm.acompanantes.map((acompanante, index) => (
                      <div
                        key={index}
                        className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newAcompanantes = createForm.acompanantes.filter((_, i) => i !== index);
                            setCreateForm({ ...createForm, acompanantes: newAcompanantes });
                          }}
                          className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          title="Eliminar acompañante"
                        >
                          <CloseIcon className="w-5 h-5" />
                        </button>

                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3">
                          Acompañante #{index + 1}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Tipo de Documento</Label>
                            <select
                              value={acompanante.tipo_documento}
                              onChange={(e) => {
                                const newAcompanantes = [...createForm.acompanantes];
                                newAcompanantes[index].tipo_documento = e.target.value;
                                setCreateForm({ ...createForm, acompanantes: newAcompanantes });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="DNI">DNI</option>
                              <option value="CE">CE</option>
                              <option value="PASAPORTE">Pasaporte</option>
                              <option value="CIP">CIP</option>
                            </select>
                          </div>
                          <div>
                            <Label>Número de Documento</Label>
                            <Input
                              value={acompanante.numero_documento}
                              onChange={(e) => {
                                const newAcompanantes = [...createForm.acompanantes];
                                newAcompanantes[index].numero_documento = e.target.value;
                                setCreateForm({ ...createForm, acompanantes: newAcompanantes });
                              }}
                              onBlur={() => handleLookupAcompananteCreate(index)}
                              placeholder="Ingrese y presione Tab para autocompletar"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <Label>Nombres y Apellidos Completos</Label>
                          <Input
                            value={acompanante.nombres_apellidos}
                            onChange={(e) => {
                              const newAcompanantes = [...createForm.acompanantes];
                              newAcompanantes[index].nombres_apellidos = e.target.value;
                              setCreateForm({ ...createForm, acompanantes: newAcompanantes });
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label>Fecha de Nacimiento</Label>
                            <DatePicker
                              selected={acompanante.fecha_nacimiento ? new Date(acompanante.fecha_nacimiento + 'T00:00:00') : null}
                              onChange={(date) => {
                                const newAcompanantes = [...createForm.acompanantes];
                                if (date) {
                                  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                  newAcompanantes[index].fecha_nacimiento = formatted;
                                } else {
                                  newAcompanantes[index].fecha_nacimiento = '';
                                }
                                setCreateForm({ ...createForm, acompanantes: newAcompanantes });
                              }}
                              locale="es"
                              showYearDropdown
                              showMonthDropdown
                              dropdownMode="select"
                              yearDropdownItemNumber={100}
                              scrollableYearDropdown
                              maxDate={new Date()}
                              dateFormat="dd/MM/yyyy"
                              placeholderText="Seleccionar fecha"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                              calendarClassName="dark:bg-gray-800"
                            />
                          </div>
                          <div>
                            <Label>Nacionalidad</Label>
                            <Input
                              value={acompanante.nacionalidad}
                              onChange={(e) => {
                                const newAcompanantes = [...createForm.acompanantes];
                                newAcompanantes[index].nacionalidad = e.target.value;
                                setCreateForm({ ...createForm, acompanantes: newAcompanantes });
                              }}
                            />
                          </div>
                          <div>
                            <Label>Procedencia</Label>
                            <Input
                              value={acompanante.procedencia}
                              onChange={(e) => {
                                const newAcompanantes = [...createForm.acompanantes];
                                newAcompanantes[index].procedencia = e.target.value;
                                setCreateForm({ ...createForm, acompanantes: newAcompanantes });
                              }}
                            />
                          </div>
                          <div>
                            <Label>Tipo de Desayuno</Label>
                            <select
                              value={acompanante.tipo_desayuno || "NINGUNO"}
                              onChange={(e) => {
                                const newAcompanantes = [...createForm.acompanantes];
                                newAcompanantes[index].tipo_desayuno = e.target.value;
                                setCreateForm({ ...createForm, acompanantes: newAcompanantes });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="NINGUNO">Ninguno</option>
                              <option value="CONTINENTAL">Continental</option>
                              <option value="AMERICANO">Americano</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div >

            {/* Habitaciones Adicionales */}
            < div className="space-y-4" >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Habitaciones Adicionales
                </h4>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    setCreateForm({
                      ...createForm,
                      habitaciones_adicionales: [
                        ...createForm.habitaciones_adicionales,
                        {
                          numero_habitacion: "111",
                          tipo_habitacion: "SIMPLE",
                          tipo_documento: "DNI",
                          numero_documento: "",
                          nombres_apellidos: "",
                          check_in: today,
                          hora_entrada: "",
                          check_out: "",
                          hora_salida: "",
                          tarifa: "",
                        },
                      ],
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4 fill-current" />
                  Agregar Habitación
                </Button>
              </div>

              {
                createForm.habitaciones_adicionales.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    No hay habitaciones adicionales. Haga clic en "Agregar Habitación" para añadir.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {createForm.habitaciones_adicionales.map((habitacion, index) => (
                      <div
                        key={index}
                        className="relative p-4 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newHabitaciones = createForm.habitaciones_adicionales.filter((_, i) => i !== index);
                            setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                          }}
                          className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          title="Eliminar habitación"
                        >
                          <CloseIcon className="w-5 h-5" />
                        </button>

                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">
                          Habitación Adicional #{index + 1}
                        </p>

                        {/* Fila 1: Número y Tipo de Habitación */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Número de Habitación</Label>
                            <select
                              value={habitacion.numero_habitacion}
                              onChange={(e) => {
                                const newHabitaciones = [...createForm.habitaciones_adicionales];
                                newHabitaciones[index].numero_habitacion = e.target.value;
                                setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                              {['111', '112', '113', '210', '211', '212', '213', '214', '215', '310', '311', '312', '313', '314', '315'].map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label>Tipo de Habitación</Label>
                            <select
                              value={habitacion.tipo_habitacion}
                              onChange={(e) => {
                                const newHabitaciones = [...createForm.habitaciones_adicionales];
                                newHabitaciones[index].tipo_habitacion = e.target.value;
                                setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="SIMPLE">Simple</option>
                              <option value="DOBLE">Doble</option>
                              <option value="MATRIMONIAL">Matrimonial</option>
                              <option value="TRIPLE">Triple</option>
                            </select>
                          </div>
                        </div>

                        {/* Fila 2: Documento del ocupante */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label>Tipo de Documento</Label>
                            <select
                              value={habitacion.tipo_documento}
                              onChange={(e) => {
                                const newHabitaciones = [...createForm.habitaciones_adicionales];
                                newHabitaciones[index].tipo_documento = e.target.value;
                                setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="DNI">DNI</option>
                              <option value="CE">CE</option>
                              <option value="PASAPORTE">Pasaporte</option>
                              <option value="CIP">CIP</option>
                            </select>
                          </div>
                          <div>
                            <Label>Número de Documento</Label>
                            <Input
                              value={habitacion.numero_documento || ''}
                              onChange={(e) => {
                                const newHabitaciones = [...createForm.habitaciones_adicionales];
                                newHabitaciones[index].numero_documento = e.target.value;
                                setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              onBlur={() => handleLookupHabitacionCreate(index)}
                              placeholder="Ingrese y presione Tab para autocompletar"
                            />
                          </div>
                        </div>

                        {/* Fila 3: Nombres */}
                        <div className="mt-3">
                          <Label>Nombres y Apellidos Completos</Label>
                          <Input
                            value={habitacion.nombres_apellidos || ''}
                            onChange={(e) => {
                              const newHabitaciones = [...createForm.habitaciones_adicionales];
                              newHabitaciones[index].nombres_apellidos = e.target.value;
                              setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                            }}
                          />
                        </div>

                        {/* Fila 4: Fechas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label>Fecha de Arribo</Label>
                            <DatePicker
                              selected={habitacion.check_in ? new Date(habitacion.check_in + 'T00:00:00') : null}
                              onChange={(date) => {
                                const newHabitaciones = [...createForm.habitaciones_adicionales];
                                if (date) {
                                  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                  newHabitaciones[index].check_in = formatted;
                                } else {
                                  newHabitaciones[index].check_in = '';
                                }
                                setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              locale="es"
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="select"
                              dateFormat="dd/MM/yyyy"
                              placeholderText="Seleccionar fecha"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              calendarClassName="dark:bg-gray-800"
                            />
                            <div className="mt-2">
                              <Label>Hora de Llegada</Label>
                              <div className="flex gap-2 items-center">
                                <select
                                  value={parseTime12h(habitacion.hora_entrada).hour}
                                  onChange={(e) => {
                                    const parsed = parseTime12h(habitacion.hora_entrada);
                                    const newHabitaciones = [...createForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_entrada = buildTime24h(e.target.value, parsed.minute, parsed.ampm);
                                    setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                >
                                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <span className="text-gray-500 dark:text-gray-400 font-bold">:</span>
                                <input
                                  type="text"
                                  maxLength="2"
                                  defaultValue={parseTime12h(habitacion.hora_entrada).minute}
                                  key={`hab-min-entrada-${index}-${habitacion.hora_entrada}`}
                                  onBlur={(e) => {
                                    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                    if (!val) val = '00';
                                    if (parseInt(val) > 59) val = '59';
                                    val = val.padStart(2, '0');
                                    e.target.value = val;
                                    const parsed = parseTime12h(habitacion.hora_entrada);
                                    const newHabitaciones = [...createForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_entrada = buildTime24h(parsed.hour, val, parsed.ampm);
                                    setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-14 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  placeholder="00"
                                />
                                <select
                                  value={parseTime12h(habitacion.hora_entrada).ampm}
                                  onChange={(e) => {
                                    const parsed = parseTime12h(habitacion.hora_entrada);
                                    const newHabitaciones = [...createForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_entrada = buildTime24h(parsed.hour, parsed.minute, e.target.value);
                                    setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-medium"
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <Label>Fecha de Salida</Label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={habitacion.check_in && habitacion.check_in === habitacion.check_out}
                                  onChange={(e) => {
                                    const newHabitaciones = [...createForm.habitaciones_adicionales];
                                    if (e.target.checked) {
                                      const now = new Date();
                                      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                      newHabitaciones[index].check_in = today;
                                      newHabitaciones[index].check_out = today;
                                    } else {
                                      newHabitaciones[index].check_out = '';
                                    }
                                    setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">DAY USE</span>
                              </label>
                            </div>
                            <DatePicker
                              selected={habitacion.check_out ? new Date(habitacion.check_out + 'T00:00:00') : null}
                              onChange={(date) => {
                                const newHabitaciones = [...createForm.habitaciones_adicionales];
                                if (date) {
                                  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                  newHabitaciones[index].check_out = formatted;
                                } else {
                                  newHabitaciones[index].check_out = '';
                                }
                                setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              locale="es"
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="select"
                              minDate={habitacion.check_in ? new Date(habitacion.check_in + 'T00:00:00') : null}
                              dateFormat="dd/MM/yyyy"
                              placeholderText="Seleccionar fecha"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              calendarClassName="dark:bg-gray-800"
                            />
                            {habitacion.check_in && habitacion.check_in === habitacion.check_out && (
                              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                DAY USE - Misma fecha de entrada y salida
                              </p>
                            )}
                            <div className="mt-2">
                              <Label>Hora de Salida</Label>
                              <div className="flex gap-2 items-center">
                                <select
                                  value={parseTime12h(habitacion.hora_salida).hour}
                                  onChange={(e) => {
                                    const parsed = parseTime12h(habitacion.hora_salida);
                                    const newHabitaciones = [...createForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_salida = buildTime24h(e.target.value, parsed.minute, parsed.ampm);
                                    setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                >
                                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <span className="text-gray-500 dark:text-gray-400 font-bold">:</span>
                                <input
                                  type="text"
                                  maxLength="2"
                                  defaultValue={parseTime12h(habitacion.hora_salida).minute}
                                  key={`hab-min-salida-${index}-${habitacion.hora_salida}`}
                                  onBlur={(e) => {
                                    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                    if (!val) val = '00';
                                    if (parseInt(val) > 59) val = '59';
                                    val = val.padStart(2, '0');
                                    e.target.value = val;
                                    const parsed = parseTime12h(habitacion.hora_salida);
                                    const newHabitaciones = [...createForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_salida = buildTime24h(parsed.hour, val, parsed.ampm);
                                    setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-14 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  placeholder="00"
                                />
                                <select
                                  value={parseTime12h(habitacion.hora_salida).ampm}
                                  onChange={(e) => {
                                    const parsed = parseTime12h(habitacion.hora_salida);
                                    const newHabitaciones = [...createForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_salida = buildTime24h(parsed.hour, parsed.minute, e.target.value);
                                    setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-medium"
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fila 5: Tarifa */}
                        <div className="mt-3">
                          <Label>
                            {habitacion.check_in && habitacion.check_in === habitacion.check_out
                              ? 'Tarifa DAY USE (S/.)'
                              : 'Tarifa (S/.)'}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={habitacion.tarifa || ''}
                            onChange={(e) => {
                              const newHabitaciones = [...createForm.habitaciones_adicionales];
                              newHabitaciones[index].tarifa = e.target.value;
                              setCreateForm({ ...createForm, habitaciones_adicionales: newHabitaciones });
                            }}
                            placeholder="Ingrese la tarifa"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div >
          </div >

          <div className="flex items-center gap-3 justify-end mt-6">
            <Button
              size="sm"
              variant="outline"
              onClick={closeCreateModal}
              disabled={creatingHuesped}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateHuesped}
              disabled={creatingHuesped}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {creatingHuesped ? "Registrando..." : "Registrar Pasajero"}
            </Button>
          </div>
        </div >
      </Modal >

      {/* Modal de Edición */}
      < Modal isOpen={isEditModalOpen} onClose={closeEditModal} className="max-w-[800px] m-4" >
        <div className="no-scrollbar relative w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-black dark:border dark:border-orange-500/30 p-6 lg:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Editar Pasajero
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Actualice la información del huésped
            </p>
          </div>

          {editingHuesped && (
            <div className="space-y-6">
              {/* Información de Venta */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Información de Venta
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit_canal_venta">Canal de Venta</Label>
                    <select
                      id="edit_canal_venta"
                      value={editForm.canal_venta}
                      onChange={(e) => setEditForm({ ...editForm, canal_venta: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="BOOKING">Booking</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="RECEPCION">Recepción</option>
                      <option value="EXPEDIA">Expedia</option>
                      <option value="AIRBNB">Airbnb</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit_tipo_comprobante">Tipo de Comprobante</Label>
                    <select
                      id="edit_tipo_comprobante"
                      value={editForm.tipo_comprobante}
                      onChange={(e) => setEditForm({ ...editForm, tipo_comprobante: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="BOLETA">Boleta</option>
                      <option value="FACTURA">Factura</option>
                    </select>
                  </div>
                  {editForm.tipo_comprobante === "BOLETA" && (
                    <div>
                      <Label htmlFor="edit_numero_boleta">N° de Boleta</Label>
                      <Input
                        id="edit_numero_boleta"
                        placeholder="Ej: B001-00001"
                        value={editForm.numero_boleta}
                        onChange={(e) => setEditForm({ ...editForm, numero_boleta: e.target.value })}
                      />
                    </div>
                  )}
                  {editForm.tipo_comprobante === "FACTURA" && (
                    <div>
                      <Label htmlFor="edit_numero_factura">N° de Factura</Label>
                      <Input
                        id="edit_numero_factura"
                        placeholder="Ej: F001-00001"
                        value={editForm.numero_factura}
                        onChange={(e) => setEditForm({ ...editForm, numero_factura: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Información Personal */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Información Personal
                </h4>
                <div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit_tipo_documento">Tipo de Documento</Label>
                        <select
                          id="edit_tipo_documento"
                          value={editForm.tipo_documento}
                          onChange={(e) => setEditForm({ ...editForm, tipo_documento: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="DNI">DNI</option>
                          <option value="CE">CE</option>
                          <option value="PASAPORTE">Pasaporte</option>
                          <option value="CIP">CIP</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="edit_numero_documento">Número de Documento</Label>
                        <Input
                          id="edit_numero_documento"
                          value={editForm.numero_documento}
                          onChange={(e) => setEditForm({ ...editForm, numero_documento: e.target.value })}
                          onBlur={handleLookupDocumentoEdit}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="edit_nombres_apellidos">Nombres y Apellidos Completos</Label>
                        <Input
                          id="edit_nombres_apellidos"
                          value={editForm.nombres_apellidos}
                          onChange={(e) => setEditForm({ ...editForm, nombres_apellidos: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_celular">Número de Celular</Label>
                        <Input
                          id="edit_celular"
                          value={editForm.celular || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                            setEditForm({ ...editForm, celular: value });
                          }}
                          maxLength="9"
                          placeholder="9 dígitos"
                        />
                      </div>
                    </div>

                    {/* Bloque reubicado con separación extra */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label htmlFor="edit_fecha_nacimiento">Fecha de Nacimiento</Label>
                        <DatePicker
                          id="edit_fecha_nacimiento"
                          selected={editForm.fecha_nacimiento ? new Date(editForm.fecha_nacimiento + 'T00:00:00') : null}
                          onChange={(date) => {
                            if (date) {
                              const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                              setEditForm({ ...editForm, fecha_nacimiento: formatted });
                            } else {
                              setEditForm({ ...editForm, fecha_nacimiento: '' });
                            }
                          }}
                          locale="es"
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          yearDropdownItemNumber={100}
                          scrollableYearDropdown
                          maxDate={new Date()}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Seleccionar fecha"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                          calendarClassName="dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_nacionalidad">Nacionalidad</Label>
                        <Input
                          id="edit_nacionalidad"
                          value={editForm.nacionalidad}
                          onChange={(e) => setEditForm({ ...editForm, nacionalidad: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_procedencia">Procedencia</Label>
                        <Input
                          id="edit_procedencia"
                          value={editForm.procedencia}
                          onChange={(e) => setEditForm({ ...editForm, procedencia: e.target.value })}
                        />
                      </div>
                    </div>



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="edit_numero_ruc">Número de RUC (Opcional)</Label>
                        <Input
                          id="edit_numero_ruc"
                          value={editForm.numero_ruc}
                          onChange={(e) => setEditForm({ ...editForm, numero_ruc: e.target.value })}
                          onBlur={handleLookupRucEdit}
                          maxLength="11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_nombre_o_razon_social">Nombre o Razón Social</Label>
                        <Input
                          id="edit_nombre_o_razon_social"
                          value={editForm.nombre_o_razon_social}
                          onChange={(e) => setEditForm({ ...editForm, nombre_o_razon_social: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit_estado">Estado RUC</Label>
                        <Input
                          id="edit_estado"
                          value={editForm.estado}
                          onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_condicion">Condición RUC</Label>
                        <Input
                          id="edit_condicion"
                          value={editForm.condicion}
                          onChange={(e) => setEditForm({ ...editForm, condicion: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit_direccion_completa">Dirección Completa</Label>
                      <Input
                        id="edit_direccion_completa"
                        value={editForm.direccion_completa}
                        onChange={(e) => setEditForm({ ...editForm, direccion_completa: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Hospedaje */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Información de Hospedaje
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_check_in">Check-in</Label>
                    <DatePicker
                      id="edit_check_in"
                      selected={editForm.check_in ? new Date(editForm.check_in + 'T00:00:00') : null}
                      onChange={(date) => {
                        if (date) {
                          const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                          if (editForm.check_in && editForm.check_out && editForm.check_in === editForm.check_out) {
                            setEditForm({ ...editForm, check_in: formatted, check_out: formatted });
                          } else {
                            setEditForm({ ...editForm, check_in: formatted });
                          }
                        } else {
                          setEditForm({ ...editForm, check_in: '' });
                        }
                      }}
                      locale="es"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Seleccionar fecha"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                      calendarClassName="dark:bg-gray-800"
                    />
                    <div className="mt-2">
                      <Label>Hora de Entrada</Label>
                      <div className="flex gap-2 items-center">
                        <select
                          value={parseTime12h(editForm.hora_entrada || '').hour}
                          onChange={(e) => {
                            const parsed = parseTime12h(editForm.hora_entrada || '');
                            setEditForm({ ...editForm, hora_entrada: buildTime24h(e.target.value, parsed.minute, parsed.ampm) });
                          }}
                          className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                        >
                          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="text-gray-500 dark:text-gray-400 font-bold">:</span>
                        <input
                          type="text"
                          maxLength="2"
                          defaultValue={parseTime12h(editForm.hora_entrada || '').minute}
                          key={`edit-min-entrada-${editForm.hora_entrada}`}
                          onBlur={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            if (!val) val = '00';
                            if (parseInt(val) > 59) val = '59';
                            val = val.padStart(2, '0');
                            e.target.value = val;
                            const parsed = parseTime12h(editForm.hora_entrada || '');
                            setEditForm({ ...editForm, hora_entrada: buildTime24h(parsed.hour, val, parsed.ampm) });
                          }}
                          className="w-14 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                          placeholder="00"
                        />
                        <select
                          value={parseTime12h(editForm.hora_entrada || '').ampm}
                          onChange={(e) => {
                            const parsed = parseTime12h(editForm.hora_entrada || '');
                            setEditForm({ ...editForm, hora_entrada: buildTime24h(parsed.hour, parsed.minute, e.target.value) });
                          }}
                          className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white font-medium"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="edit_check_out">Check-out</Label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.check_in && editForm.check_in === editForm.check_out}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const now = new Date();
                              const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                              setEditForm({ ...editForm, check_in: today, check_out: today });
                            } else {
                              setEditForm({ ...editForm, check_out: '' });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">DAY USE</span>
                      </label>
                    </div>
                    <DatePicker
                      id="edit_check_out"
                      selected={editForm.check_out ? new Date(editForm.check_out + 'T00:00:00') : null}
                      onChange={(date) => {
                        if (date) {
                          const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                          setEditForm({ ...editForm, check_out: formatted });
                        } else {
                          setEditForm({ ...editForm, check_out: '' });
                        }
                      }}
                      locale="es"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      minDate={editForm.check_in ? new Date(editForm.check_in + 'T00:00:00') : null}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Seleccionar fecha"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                      calendarClassName="dark:bg-gray-800"
                    />
                    {editForm.check_in && editForm.check_in === editForm.check_out && (
                      <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                        Huésped llega y se va el mismo día
                      </p>
                    )}
                    <div className="mt-2">
                      <Label>Hora de Salida</Label>
                      <div className="flex gap-2 items-center">
                        <select
                          value={parseTime12h(editForm.hora_salida || '').hour}
                          onChange={(e) => {
                            const parsed = parseTime12h(editForm.hora_salida || '');
                            setEditForm({ ...editForm, hora_salida: buildTime24h(e.target.value, parsed.minute, parsed.ampm) });
                          }}
                          className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                        >
                          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="text-gray-500 dark:text-gray-400 font-bold">:</span>
                        <input
                          type="text"
                          maxLength="2"
                          defaultValue={parseTime12h(editForm.hora_salida || '').minute}
                          key={`edit-min-salida-${editForm.hora_salida}`}
                          onBlur={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            if (!val) val = '00';
                            if (parseInt(val) > 59) val = '59';
                            val = val.padStart(2, '0');
                            e.target.value = val;
                            const parsed = parseTime12h(editForm.hora_salida || '');
                            setEditForm({ ...editForm, hora_salida: buildTime24h(parsed.hour, val, parsed.ampm) });
                          }}
                          className="w-14 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                          placeholder="00"
                        />
                        <select
                          value={parseTime12h(editForm.hora_salida || '').ampm}
                          onChange={(e) => {
                            const parsed = parseTime12h(editForm.hora_salida || '');
                            setEditForm({ ...editForm, hora_salida: buildTime24h(parsed.hour, parsed.minute, e.target.value) });
                          }}
                          className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white font-medium"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_tipo_habitacion">Tipo de Habitación</Label>
                    <select
                      id="edit_tipo_habitacion"
                      value={editForm.tipo_habitacion}
                      onChange={(e) => setEditForm({ ...editForm, tipo_habitacion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="SIMPLE">Simple</option>
                      <option value="DOBLE">Doble</option>
                      <option value="MATRIMONIAL">Matrimonial</option>
                      <option value="TRIPLE">Triple</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit_numero_habitacion">Número de Habitación</Label>
                    <select
                      id="edit_numero_habitacion"
                      value={editForm.numero_habitacion}
                      onChange={(e) => setEditForm({ ...editForm, numero_habitacion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                    >
                      {['111', '112', '113', '210', '211', '212', '213', '214', '215', '310', '311', '312', '313', '314', '315'].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit_tarifa_noche">
                      {editForm.check_in && editForm.check_in === editForm.check_out
                        ? 'Tarifa DAY USE (S/.)'
                        : 'Tarifa por Noche (S/.)'}
                    </Label>
                    <Input
                      id="edit_tarifa_noche"
                      type="number"
                      step="0.01"
                      value={editForm.tarifa_noche}
                      onChange={(e) => setEditForm({ ...editForm, tarifa_noche: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_adultos">Adultos</Label>
                    <Input
                      id="edit_adultos"
                      type="number"
                      min="1"
                      value={editForm.adultos}
                      onChange={(e) => setEditForm({ ...editForm, adultos: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_ninos">Niños</Label>
                    <Input
                      id="edit_ninos"
                      type="number"
                      min="0"
                      value={editForm.ninos}
                      onChange={(e) => setEditForm({ ...editForm, ninos: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_metodo_pago">Método de Pago</Label>
                    <select
                      id="edit_metodo_pago"
                      value={editForm.metodo_pago}
                      onChange={(e) => setEditForm({ ...editForm, metodo_pago: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="YAPE">Yape</option>
                      <option value="PLIN">Plin</option>
                      <option value="TARJETA">Tarjeta Débito/Crédito</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit_tipo_desayuno">Tipo de Desayuno</Label>
                    <select
                      id="edit_tipo_desayuno"
                      value={editForm.tipo_desayuno || 'NINGUNO'}
                      onChange={(e) => setEditForm({ ...editForm, tipo_desayuno: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="NINGUNO">Ninguno</option>
                      <option value="CONTINENTAL">Desayuno Continental</option>
                      <option value="AMERICANO">Desayuno Americano</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_observacion">Observación</Label>
                  <textarea
                    id="edit_observacion"
                    value={editForm.observacion}
                    onChange={(e) => setEditForm({ ...editForm, observacion: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Acompañantes (Edición) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Acompañantes
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        acompanantes: [
                          ...(editForm.acompanantes || []),
                          {
                            tipo_documento: "DNI",
                            numero_documento: "",
                            nombres_apellidos: "",
                            fecha_nacimiento: "",
                            nacionalidad: "Peruana",
                            procedencia: "",
                            tipo_desayuno: "NINGUNO",
                          },
                        ],
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4 fill-current" />
                    Agregar Persona
                  </Button>
                </div>

                {(!editForm.acompanantes || editForm.acompanantes.length === 0) ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    No hay acompañantes registrados. Haga clic en "Agregar Persona" para añadir.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {editForm.acompanantes.map((acompanante, index) => (
                      <div
                        key={index}
                        className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newAcompanantes = editForm.acompanantes.filter((_, i) => i !== index);
                            setEditForm({ ...editForm, acompanantes: newAcompanantes });
                          }}
                          className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          title="Eliminar acompañante"
                        >
                          <CloseIcon className="w-5 h-5" />
                        </button>

                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3">
                          Acompañante #{index + 1}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Tipo de Documento</Label>
                            <select
                              value={acompanante.tipo_documento}
                              onChange={(e) => {
                                const newAcompanantes = [...editForm.acompanantes];
                                newAcompanantes[index].tipo_documento = e.target.value;
                                setEditForm({ ...editForm, acompanantes: newAcompanantes });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="DNI">DNI</option>
                              <option value="CE">CE</option>
                              <option value="PASAPORTE">Pasaporte</option>
                              <option value="CIP">CIP</option>
                            </select>
                          </div>
                          <div>
                            <Label>Número de Documento</Label>
                            <Input
                              value={acompanante.numero_documento}
                              onChange={(e) => {
                                const newAcompanantes = [...editForm.acompanantes];
                                newAcompanantes[index].numero_documento = e.target.value;
                                setEditForm({ ...editForm, acompanantes: newAcompanantes });
                              }}
                              onBlur={() => handleLookupAcompananteEdit(index)}
                              placeholder="Ingrese y presione Tab para autocompletar"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <Label>Nombres y Apellidos Completos</Label>
                          <Input
                            value={acompanante.nombres_apellidos}
                            onChange={(e) => {
                              const newAcompanantes = [...editForm.acompanantes];
                              newAcompanantes[index].nombres_apellidos = e.target.value;
                              setEditForm({ ...editForm, acompanantes: newAcompanantes });
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label>Fecha de Nacimiento</Label>
                            <DatePicker
                              selected={acompanante.fecha_nacimiento ? new Date(acompanante.fecha_nacimiento + 'T00:00:00') : null}
                              onChange={(date) => {
                                const newAcompanantes = [...editForm.acompanantes];
                                if (date) {
                                  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                  newAcompanantes[index].fecha_nacimiento = formatted;
                                } else {
                                  newAcompanantes[index].fecha_nacimiento = '';
                                }
                                setEditForm({ ...editForm, acompanantes: newAcompanantes });
                              }}
                              locale="es"
                              showYearDropdown
                              showMonthDropdown
                              dropdownMode="select"
                              yearDropdownItemNumber={100}
                              scrollableYearDropdown
                              maxDate={new Date()}
                              dateFormat="dd/MM/yyyy"
                              placeholderText="Seleccionar fecha"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                              calendarClassName="dark:bg-gray-800"
                            />
                          </div>
                          <div>
                            <Label>Nacionalidad</Label>
                            <Input
                              value={acompanante.nacionalidad}
                              onChange={(e) => {
                                const newAcompanantes = [...editForm.acompanantes];
                                newAcompanantes[index].nacionalidad = e.target.value;
                                setEditForm({ ...editForm, acompanantes: newAcompanantes });
                              }}
                            />
                          </div>
                          <div>
                            <Label>Procedencia</Label>
                            <Input
                              value={acompanante.procedencia}
                              onChange={(e) => {
                                const newAcompanantes = [...editForm.acompanantes];
                                newAcompanantes[index].procedencia = e.target.value;
                                setEditForm({ ...editForm, acompanantes: newAcompanantes });
                              }}
                            />
                          </div>
                          <div>
                            <Label>Tipo de Desayuno</Label>
                            <select
                              value={acompanante.tipo_desayuno || "NINGUNO"}
                              onChange={(e) => {
                                const newAcompanantes = [...editForm.acompanantes];
                                newAcompanantes[index].tipo_desayuno = e.target.value;
                                setEditForm({ ...editForm, acompanantes: newAcompanantes });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="NINGUNO">Ninguno</option>
                              <option value="CONTINENTAL">Continental</option>
                              <option value="AMERICANO">Americano</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Habitaciones Adicionales (Edición) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Habitaciones Adicionales
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                      setEditForm({
                        ...editForm,
                        habitaciones_adicionales: [
                          ...(editForm.habitaciones_adicionales || []),
                          {
                            numero_habitacion: "111",
                            tipo_habitacion: "SIMPLE",
                            tipo_documento: "DNI",
                            numero_documento: "",
                            nombres_apellidos: "",
                            check_in: today,
                            hora_entrada: "",
                            check_out: "",
                            hora_salida: "",
                            tarifa: "",
                          },
                        ],
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4 fill-current" />
                    Agregar Habitación
                  </Button>
                </div>

                {(!editForm.habitaciones_adicionales || editForm.habitaciones_adicionales.length === 0) ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    No hay habitaciones adicionales. Haga clic en "Agregar Habitación" para añadir.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {editForm.habitaciones_adicionales.map((habitacion, index) => (
                      <div
                        key={index}
                        className="relative p-4 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newHabitaciones = editForm.habitaciones_adicionales.filter((_, i) => i !== index);
                            setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                          }}
                          className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          title="Eliminar habitación"
                        >
                          <CloseIcon className="w-5 h-5" />
                        </button>

                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">
                          Habitación Adicional #{index + 1}
                        </p>

                        {/* Fila 1: Número y Tipo de Habitación */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Número de Habitación</Label>
                            <select
                              value={habitacion.numero_habitacion}
                              onChange={(e) => {
                                const newHabitaciones = [...editForm.habitaciones_adicionales];
                                newHabitaciones[index].numero_habitacion = e.target.value;
                                setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                              {['111', '112', '113', '210', '211', '212', '213', '214', '215', '310', '311', '312', '313', '314', '315'].map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label>Tipo de Habitación</Label>
                            <select
                              value={habitacion.tipo_habitacion}
                              onChange={(e) => {
                                const newHabitaciones = [...editForm.habitaciones_adicionales];
                                newHabitaciones[index].tipo_habitacion = e.target.value;
                                setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="SIMPLE">Simple</option>
                              <option value="DOBLE">Doble</option>
                              <option value="MATRIMONIAL">Matrimonial</option>
                              <option value="TRIPLE">Triple</option>
                            </select>
                          </div>
                        </div>

                        {/* Fila 2: Documento del ocupante */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label>Tipo de Documento</Label>
                            <select
                              value={habitacion.tipo_documento}
                              onChange={(e) => {
                                const newHabitaciones = [...editForm.habitaciones_adicionales];
                                newHabitaciones[index].tipo_documento = e.target.value;
                                setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="DNI">DNI</option>
                              <option value="CE">CE</option>
                              <option value="PASAPORTE">Pasaporte</option>
                              <option value="CIP">CIP</option>
                            </select>
                          </div>
                          <div>
                            <Label>Número de Documento</Label>
                            <Input
                              value={habitacion.numero_documento || ''}
                              onChange={(e) => {
                                const newHabitaciones = [...editForm.habitaciones_adicionales];
                                newHabitaciones[index].numero_documento = e.target.value;
                                setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              onBlur={() => handleLookupHabitacionEdit(index)}
                              placeholder="Ingrese y presione Tab para autocompletar"
                            />
                          </div>
                        </div>

                        {/* Fila 3: Nombres */}
                        <div className="mt-3">
                          <Label>Nombres y Apellidos Completos</Label>
                          <Input
                            value={habitacion.nombres_apellidos || ''}
                            onChange={(e) => {
                              const newHabitaciones = [...editForm.habitaciones_adicionales];
                              newHabitaciones[index].nombres_apellidos = e.target.value;
                              setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                            }}
                          />
                        </div>

                        {/* Fila 4: Fechas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label>Fecha de Arribo</Label>
                            <DatePicker
                              selected={habitacion.check_in ? new Date(habitacion.check_in + 'T00:00:00') : null}
                              onChange={(date) => {
                                const newHabitaciones = [...editForm.habitaciones_adicionales];
                                if (date) {
                                  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                  newHabitaciones[index].check_in = formatted;
                                } else {
                                  newHabitaciones[index].check_in = '';
                                }
                                setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              locale="es"
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="select"
                              dateFormat="dd/MM/yyyy"
                              placeholderText="Seleccionar fecha"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              calendarClassName="dark:bg-gray-800"
                            />
                            <div className="mt-2">
                              <Label>Hora de Llegada</Label>
                              <div className="flex gap-2 items-center">
                                <select
                                  value={parseTime12h(habitacion.hora_entrada || '').hour}
                                  onChange={(e) => {
                                    const parsed = parseTime12h(habitacion.hora_entrada || '');
                                    const newHabitaciones = [...editForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_entrada = buildTime24h(e.target.value, parsed.minute, parsed.ampm);
                                    setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                >
                                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <span className="text-gray-500 dark:text-gray-400 font-bold">:</span>
                                <input
                                  type="text"
                                  maxLength="2"
                                  defaultValue={parseTime12h(habitacion.hora_entrada || '').minute}
                                  key={`edit-hab-min-entrada-${index}-${habitacion.hora_entrada}`}
                                  onBlur={(e) => {
                                    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                    if (!val) val = '00';
                                    if (parseInt(val) > 59) val = '59';
                                    val = val.padStart(2, '0');
                                    e.target.value = val;
                                    const parsed = parseTime12h(habitacion.hora_entrada || '');
                                    const newHabitaciones = [...editForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_entrada = buildTime24h(parsed.hour, val, parsed.ampm);
                                    setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-14 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  placeholder="00"
                                />
                                <select
                                  value={parseTime12h(habitacion.hora_entrada || '').ampm}
                                  onChange={(e) => {
                                    const parsed = parseTime12h(habitacion.hora_entrada || '');
                                    const newHabitaciones = [...editForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_entrada = buildTime24h(parsed.hour, parsed.minute, e.target.value);
                                    setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-medium"
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <Label>Fecha de Salida</Label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={habitacion.check_in && habitacion.check_in === habitacion.check_out}
                                  onChange={(e) => {
                                    const newHabitaciones = [...editForm.habitaciones_adicionales];
                                    if (e.target.checked) {
                                      const now = new Date();
                                      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                      newHabitaciones[index].check_in = today;
                                      newHabitaciones[index].check_out = today;
                                    } else {
                                      newHabitaciones[index].check_out = '';
                                    }
                                    setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">DAY USE</span>
                              </label>
                            </div>
                            <DatePicker
                              selected={habitacion.check_out ? new Date(habitacion.check_out + 'T00:00:00') : null}
                              onChange={(date) => {
                                const newHabitaciones = [...editForm.habitaciones_adicionales];
                                if (date) {
                                  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                  newHabitaciones[index].check_out = formatted;
                                } else {
                                  newHabitaciones[index].check_out = '';
                                }
                                setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                              }}
                              locale="es"
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="select"
                              minDate={habitacion.check_in ? new Date(habitacion.check_in + 'T00:00:00') : null}
                              dateFormat="dd/MM/yyyy"
                              placeholderText="Seleccionar fecha"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              calendarClassName="dark:bg-gray-800"
                            />
                            {habitacion.check_in && habitacion.check_in === habitacion.check_out && (
                              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                DAY USE - Misma fecha de entrada y salida
                              </p>
                            )}
                            <div className="mt-2">
                              <Label>Hora de Salida</Label>
                              <div className="flex gap-2 items-center">
                                <select
                                  value={parseTime12h(habitacion.hora_salida || '').hour}
                                  onChange={(e) => {
                                    const parsed = parseTime12h(habitacion.hora_salida || '');
                                    const newHabitaciones = [...editForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_salida = buildTime24h(e.target.value, parsed.minute, parsed.ampm);
                                    setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                >
                                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <span className="text-gray-500 dark:text-gray-400 font-bold">:</span>
                                <input
                                  type="text"
                                  maxLength="2"
                                  defaultValue={parseTime12h(habitacion.hora_salida || '').minute}
                                  key={`edit-hab-min-salida-${index}-${habitacion.hora_salida}`}
                                  onBlur={(e) => {
                                    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                    if (!val) val = '00';
                                    if (parseInt(val) > 59) val = '59';
                                    val = val.padStart(2, '0');
                                    e.target.value = val;
                                    const parsed = parseTime12h(habitacion.hora_salida || '');
                                    const newHabitaciones = [...editForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_salida = buildTime24h(parsed.hour, val, parsed.ampm);
                                    setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-14 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  placeholder="00"
                                />
                                <select
                                  value={parseTime12h(habitacion.hora_salida || '').ampm}
                                  onChange={(e) => {
                                    const parsed = parseTime12h(habitacion.hora_salida || '');
                                    const newHabitaciones = [...editForm.habitaciones_adicionales];
                                    newHabitaciones[index].hora_salida = buildTime24h(parsed.hour, parsed.minute, e.target.value);
                                    setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                                  }}
                                  className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-medium"
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fila 5: Tarifa */}
                        <div className="mt-3">
                          <Label>
                            {habitacion.check_in && habitacion.check_in === habitacion.check_out
                              ? 'Tarifa DAY USE (S/.)'
                              : 'Tarifa (S/.)'}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={habitacion.tarifa || ''}
                            onChange={(e) => {
                              const newHabitaciones = [...editForm.habitaciones_adicionales];
                              newHabitaciones[index].tarifa = e.target.value;
                              setEditForm({ ...editForm, habitaciones_adicionales: newHabitaciones });
                            }}
                            placeholder="Ingrese la tarifa"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end mt-6">
            <Button
              size="sm"
              variant="outline"
              onClick={closeEditModal}
              disabled={editingHuespedLoading}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateHuesped}
              disabled={editingHuespedLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {editingHuespedLoading ? "Actualizando..." : "Actualizar Pasajero"}
            </Button>
          </div>
        </div>
      </Modal >

      {/* Modal de Visualización */}
      < Modal isOpen={isViewModalOpen} onClose={closeViewModal} className="max-w-[700px] m-4" >
        <div className="no-scrollbar relative w-full max-w-[700px] max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-black dark:border dark:border-orange-500/30 p-6 lg:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Detalles del Pasajero
            </h3>
          </div>

          {viewingHuesped && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Información de Venta
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Canal de Venta:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{viewingHuesped.canal_venta || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tipo de Comprobante:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{viewingHuesped.tipo_comprobante || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {viewingHuesped.tipo_comprobante === 'FACTURA' ? 'N° de Factura:' : 'N° de Boleta:'}
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {viewingHuesped.tipo_comprobante === 'FACTURA'
                        ? (viewingHuesped.numero_factura || '-')
                        : (viewingHuesped.numero_boleta || '-')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Información Personal
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Nombres y Apellidos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.nombres_apellidos || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tipo de Documento:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.tipo_documento || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Número de Documento:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.numero_documento || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">RUC:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.numero_ruc || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Razón Social:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.nombre_o_razon_social || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Estado RUC:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.estado || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Condición RUC:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.condicion || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dirección:</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">{viewingHuesped.direccion_completa || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Fecha de Nacimiento:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDateLocal(viewingHuesped.fecha_nacimiento) || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Nacionalidad:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.nacionalidad || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Procedencia:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.procedencia || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Celular:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.celular || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Información de Hospedaje
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDateLocal(viewingHuesped.check_in) || '-'}
                      {viewingHuesped.hora_entrada && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          {formatTimeAMPM(viewingHuesped.hora_entrada)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Hora de Entrada:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {viewingHuesped.hora_entrada ? formatTimeAMPM(viewingHuesped.hora_entrada) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                    <span className={viewingHuesped.check_out ? "font-medium text-gray-900 dark:text-white" : "font-medium text-amber-600 dark:text-amber-400"}>
                      {formatDateLocal(viewingHuesped.check_out) || 'Por confirmar'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Hora de Salida:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {viewingHuesped.hora_salida ? formatTimeAMPM(viewingHuesped.hora_salida) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duración:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {viewingHuesped.duracion_estadia != null ? `${viewingHuesped.duracion_estadia} ${viewingHuesped.is_day_use ? 'día' : 'noches'}` : '-'}
                      </span>
                      {viewingHuesped.is_day_use && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          DAY USE
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tipo de Habitación:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.tipo_habitacion || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Número de Habitación:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.numero_habitacion || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tarifa por Noche:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {viewingHuesped.tarifa_noche && !isNaN(parseFloat(viewingHuesped.tarifa_noche))
                        ? `S/. ${parseFloat(viewingHuesped.tarifa_noche).toFixed(2)}`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Adultos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.adultos ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Niños:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.ninos ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Método de Pago:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.metodo_pago || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tipo de Desayuno:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {viewingHuesped.tipo_desayuno === 'CONTINENTAL' ? 'Desayuno Continental' :
                        viewingHuesped.tipo_desayuno === 'AMERICANO' ? 'Desayuno Americano' :
                          viewingHuesped.tipo_desayuno === 'NINGUNO' ? 'Ninguno' : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Estadía:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {viewingHuesped.total_estadia && !isNaN(parseFloat(viewingHuesped.total_estadia))
                        ? `S/. ${parseFloat(viewingHuesped.total_estadia).toFixed(2)}`
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Observación:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">{viewingHuesped.observacion || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Acompañantes (Vista) */}
              {viewingHuesped.acompanantes && viewingHuesped.acompanantes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Acompañantes ({viewingHuesped.acompanantes.length})
                  </h4>
                  <div className="space-y-3">
                    {viewingHuesped.acompanantes.map((acompanante, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                      >
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                          Acompañante #{index + 1}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Documento:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {acompanante.tipo_documento}: {acompanante.numero_documento || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Nacionalidad:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {acompanante.nacionalidad || 'N/A'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">Nombre:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {acompanante.nombres_apellidos || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Nacimiento:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {formatDateLocal(acompanante.fecha_nacimiento) || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Procedencia:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {acompanante.procedencia || 'N/A'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">Tipo de Desayuno:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {acompanante.tipo_desayuno || 'NINGUNO'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Habitaciones Adicionales (Vista) */}
              {viewingHuesped.habitaciones_adicionales && viewingHuesped.habitaciones_adicionales.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Habitaciones Adicionales ({viewingHuesped.habitaciones_adicionales.length})
                  </h4>
                  <div className="space-y-3">
                    {viewingHuesped.habitaciones_adicionales.map((habitacion, index) => (
                      <div
                        key={index}
                        className="p-3 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                      >
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                          Habitación Adicional #{index + 1}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Habitación:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {habitacion.numero_habitacion} - {habitacion.tipo_habitacion}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Tarifa:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {habitacion.tarifa ? `S/. ${parseFloat(habitacion.tarifa).toFixed(2)}` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Documento:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {habitacion.tipo_documento}: {habitacion.numero_documento || 'N/A'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">Ocupante:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {habitacion.nombres_apellidos || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Check-in:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {formatDateLocal(habitacion.check_in) || 'N/A'}
                              {habitacion.hora_entrada && (
                                <span className="ml-1 text-blue-600 dark:text-blue-400">
                                  {formatTimeAMPM(habitacion.hora_entrada)}
                                </span>
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Check-out:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {formatDateLocal(habitacion.check_out) || 'Por confirmar'}
                              {habitacion.hora_salida && (
                                <span className="ml-1 text-blue-600 dark:text-blue-400">
                                  {formatTimeAMPM(habitacion.hora_salida)}
                                </span>
                              )}
                            </span>
                          </div>
                          {habitacion.is_day_use && (
                            <div className="col-span-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                DAY USE
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              size="sm"
              onClick={closeViewModal}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal >

      {/* Modal de Eliminación */}
      < Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} className="max-w-md m-4" >
        <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-black dark:border dark:border-orange-500/30 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Eliminar Pasajero
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              ¿Está seguro que desea eliminar este pasajero? Esta acción no se puede deshacer.
            </p>
          </div>

          {huespedToDelete && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-900/50 dark:border-gray-800">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{huespedToDelete.nombres_apellidos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Documento:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{huespedToDelete.numero_documento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Habitación:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{huespedToDelete.numero_habitacion}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deletingHuesped}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => huespedToDelete && handleDeleteHuesped(huespedToDelete.id)}
              disabled={deletingHuesped}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingHuesped ? "Eliminando..." : "Eliminar Pasajero"}
            </Button>
          </div>
        </div>
      </Modal >

      {/* Tabla */}
      < div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3" >
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Huésped
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Documento
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Comprobante
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Canal de Venta
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                RUC
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Check-in
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Check-out
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Habitación
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Desayuno
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Tarifa
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Total
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Acciones
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {loadingHuespedes && data.length === 0 ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="h-4 w-16 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mx-auto"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg dark:bg-gray-700 animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-lg dark:bg-gray-700 animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-lg dark:bg-gray-700 animate-pulse"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((huesped) => (
                <TableRow key={huesped.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex flex-col relative">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {huesped.nombres_apellidos || '-'}
                        </span>
                        {huesped.acompanantes && huesped.acompanantes.length > 0 && (
                          <button
                            id={`badge-acomp-${huesped.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (acompanantesPopover === huesped.id) {
                                setAcompanantesPopover(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPopoverPosition({ top: rect.bottom + 8, left: rect.left });
                                setAcompanantesPopover(huesped.id);
                                setHabitacionesPopover(null);
                              }
                            }}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-800/40 cursor-pointer transition-colors"
                            title="Clic para ver acompañantes"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            +{huesped.acompanantes.length}
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {huesped.nacionalidad || '-'}
                      </span>

                      {/* Popover de acompañantes */}
                      {acompanantesPopover === huesped.id && huesped.acompanantes && huesped.acompanantes.length > 0 && (
                        <div
                          id={`popover-acomp-${huesped.id}`}
                          className="fixed z-[9999] w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3"
                          style={{ top: popoverPosition.top, left: popoverPosition.left }}
                        >
                          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              Acompañantes
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAcompanantesPopover(null);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <CloseIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {huesped.acompanantes.map((acomp, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {acomp.nombres_apellidos || 'Sin nombre'}
                                </span>
                                {acomp.numero_documento && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                    {acomp.tipo_documento}: {acomp.numero_documento}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {huesped.tipo_documento && huesped.numero_documento
                      ? `${huesped.tipo_documento}: ${huesped.numero_documento}`
                      : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {huesped.tipo_comprobante || '-'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {huesped.tipo_comprobante === 'FACTURA'
                          ? (huesped.numero_factura || '-')
                          : (huesped.numero_boleta || '-')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {huesped.canal_venta || '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {huesped.numero_ruc || '-'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {huesped.nombre_o_razon_social || ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <span>{formatDateLocal(huesped.check_in) || '-'}</span>
                      {huesped.hora_entrada && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {formatTimeAMPM(huesped.hora_entrada)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center text-theme-sm">
                    <div className="flex flex-col items-center gap-1">
                      <span className={huesped.check_out ? "text-gray-500 dark:text-gray-400" : "text-amber-600 dark:text-amber-400 font-medium"}>
                        {formatDateLocal(huesped.check_out) || 'Por confirmar'}
                      </span>
                      {huesped.hora_salida && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {formatTimeAMPM(huesped.hora_salida)}
                        </span>
                      )}
                      {huesped.is_day_use && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          DAY USE
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="relative">
                      <div className="flex items-center justify-center gap-1">
                        <span className="block font-medium text-gray-900 dark:text-white">
                          {huesped.numero_habitacion || '-'}
                        </span>
                        {huesped.habitaciones_adicionales && huesped.habitaciones_adicionales.length > 0 && (
                          <button
                            id={`badge-hab-${huesped.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (habitacionesPopover === huesped.id) {
                                setHabitacionesPopover(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPopoverPosition({ top: rect.bottom + 8, left: rect.left - 60 });
                                setHabitacionesPopover(huesped.id);
                                setAcompanantesPopover(null);
                              }
                            }}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/50 cursor-pointer transition-colors"
                            title="Clic para ver habitaciones adicionales"
                          >
                            +{huesped.habitaciones_adicionales.length}
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {huesped.tipo_habitacion || '-'}
                      </span>

                      {/* Popover de habitaciones adicionales */}
                      {habitacionesPopover === huesped.id && huesped.habitaciones_adicionales && huesped.habitaciones_adicionales.length > 0 && (
                        <div
                          id={`popover-hab-${huesped.id}`}
                          className="fixed z-[9999] w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3"
                          style={{ top: popoverPosition.top, left: popoverPosition.left }}
                        >
                          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              Habitaciones Extras
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setHabitacionesPopover(null);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <CloseIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            {huesped.habitaciones_adicionales.map((hab, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  Hab. {hab.numero_habitacion}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {hab.tipo_habitacion}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                    {huesped.tipo_desayuno === 'CONTINENTAL' ? 'Continental' :
                      huesped.tipo_desayuno === 'AMERICANO' ? 'Americano' :
                        huesped.tipo_desayuno === 'NINGUNO' ? 'Ninguno' :
                          !huesped.tipo_desayuno ? '-' : huesped.tipo_desayuno}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {huesped.tarifa_noche && !isNaN(parseFloat(huesped.tarifa_noche))
                          ? `S/. ${parseFloat(huesped.tarifa_noche).toFixed(2)}`
                          : '-'}
                      </span>
                      {huesped.is_day_use && (
                        <span className="text-[10px] text-gray-400 font-medium">DAY USE</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {huesped.total_estadia && !isNaN(parseFloat(huesped.total_estadia))
                        ? `S/. ${parseFloat(huesped.total_estadia).toFixed(2)}`
                        : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewHuesped(huesped)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => handleEditHuespedClick(huesped)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                        title="Editar pasajero"
                      >
                        <PencilIcon className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(huesped)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar pasajero"
                      >
                        <TrashBinIcon className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron pasajeros
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      </div >

      {/* Paginación */}
      {
        totalPages > 1 && (
          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 order-1 lg:order-1">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} pasajeros
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

              {(() => {
                const maxVisible = 5;
                const pages = [];

                if (totalPages <= maxVisible) {
                  // Si hay pocas páginas, mostrar todas
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Siempre mostrar primera página
                  pages.push(1);

                  if (currentPage <= 3) {
                    // Si estamos al inicio: 1, 2, 3, ..., última
                    pages.push(2, 3);
                    pages.push('...');
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    // Si estamos al final: 1, ..., ante-penúltima, penúltima, última
                    pages.push('...');
                    pages.push(totalPages - 2, totalPages - 1, totalPages);
                  } else {
                    // En el medio: 1, ..., actual-1, actual, actual+1, ..., última
                    pages.push('...');
                    pages.push(currentPage - 1, currentPage, currentPage + 1);
                    pages.push('...');
                    pages.push(totalPages);
                  }
                }

                return pages.map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-500 dark:text-gray-400 flex items-center">
                      ...
                    </span>
                  ) : (
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
                  )
                ));
              })()}

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
        )
      }
    </div >
  );
}

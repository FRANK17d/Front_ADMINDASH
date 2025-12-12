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
import { PencilIcon, TrashBinIcon, PlusIcon, ChevronLeftIcon, AngleRightIcon, EyeIcon } from "../../../icons";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../ui/modal";
import Label from "../../form/Label";
import { getHuespedes, createHuesped, updateHuesped, deleteHuesped, lookupDocumento } from "../../../api/huespedes";
import { toast } from 'react-toastify';

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
  const [lookupLoading, setLookupLoading] = useState(false);
  
  const [createForm, setCreateForm] = useState({
    canal_venta: "RECEPCION",
    tipo_comprobante: "BOLETA",
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
    check_in: "",
    check_out: "",
    tipo_habitacion: "SIMPLE",
    numero_habitacion: "111",
    tarifa_noche: "",
    adultos: 1,
    ninos: 0,
    metodo_pago: "EFECTIVO",
    observacion: "",
  });

  const [editForm, setEditForm] = useState({});
  
  const itemsPerPage = 5;

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

  const refresh = async () => {
    try {
      setLoadingHuespedes(true);
      setError("");
      const res = await getHuespedes();
      if (res.success) {
        setData(res.data || []);
      }
    } catch (e) {
      setError("No se pudo cargar huéspedes");
      setData([]);
    } finally {
      setLoadingHuespedes(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Filtrar datos basado en la búsqueda
  const filteredData = useMemo(() => {
    return data.filter(huesped =>
      huesped.nombres_apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      huesped.numero_documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (huesped.numero_ruc && huesped.numero_ruc.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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

      const res = await createHuesped(createForm);
      
      if (res.success) {
        toast.success(`Huésped "${createForm.nombres_apellidos}" registrado exitosamente`, {
          position: "bottom-right",
          autoClose: 3000,
        });

        closeCreateModal();
        setCreateForm({
          canal_venta: "RECEPCION",
          tipo_comprobante: "BOLETA",
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
          check_in: "",
          check_out: "",
          tipo_habitacion: "SIMPLE",
          numero_habitacion: "111",
          tarifa_noche: "",
          adultos: 1,
          ninos: 0,
          metodo_pago: "EFECTIVO",
          observacion: "",
        });
        await refresh();
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e.response?.data?.errors || e.message || "No se pudo crear el huésped";
      setError(errorMessage);
      toast.error(errorMessage, {
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
      canal_venta: huesped.canal_venta,
      tipo_comprobante: huesped.tipo_comprobante,
      nombres_apellidos: huesped.nombres_apellidos,
      tipo_documento: huesped.tipo_documento,
      numero_documento: huesped.numero_documento,
      numero_ruc: huesped.numero_ruc || "",
      nombre_o_razon_social: huesped.nombre_o_razon_social || "",
      estado: huesped.estado || "",
      condicion: huesped.condicion || "",
      direccion_completa: huesped.direccion_completa || "",
      fecha_nacimiento: huesped.fecha_nacimiento,
      nacionalidad: huesped.nacionalidad,
      procedencia: huesped.procedencia,
      check_in: huesped.check_in,
      check_out: huesped.check_out,
      tipo_habitacion: huesped.tipo_habitacion,
      numero_habitacion: huesped.numero_habitacion,
      tarifa_noche: huesped.tarifa_noche,
      adultos: huesped.adultos,
      ninos: huesped.ninos,
      metodo_pago: huesped.metodo_pago,
      observacion: huesped.observacion || "",
    });
    openEditModal();
  };

  const handleUpdateHuesped = async () => {
    try {
      setError("");
      setEditingHuespedLoading(true);

      const res = await createHuesped(editForm);

      if (res.success) {
        toast.success(`Huésped "${editForm.nombres_apellidos}" registrado como versión actualizada`, {
          position: "bottom-right",
          autoClose: 3000,
        });

        closeEditModal();
        setEditingHuesped(null);
        await refresh();
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e.response?.data?.errors || e.message || "No se pudo crear el registro actualizado";
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
    <div className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="numero_documento">Número de Documento *</Label>
                    <Input
                      id="numero_documento"
                      value={createForm.numero_documento}
                      onChange={(e) => setCreateForm({ ...createForm, numero_documento: e.target.value })}
                      onBlur={handleLookupDocumentoCreate}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nombres_apellidos">Nombres y Apellidos Completos *</Label>
                  <Input
                    id="nombres_apellidos"
                    value={createForm.nombres_apellidos}
                    onChange={(e) => setCreateForm({ ...createForm, nombres_apellidos: e.target.value })}
                    required
                  />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      value={createForm.fecha_nacimiento}
                      onChange={(e) => setCreateForm({ ...createForm, fecha_nacimiento: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nacionalidad">Nacionalidad *</Label>
                    <Input
                      id="nacionalidad"
                      value={createForm.nacionalidad}
                      onChange={(e) => setCreateForm({ ...createForm, nacionalidad: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="procedencia">Procedencia *</Label>
                    <Input
                      id="procedencia"
                      value={createForm.procedencia}
                      onChange={(e) => setCreateForm({ ...createForm, procedencia: e.target.value })}
                      required
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
                  <Label htmlFor="check_in">Check-in *</Label>
                  <Input
                    id="check_in"
                    type="date"
                    value={createForm.check_in}
                    onChange={(e) => setCreateForm({ ...createForm, check_in: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="check_out">Check-out *</Label>
                  <Input
                    id="check_out"
                    type="date"
                    value={createForm.check_out}
                    onChange={(e) => setCreateForm({ ...createForm, check_out: e.target.value })}
                    required
                  />
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
                    {['111','112','113','210','211','212','213','214','215','310','311','312','313','314','315'].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tarifa_noche">Tarifa por Noche (S/.) *</Label>
                  <Input
                    id="tarifa_noche"
                    type="number"
                    step="0.01"
                    value={createForm.tarifa_noche}
                    onChange={(e) => setCreateForm({ ...createForm, tarifa_noche: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="adultos">Adultos *</Label>
                  <Input
                    id="adultos"
                    type="number"
                    min="1"
                    value={createForm.adultos}
                    onChange={(e) => setCreateForm({ ...createForm, adultos: parseInt(e.target.value) || 1 })}
                    required
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
                    <option value="TARJETA">Tarjeta Débito/Crédito</option>
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
            </div>
          </div>

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
        </div>
      </Modal>

      {/* Modal de Edición */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} className="max-w-[800px] m-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Información Personal */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Información Personal
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="edit_nombres_apellidos">Nombres y Apellidos Completos</Label>
                    <Input
                      id="edit_nombres_apellidos"
                      value={editForm.nombres_apellidos}
                      onChange={(e) => setEditForm({ ...editForm, nombres_apellidos: e.target.value })}
                    />
                  </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_fecha_nacimiento">Fecha de Nacimiento</Label>
                      <Input
                        id="edit_fecha_nacimiento"
                        type="date"
                        value={editForm.fecha_nacimiento}
                        onChange={(e) => setEditForm({ ...editForm, fecha_nacimiento: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Input
                      id="edit_check_in"
                      type="date"
                      value={editForm.check_in}
                      onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_check_out">Check-out</Label>
                    <Input
                      id="edit_check_out"
                      type="date"
                      value={editForm.check_out}
                      onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })}
                    />
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
                      {['111','112','113','210','211','212','213','214','215','310','311','312','313','314','315'].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit_tarifa_noche">Tarifa por Noche (S/.)</Label>
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
                      <option value="TARJETA">Tarjeta Débito/Crédito</option>
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
      </Modal>

      {/* Modal de Visualización */}
      <Modal isOpen={isViewModalOpen} onClose={closeViewModal} className="max-w-[700px] m-4">
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
                    <p className="font-medium text-gray-900 dark:text-white">{viewingHuesped.canal_venta}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tipo de Comprobante:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{viewingHuesped.tipo_comprobante}</p>
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
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.nombres_apellidos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tipo de Documento:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.tipo_documento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Número de Documento:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.numero_documento}</span>
                  </div>
                  {viewingHuesped.numero_ruc && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">RUC:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.numero_ruc}</span>
                    </div>
                  )}
                  {viewingHuesped.nombre_o_razon_social && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Razón Social:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.nombre_o_razon_social}</span>
                    </div>
                  )}
                  {viewingHuesped.estado && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Estado RUC:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.estado}</span>
                    </div>
                  )}
                  {viewingHuesped.condicion && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Condición RUC:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.condicion}</span>
                    </div>
                  )}
                  {viewingHuesped.direccion_completa && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Dirección:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.direccion_completa}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Fecha de Nacimiento:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(viewingHuesped.fecha_nacimiento).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Nacionalidad:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.nacionalidad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Procedencia:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.procedencia}</span>
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
                      {new Date(viewingHuesped.check_in).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(viewingHuesped.check_out).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duración:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.duracion_estadia} noches</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tipo de Habitación:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.tipo_habitacion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Número de Habitación:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.numero_habitacion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tarifa por Noche:</span>
                    <span className="font-medium text-gray-900 dark:text-white">S/. {parseFloat(viewingHuesped.tarifa_noche).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Adultos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.adultos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Niños:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.ninos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Método de Pago:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{viewingHuesped.metodo_pago}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Estadía:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">S/. {parseFloat(viewingHuesped.total_estadia).toFixed(2)}</span>
                  </div>
                  {viewingHuesped.observacion && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Observación:</span>
                      <p className="font-medium text-gray-900 dark:text-white mt-1">{viewingHuesped.observacion}</p>
                    </div>
                  )}
                </div>
              </div>
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
      </Modal>

      {/* Modal de Eliminación */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} className="max-w-md m-4">
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
      </Modal>

      {/* Tabla */}
      <div className="overflow-auto rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
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
                  Tarifa Noche
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
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {huesped.nombres_apellidos}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {huesped.nacionalidad}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {huesped.tipo_documento}: {huesped.numero_documento}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                        {huesped.canal_venta}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {huesped.numero_ruc || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {huesped.nombre_o_razon_social || ''}
                        </span>
                        </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      {new Date(huesped.check_in).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      {new Date(huesped.check_out).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div>
                        <span className="block font-medium text-gray-900 dark:text-white">
                          {huesped.numero_habitacion}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {huesped.tipo_habitacion}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        S/. {parseFloat(huesped.tarifa_noche).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        S/. {parseFloat(huesped.total_estadia).toFixed(2)}
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
                  <TableCell colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron pasajeros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
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

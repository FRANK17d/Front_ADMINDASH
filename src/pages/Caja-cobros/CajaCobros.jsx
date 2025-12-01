import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { PlusIcon } from "../../icons";
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
import { listTodayTransactions, todayTotals, createPayment, emitReceipt, todayClients, paidClients, paidClientsDetails } from "../../api/caja";
import { toast } from 'react-toastify';

const CajaCobros = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;
  const { isOpen: isReceiptOpen, openModal: openReceiptModal, closeModal: closeReceiptModal } = useModal();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [receiptForm, setReceiptForm] = useState({ numero: "", fecha: "", senores: "", direccion: "", dni: "", concepto: "", importe: "", total: "", son: "", canceladoFecha: "" });
  const { isOpen: isCreateOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useModal();
  const { isOpen: isArqueOpen, openModal: openArqueModal, closeModal: closeArqueModal } = useModal();
  const [newPayment, setNewPayment] = useState({ type: "Pago de Reserva", guest: "", method: "Efectivo", amount: "", reservationCode: "" });
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [createError, setCreateError] = useState("");
  const [totals, setTotals] = useState({ methods: { Yape: 0, Efectivo: 0, Tarjeta: 0, Transferencia: 0 }, total: 0 });
  const [clientsSummary, setClientsSummary] = useState({ clients: [], total: 0 });
  const [clientsList, setClientsList] = useState([]);
  const [arqueDate, setArqueDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingArque, setLoadingArque] = useState(false);
  const [transactionsDate, setTransactionsDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const loadTransactions = async (date) => {
    if (!date) return;
    setLoadingTransactions(true);
    try {
      const tx = await listTodayTransactions(date);
      setTransactions(Array.isArray(tx) ? tx : []);
      setCurrentPage(1);
      const t = await todayTotals(date);
      setTotals(t || { methods: { Yape: 0, Efectivo: 0, Tarjeta: 0, Transferencia: 0 }, total: 0 });
    } catch (e) {
      console.error('Error cargando transacciones:', e);
      setTransactions([]);
      setTotals({ methods: { Yape: 0, Efectivo: 0, Tarjeta: 0, Transferencia: 0 }, total: 0 });
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    document.title = "Caja y Cobros - Hotel Plaza Trujillo";
  }, []);

  useEffect(() => {
    if (transactionsDate) {
      loadTransactions(transactionsDate);
    }
  }, [transactionsDate]);

  useEffect(() => {
    const pages = Math.ceil((transactions || []).length / PAGE_SIZE) || 1;
    if (currentPage > pages) {
      setCurrentPage(pages);
    }
  }, [transactions]);

  // Tarjetas de totales
  const totalCards = [
    {
      id: 1,
      title: "Total Yape",
      amount: Number(totals.methods?.Yape || 0),
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      id: 2,
      title: "Total Efectivo",
      amount: Number(totals.methods?.Efectivo || 0),
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: 3,
      title: "Total Tarjeta",
      amount: Number(totals.methods?.Tarjeta || 0),
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      id: 4,
      title: "Total del Día",
      amount: Number(totals.total || 0),
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  const getMethodBadgeColor = (method) => {
    switch (method) {
      case "Yape":
        return "green";
      case "Efectivo":
        return "info";
      case "Tarjeta":
        return "purple";
      default:
        return "light";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  const amountToWordsEs = (val) => {
    const numAbs = Math.abs(Number(val) || 0);
    const num = Math.floor(numAbs);
    const dec = Math.round((numAbs - num) * 100) % 100;
    const u = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teen = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const d = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const c = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    const veinti = (n) => (n === 0 ? 'veinte' : 'veinti' + u[n]);
    const two = (n) => {
      if (n < 10) return u[n];
      if (n < 20) return teen[n - 10];
      if (n < 30) return veinti(n - 20);
      const de = Math.floor(n / 10);
      const un = n % 10;
      return un ? d[de] + ' y ' + u[un] : d[de];
    };
    const three = (n) => {
      if (n === 0) return '';
      if (n === 100) return 'cien';
      const ce = Math.floor(n / 100);
      const rest = n % 100;
      return [c[ce], two(rest)].filter(Boolean).join(' ').trim();
    };
    const numberToWords = (n) => {
      if (n === 0) return 'cero';
      const millones = Math.floor(n / 1000000);
      const miles = Math.floor((n % 1000000) / 1000);
      const rest = n % 1000;
      const parts = [];
      if (millones) parts.push(millones === 1 ? 'un millón' : numberToWords(millones) + ' millones');
      if (miles) parts.push(miles === 1 ? 'mil' : three(miles) + ' mil');
      if (rest) parts.push(three(rest));
      return parts.join(' ').trim();
    };
    const words = numberToWords(num).replace(/\s+/g, ' ').trim();
    const decTxt = String(dec).padStart(2, '0');
    const final = `${words} con ${decTxt}/100 soles`;
    return final.charAt(0).toUpperCase() + final.slice(1);
  };

  const handleRegistrarCobro = () => {
    openCreateModal();
  };

  const handleArqueCaja = async () => {
    setArqueDate(new Date().toISOString().split('T')[0]);
    openArqueModal();
    await loadArqueTotals(new Date().toISOString().split('T')[0]);
  };

  const loadArqueTotals = async (date) => {
    setLoadingArque(true);
    try {
      const t = await todayTotals(date);
      setTotals(t || { methods: { Yape: 0, Efectivo: 0, Tarjeta: 0, Transferencia: 0 }, total: 0 });
    } catch (e) {
      setTotals({ methods: { Yape: 0, Efectivo: 0, Tarjeta: 0, Transferencia: 0 }, total: 0 });
    } finally {
      setLoadingArque(false);
    }
  };

  const handleArqueDateChange = async (e) => {
    const newDate = e.target.value;
    setArqueDate(newDate);
    await loadArqueTotals(newDate);
  };

  const handleEmitReceipt = async (transaction) => {
    setSelectedTransaction(transaction);
    let dni = "";
    let direccion = "";
    try {
      const details = await paidClientsDetails();
      const found = (details.clients || []).find((c) => c.guest === transaction.guest);
      if (found) {
        dni = found.dni || "";
        direccion = found.direccion || "";
      }
    } catch (e) {}
    setReceiptForm({
      numero: String(962 + transaction.id).padStart(5, "0"),
      fecha: new Date().toISOString().slice(0, 10),
      senores: transaction.guest,
      direccion,
      dni,
      concepto: transaction.type,
      importe: transaction.amount,
      total: transaction.amount,
      son: "",
      canceladoFecha: new Date().toISOString().slice(0, 10),
    });
    openReceiptModal();
  };

  const handleReceiptChange = (e) => {
    const { name, value } = e.target;
    setReceiptForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatePaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPayment = async () => {
    setCreateError("");
    // Validaciones básicas en cliente
    const amt = Number(newPayment.amount);
    if (!newPayment.guest) {
      setCreateError("Seleccione cliente");
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setCreateError("Ingrese un monto válido (> 0)");
      return;
    }
    setCreatingPayment(true);
    try {
      await createPayment({
        type: newPayment.type,
        guest: newPayment.guest,
        method: newPayment.method,
        amount: amt,
        reservationCode: newPayment.reservationCode || null,
      });
      await loadTransactions(transactionsDate);
      
      // Obtener el nombre del cliente para el toast
      const guestName = newPayment.guest || "Cliente";
      const methodName = newPayment.method || "Efectivo";
      
      // Mostrar toast de éxito
      toast.success(`Cobro de ${formatCurrency(amt)} registrado exitosamente (${methodName})`, {
        position: "bottom-right",
        autoClose: 3000,
      });
      
      closeCreateModal();
      setNewPayment({ type: "Pago de Reserva", guest: "", method: "Efectivo", amount: "", reservationCode: "" });
    } catch (e) {
      const msg = (e && e.response && e.response.data && (e.response.data.error || e.response.data.detail)) || "Error creando pago";
      setCreateError(String(msg));
      
      // Mostrar toast de error
      toast.error(msg, {
        position: "bottom-right",
        autoClose: 4000,
      });
    } finally {
      setCreatingPayment(false);
    }
  };

  useEffect(() => {
    if (isCreateOpen) {
      (async () => {
        try {
          const cs = await todayClients();
          setClientsSummary(cs);
          const all = await paidClients();
          setClientsList(all.clients || []);
        } catch (e) {
          setClientsSummary({ clients: [], total: 0 });
          setClientsList([]);
        }
      })();
    }
  }, [isCreateOpen]);

  const handlePrintReceipt = async () => {
    try {
      if (!selectedTransaction) return;
      await emitReceipt({
        paymentId: selectedTransaction.id,
        numero: receiptForm.numero,
        fecha: receiptForm.fecha,
        senores: receiptForm.senores,
        direccion: receiptForm.direccion,
        dni: receiptForm.dni,
        concepto: receiptForm.concepto,
        importe: Number(receiptForm.importe || 0),
        total: Number(receiptForm.total || 0),
        son: receiptForm.son,
        canceladoFecha: receiptForm.canceladoFecha,
      });
    } catch (e) {}
    const toDataUrl = async () => {
      try {
        const res = await fetch('/Logo_Hotel.png');
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

    const doc = new jsPDF('p', 'mm', 'a4');
    const logoUrl = await toDataUrl();
    if (logoUrl) {
      try { doc.addImage(logoUrl, 'PNG', 15, 12, 24, 16); } catch (e) {}
    }
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(16);
    doc.text('Hotel Plaza Trujillo', 45, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Recibo N° ${receiptForm.numero}`, 45, 26);
    doc.text(`Fecha ${receiptForm.fecha}`, 195, 26, { align: 'right' });
    doc.setDrawColor(229, 231, 235);
    doc.line(15, 32, 195, 32);

    let y = 40;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(11);
    doc.text(`Señor(es): ${receiptForm.senores}`, 15, y);
    y += 8;
    doc.text(`DNI: ${receiptForm.dni || ''}`, 15, y);
    y += 8;
    doc.text(`Dirección: ${receiptForm.direccion || ''}`, 15, y);
    y += 12;
    doc.text(`Concepto: ${receiptForm.concepto}`, 15, y);
    y += 8;
    doc.text(`Importe: S/ ${Number(receiptForm.importe || 0).toFixed(2)}`, 15, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Total: S/ ${Number(receiptForm.total || 0).toFixed(2)}`, 15, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Son: ${receiptForm.son || ''}`, 15, y);
    y += 8;
    doc.text(`Cancelado: ${receiptForm.canceladoFecha || ''}`, 15, y);

    doc.setDrawColor(229, 231, 235);
    doc.line(15, 270, 195, 270);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('Gracias por su preferencia', 105, 276, { align: 'center' });

    doc.save(`recibo_${receiptForm.numero}.pdf`);
  };

  useEffect(() => {
    const amount = Number(receiptForm.total || receiptForm.importe || 0);
    const text = amountToWordsEs(amount);
    if (text && text !== receiptForm.son) {
      setReceiptForm((prev) => ({ ...prev, son: text }));
    }
  }, [receiptForm.total, receiptForm.importe]);

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Caja y Cobros
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Administra los cobros y transacciones del día
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleArqueCaja}
            variant="outline"
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Arque de Caja
          </Button>
          <Button
            onClick={handleRegistrarCobro}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5 fill-current" />
            Registrar Cobro
          </Button>
        </div>
      </div>

      {/* Tarjetas de totales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {totalCards.map((card) => (
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
                  {formatCurrency(card.amount)}
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de transacciones del día */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                {transactionsDate === new Date().toISOString().split('T')[0] 
                  ? 'Transacciones de Hoy' 
                  : (() => {
                      const [year, month, day] = transactionsDate.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return `Transacciones del ${date.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
                    })()}
              </h3>
              <p className="text-gray-500 text-theme-sm dark:text-gray-400">
                {transactionsDate === new Date().toISOString().split('T')[0]
                  ? 'Lista de todas las transacciones realizadas el día de hoy'
                  : 'Lista de todas las transacciones realizadas en la fecha seleccionada'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-400 whitespace-nowrap">
                Seleccionar fecha:
              </label>
              <input
                type="date"
                value={transactionsDate}
                onChange={(e) => setTransactionsDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
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
                      Cliente
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Método de Pago
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Monto
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                    >
                      Hora
                    </TableCell>
                    <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Estado</TableCell>
                    <TableCell isHeader className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loadingTransactions ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 px-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                          <p className="text-gray-500 dark:text-gray-400">Cargando transacciones...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 px-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {transactionsDate === new Date().toISOString().split('T')[0]
                              ? 'No hay transacciones registradas hoy'
                              : `No hay transacciones registradas el ${(() => {
                                  const [year, month, day] = transactionsDate.split('-').map(Number);
                                  const date = new Date(year, month - 1, day);
                                  return date.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                                })()}`}
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Selecciona otra fecha para ver más transacciones
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (transactions.slice((currentPage - 1) * PAGE_SIZE, (currentPage) * PAGE_SIZE)).map((transaction) => (
                      <TableRow key={transaction.id}>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {transaction.type}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90 hidden md:table-cell">
                        <div className="truncate max-w-[120px] sm:max-w-none">
                          {transaction.guest}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4">
                        <Badge size="sm" color={getMethodBadgeColor(transaction.method)}>
                          {transaction.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden lg:table-cell">
                        {transaction.time}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4">
                        <Badge size="sm" color="success">{transaction.status}</Badge>
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-center">
                        <Button size="sm" onClick={() => handleEmitReceipt(transaction)} className="bg-orange-500 hover:bg-orange-600 text-white">Emitir Recibo</Button>
                      </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {Math.ceil((transactions || []).length / PAGE_SIZE) > 1 && (
              <div className="flex items-center justify-between px-2 py-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Página {currentPage} de {Math.ceil((transactions || []).length / PAGE_SIZE)}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Anterior</Button>
                  <Button size="sm" variant="outline" disabled={currentPage >= Math.ceil((transactions || []).length / PAGE_SIZE)} onClick={() => setCurrentPage((p) => Math.min(Math.ceil((transactions || []).length / PAGE_SIZE), p + 1))}>Siguiente</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal isOpen={isReceiptOpen} onClose={closeReceiptModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto overflow-x-hidden max-h-[85vh] rounded-3xl bg-white p-4 dark:bg-black lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Recibo de Caja</h4>
          </div>
          <div className="px-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">N°</label>
                <input name="numero" value={receiptForm.numero} onChange={handleReceiptChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Fecha</label>
                <input name="fecha" value={receiptForm.fecha} onChange={handleReceiptChange} type="date" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Señor(es)</label>
                <input name="senores" value={receiptForm.senores} onChange={handleReceiptChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">D.N.I.</label>
                <input name="dni" value={receiptForm.dni} onChange={handleReceiptChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Dirección</label>
                <input name="direccion" value={receiptForm.direccion} onChange={handleReceiptChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Importe</label>
                <input name="importe" value={receiptForm.importe} onChange={handleReceiptChange} type="number" step="0.01" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Por concepto de</label>
              <textarea name="concepto" value={receiptForm.concepto} onChange={handleReceiptChange} className="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Son</label>
                <input name="son" value={receiptForm.son} onChange={handleReceiptChange} type="text" placeholder="Monto en letras" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Total S/.</label>
                <input name="total" value={receiptForm.total} onChange={handleReceiptChange} type="number" step="0.01" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Cancelado (Fecha)</label>
              <input name="canceladoFecha" value={receiptForm.canceladoFecha} onChange={handleReceiptChange} type="date" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeReceiptModal}>Cerrar</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={handlePrintReceipt}>Imprimir</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={closeCreateModal} className="max-w-[900px] m-4">
        <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-black lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Registrar Cobro</h4>
          </div>
          <div className="px-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Tipo</label>
                <select name="type" value={newPayment.type} onChange={handleCreatePaymentChange} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                  <option>Pago de Reserva</option>
                  <option>Servicio Adicional</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Método</label>
                <select name="method" value={newPayment.method} onChange={handleCreatePaymentChange} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                  <option>Efectivo</option>
                  <option>Tarjeta</option>
                  <option>Yape</option>
                  <option>Transferencia</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Cliente</label>
                <select name="guest" value={newPayment.guest} onChange={(e) => {
                  const val = e.target.value;
                  setNewPayment((prev) => ({ ...prev, guest: val }));
                  const found = clientsList.find((c) => c.guest === val);
                  if (found) {
                    setNewPayment((prev) => ({ ...prev, amount: String(Number(found.total || 0)) }));
                  }
                }} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 cursor-pointer focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700">
                  <option value="">Seleccione cliente</option>
                  {clientsList.map((c) => (
                    <option key={c.guest} value={c.guest}>{c.guest}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Monto</label>
                <input name="amount" value={newPayment.amount} onChange={handleCreatePaymentChange} type="number" step="0.01" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700" />
              </div>
            </div>

            <div>
              <h5 className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">Clientes y montos del día</h5>
              <div className="space-y-2">
                {clientsSummary.clients.map((c) => (
                  <div key={c.guest} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{c.guest}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(Number(c.total || 0))}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <span className="text-sm text-gray-800 dark:text-white/90">Total general</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(Number(clientsSummary.total || 0))}</span>
                </div>
              </div>
          </div>
          {createError && (
            <div className="px-2">
              <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {createError}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button size="sm" variant="outline" onClick={closeCreateModal}>Cancelar</Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={handleSubmitPayment} disabled={creatingPayment}>Guardar</Button>
        </div>
      </div>
      </Modal>

      <Modal isOpen={isArqueOpen} onClose={closeArqueModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-black lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Arque de Caja</h4>
            <div className="flex items-center gap-3 mt-4 mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-400 whitespace-nowrap">
                Seleccionar fecha:
              </label>
              <input
                type="date"
                value={arqueDate}
                onChange={handleArqueDateChange}
                max={new Date().toISOString().split('T')[0]}
                className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700"
              />
            </div>
            {arqueDate !== new Date().toISOString().split('T')[0] && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {(() => {
                  const [year, month, day] = arqueDate.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return `Arque del ${date.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
                })()}
              </p>
            )}
          </div>
          {loadingArque ? (
            <div className="px-2 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando arque de caja...</p>
            </div>
          ) : (
          <div className="px-2 space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Efectivo</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(Number(totals.methods?.Efectivo || 0))}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tarjeta</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(Number(totals.methods?.Tarjeta || 0))}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Yape</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(Number(totals.methods?.Yape || 0))}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Transferencia</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(Number(totals.methods?.Transferencia || 0))}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <span className="text-sm text-gray-800 dark:text-white/90">Total del Día</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(Number(totals.total || 0))}</span>
            </div>
          </div>
          )}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeArqueModal}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CajaCobros;
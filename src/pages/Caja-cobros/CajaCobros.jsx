import React, { useEffect, useState } from "react";
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

const CajaCobros = () => {
  const [transactions, setTransactions] = useState([]);
  const { isOpen: isReceiptOpen, openModal: openReceiptModal, closeModal: closeReceiptModal } = useModal();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [receiptForm, setReceiptForm] = useState({ numero: "", fecha: "", senores: "", direccion: "", dni: "", concepto: "", importe: "", total: "", son: "", canceladoFecha: "" });

  useEffect(() => {
    document.title = "Caja y Cobros - Administrador - Hotel Plaza Trujillo";

    // Datos de ejemplo para las transacciones del día
    setTransactions([
      {
        id: 1,
        transactionId: "TXN-001",
        type: "Pago de Reserva",
        guest: "Carlos Mendoza",
        method: "Yape",
        amount: 960.00,
        time: "09:15 AM",
        status: "Completado",
      },
      {
        id: 2,
        transactionId: "TXN-002",
        type: "Pago de Reserva",
        guest: "Ana García López",
        method: "Efectivo",
        amount: 735.00,
        time: "10:30 AM",
        status: "Completado",
      },
      {
        id: 3,
        transactionId: "TXN-003",
        type: "Servicio Adicional",
        guest: "Roberto Silva",
        method: "Tarjeta",
        amount: 150.00,
        time: "11:45 AM",
        status: "Completado",
      },
      {
        id: 4,
        transactionId: "TXN-004",
        type: "Pago de Reserva",
        guest: "Luis Ramírez",
        method: "Yape",
        amount: 735.00,
        time: "02:20 PM",
        status: "Completado",
      },
      {
        id: 5,
        transactionId: "TXN-005",
        type: "Servicio Adicional",
        guest: "María Torres",
        method: "Efectivo",
        amount: 80.00,
        time: "03:10 PM",
        status: "Completado",
      },
    ]);
  }, []);

  // Tarjetas de totales
  const totalCards = [
    {
      id: 1,
      title: "Total Yape",
      amount: 1695.00,
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
      amount: 815.00,
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
      amount: 150.00,
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
      amount: 2660.00,
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

  const handleRegistrarCobro = () => {
    // Función para registrar nuevo cobro
    console.log("Registrar cobro");
  };

  const handleArqueCaja = () => {
    // Función para arque de caja
    console.log("Arque de caja");
  };

  const handleEmitReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setReceiptForm({
      numero: String(962 + transaction.id).padStart(5, "0"),
      fecha: new Date().toISOString().slice(0, 10),
      senores: transaction.guest,
      direccion: "",
      dni: "",
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
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Transacciones de Hoy
          </h3>
          <p className="text-gray-500 text-theme-sm dark:text-gray-400 mb-4">
            Lista de todas las transacciones realizadas el día de hoy
          </p>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      ID Transacción
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
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        <div className="truncate max-w-[80px] sm:max-w-none">
                          {transaction.transactionId}
                        </div>
                      </TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isReceiptOpen} onClose={closeReceiptModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
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
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Imprimir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CajaCobros;
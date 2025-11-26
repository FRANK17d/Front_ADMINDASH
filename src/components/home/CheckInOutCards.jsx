import { useEffect, useState } from "react";
import { getTodayCheckinsCheckouts } from "../../api/dashboard";
import { getReservationDetail } from "../../api/reservations";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";

export default function CheckInOutCards() {
  const [checkIns, setCheckIns] = useState([]);
  const [checkOuts, setCheckOuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen: isDetailModalOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTodayCheckinsCheckouts();
        setCheckIns(data.checkins || []);
        setCheckOuts(data.checkouts || []);
      } catch (error) {
        console.error("Error fetching check-ins/check-outs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGuestClick = async (reservationId) => {
    if (!reservationId) return;
    
    setLoadingDetail(true);
    try {
      const reservation = await getReservationDetail(reservationId);
      setSelectedReservation(reservation);
      openDetailModal();
    } catch (error) {
      console.error("Error cargando detalles de reserva:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-black md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2"></div>
                <div className="h-4 w-40 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700 animate-pulse"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full dark:bg-gray-700 animate-pulse"></div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="w-full h-10 bg-gray-200 rounded-lg dark:bg-gray-700 animate-pulse mt-4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
      {/* Card de Check-in */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-black md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Check-in de Hoy
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              {checkIns.length} llegadas programadas
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/30">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          {checkIns.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hay check-ins programados para hoy
            </p>
          ) : (
            checkIns.map((guest) => (
            <div
              key={guest.id}
              onClick={() => handleGuestClick(guest.reservation_id)}
              className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full dark:bg-gray-900">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {guest.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Habitación {guest.room}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {guest.time}
                </span>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Card de Check-out */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-black md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Check-out de Hoy
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              {checkOuts.length} salidas programadas
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl dark:bg-red-900/30">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          {checkOuts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hay check-outs programados para hoy
            </p>
          ) : (
            checkOuts.map((guest) => (
            <div
              key={guest.id}
              onClick={() => handleGuestClick(guest.reservation_id)}
              className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full dark:bg-gray-900">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {guest.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Habitación {guest.room}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {guest.time}
                </span>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      <Modal isOpen={isDetailModalOpen} onClose={closeDetailModal} className="m-4 w-[95vw] max-w-[800px]">
        <div className="no-scrollbar relative w-full max-w-full max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-4 lg:p-8 dark:bg-black dark:border dark:border-orange-500/30">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Detalles de Reserva
            </h4>
          </div>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedReservation ? (
            <div className="px-2 space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Canal</p>
                  <Badge size="sm">
                    {selectedReservation.channel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Huésped</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {selectedReservation.guest_name || selectedReservation.guest}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Habitación</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {selectedReservation.room_label || selectedReservation.room || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Habitación</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedReservation.room_type || selectedReservation.roomType || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check-in</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {selectedReservation.check_in || selectedReservation.checkIn}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check-out</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {selectedReservation.check_out || selectedReservation.checkOut}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">
                    S/ {selectedReservation.total_amount ? selectedReservation.total_amount.toFixed(2) : (selectedReservation.total || '0.00')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hora de llegada</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {selectedReservation.arrival_time || selectedReservation.arrivalTime || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Personas</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {String(selectedReservation.num_adults || selectedReservation.numAdults || 0)} Adultos, {String(selectedReservation.num_children || selectedReservation.numChildren || 0)} Niños
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                  <Badge size="sm" color={getStatusBadgeColor(selectedReservation.status)}>
                    {selectedReservation.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Documento</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {(selectedReservation.document_type || selectedReservation.documentType || '-') + ' ' + (selectedReservation.document_number || selectedReservation.documentNumber || '')}
                  </p>
                </div>
                {selectedReservation.document_type === 'RUC' || selectedReservation.documentType === 'RUC' ? (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tipo / Estado / Condición</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {(selectedReservation.taxpayer_type || selectedReservation.taxpayerType || '-') + ' / ' + (selectedReservation.business_status || selectedReservation.businessStatus || '-') + ' / ' + (selectedReservation.business_condition || selectedReservation.businessCondition || '-')}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dirección</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedReservation.address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Departamento</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedReservation.department || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Provincia</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedReservation.province || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Distrito</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedReservation.district || '-'}</p>
                </div>
              </div>
              {selectedReservation.companions && selectedReservation.companions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Acompañantes</p>
                  <div className="mt-1 space-y-1">
                    {selectedReservation.companions.map((c, i) => (
                      <p key={i} className="text-gray-800 dark:text-white">{c.name}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={closeDetailModal}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


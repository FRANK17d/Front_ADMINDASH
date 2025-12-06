import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PaperPlaneIcon } from "../../icons";
import { listWebReservationRequests, updateWebReservationRequest } from "../../api/webReservations";
import { useAuth } from "../../context/AuthContext";

export default function ReserWeb() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Reservas Web - Hotel Plaza Trujillo";
    loadRequests();
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [requests]);
  
  const loadRequests = async () => {
    try {
      const data = await listWebReservationRequests('pending');
      setRequests(data);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRegisterReservation = (request) => {
    // Navegar a reservas con los datos precargados en la URL
    const queryParams = new URLSearchParams({
      fromWeb: 'true',
      requestId: request.id,
      documentType: request.documentType || '',
      documentNumber: request.documentNumber || '',
      guestName: request.guestName || '',
      phone: request.phone || '',
      address: request.address || '',
      department: request.department || '',
      province: request.province || '',
      district: request.district || '',
      checkIn: request.checkIn || '',
      checkOut: request.checkOut || '',
      numAdults: request.numAdults || 1,
      numChildren: request.numChildren || 0,
      numPeople: request.numPeople || 1,
      numRooms: request.numRooms || 1,
      arrivalTime: request.arrivalTime || '',
      departureTime: request.departureTime || '',
      totalAmount: request.totalAmount || 0,
      rooms: request.rooms || '',
      roomType: request.roomType || '',
    }).toString();
    
    navigate(`/admin/reservas?${queryParams}`);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <svg className="text-white size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Reservas Web
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chat con clientes que reservaron por la web
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black overflow-hidden">
        {/* Requests Area */}
        <div
          className="flex-1 overflow-y-auto p-5 space-y-4 pr-2 custom-scroll scroll-smooth"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
          }}
        >
          {requests.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No hay solicitudes pendientes
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Las solicitudes de reservas web aparecerán aquí
                </p>
              </div>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-blue-200 dark:border-blue-900 p-5 shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <svg className="text-white size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {request.guestName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.documentType}: {request.documentNumber}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 text-xs font-semibold rounded-full">
                    Pendiente
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">📞 Teléfono</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{request.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">🏨 Habitaciones</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{request.rooms}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">📅 Check-in</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{request.checkIn}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">📅 Check-out</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{request.checkOut}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">👥 Huéspedes</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {request.numAdults} adultos, {request.numChildren} niños
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">💰 Total</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      S/ {Number(request.totalAmount).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRegisterReservation(request)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                  >
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Registrar Reserva
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Solicitud recibida: {new Date(request.createdAt).toLocaleString('es-PE')}
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <style>{`
        .custom-scroll { 
          scrollbar-width: thin; 
          scrollbar-color: rgba(59, 130, 246, 0.6) transparent; 
        }
        .custom-scroll::-webkit-scrollbar { 
          width: 8px; 
        }
        .custom-scroll::-webkit-scrollbar-track { 
          background: transparent; 
        }
        .custom-scroll::-webkit-scrollbar-thumb { 
          background: linear-gradient(180deg, #60a5fa, #3b82f6); 
          border-radius: 9999px; 
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover { 
          background: linear-gradient(180deg, #3b82f6, #2563eb); 
        }
      `}</style>
    </div>
  );
}
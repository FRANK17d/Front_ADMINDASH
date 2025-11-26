import { useEffect, useState } from "react";
import { getTodayCheckinsCheckouts } from "../../api/dashboard";
import { getMaintenanceIssues, getBlockedRooms, getSystemStatus } from "../../api/mantenimiento";
import { listReservations } from "../../api/reservations";
import CheckInOutCards from "../../components/home/CheckInOutCards";
import Badge from "../../components/ui/badge/Badge";
import { Link } from "react-router";

export default function HomeHousekeeping() {
  const [roomStats, setRoomStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
    blocked: 0,
  });
  const [pendingIssues, setPendingIssues] = useState([]);
  const [blockedRooms, setBlockedRooms] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard - Hotelero - Hotel Plaza Trujillo";
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reservations, issues, blocked, system] = await Promise.all([
        listReservations(),
        getMaintenanceIssues(),
        getBlockedRooms(),
        getSystemStatus(),
      ]);

      // Calcular estadísticas de habitaciones
      const today = new Date().toISOString().slice(0, 10);
      const occupiedRooms = new Set();
      const maintenanceRooms = new Set();

      reservations.forEach((res) => {
        if (res.status?.toLowerCase() === "cancelada") return;
        const checkIn = res.checkIn;
        const checkOut = res.checkOut;
        if (checkIn && checkOut && today >= checkIn && today < checkOut) {
          if (Array.isArray(res.rooms)) {
            res.rooms.forEach((room) => occupiedRooms.add(room));
          } else if (res.room) {
            occupiedRooms.add(res.room);
          }
        }
      });

      issues.forEach((issue) => {
        if (issue.room) {
          maintenanceRooms.add(issue.room);
        }
      });

      const totalRooms = 30; // Ajustar según el total real de habitaciones
      const blockedRoomsSet = new Set(blocked.map((r) => r.room));

      setRoomStats({
        total: totalRooms,
        available: totalRooms - occupiedRooms.size - maintenanceRooms.size - blockedRoomsSet.size,
        occupied: occupiedRooms.size,
        maintenance: maintenanceRooms.size,
        blocked: blockedRoomsSet.size,
      });

      // Incidencias pendientes (últimas 5)
      const pending = issues
        .filter((issue) => issue.status?.toLowerCase() !== "resuelta")
        .slice(0, 5);
      setPendingIssues(pending);

      // Habitaciones bloqueadas
      setBlockedRooms(blocked.slice(0, 5));

      // Estado del sistema
      setSystemStatus(system);
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "alta":
        return "error";
      case "media":
        return "warning";
      case "baja":
        return "success";
      default:
        return "warning";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 md:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6">
              <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700 animate-pulse"></div>
              <div className="flex items-end justify-between mt-5">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2"></div>
                  <div className="h-6 w-32 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de estado de habitaciones */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 md:gap-6">
        {/* Total Habitaciones */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/30">
            <svg className="text-blue-600 size-6 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Habitaciones</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {roomStats.total} Hab.
              </h4>
            </div>
          </div>
        </div>

        {/* Disponibles */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/30">
            <svg className="text-green-600 size-6 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Disponibles</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {roomStats.available} Hab.
              </h4>
            </div>
          </div>
        </div>

        {/* Ocupadas */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-900/30">
            <svg className="text-orange-600 size-6 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Ocupadas</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {roomStats.occupied} Hab.
              </h4>
            </div>
          </div>
        </div>

        {/* En Mantenimiento */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl dark:bg-yellow-900/30">
            <svg className="text-yellow-600 size-6 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Mantenimiento</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {roomStats.maintenance} Hab.
              </h4>
            </div>
          </div>
        </div>

        {/* Bloqueadas */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl dark:bg-red-900/30">
            <svg className="text-red-600 size-6 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Bloqueadas</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {roomStats.blocked} Hab.
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in y Check-out del día */}
      <CheckInOutCards />

      {/* Sistema de Agua Caliente y Incidencias */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Sistema de Agua Caliente */}
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6">
            <h5 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Sistema de Agua Caliente
            </h5>
            {systemStatus && (
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Estado</span>
                  <div className="mt-1">
                    <Badge color={systemStatus.operationalStatus === "Operativo" ? "success" : "error"}>
                      {systemStatus.operationalStatus}
                    </Badge>
                  </div>
                </div>
                {systemStatus.nextMaintenance && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Próximo Cambio</span>
                    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {systemStatus.nextMaintenance.date} {systemStatus.nextMaintenance.time}
                    </p>
                  </div>
                )}
                <Link
                  to="/hoteler/mantenimiento"
                  className="block mt-4 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
                >
                  Ver detalles →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Incidencias Pendientes */}
        <div className="col-span-12 lg:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Incidencias Pendientes
              </h5>
              <Link
                to="/hoteler/mantenimiento"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
              >
                Ver todas →
              </Link>
            </div>
            {pendingIssues.length > 0 ? (
              <div className="space-y-3">
                {pendingIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          Hab. {issue.room}
                        </span>
                        <Badge size="sm" color={getStatusBadgeColor(issue.priority)}>
                          {issue.priority}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {issue.problem}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay incidencias pendientes
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Habitaciones Bloqueadas */}
      {blockedRooms.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Habitaciones Bloqueadas
            </h5>
            <Link
              to="/hoteler/mantenimiento"
              className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {blockedRooms.map((room) => (
              <div
                key={room.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <div className="font-medium text-gray-800 dark:text-white/90">
                  Hab. {room.room}
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Hasta: {room.blocked_until}
                </div>
                {room.reason && (
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {room.reason.substring(0, 30)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { getRecentReservations } from "../../api/dashboard";

export default function RecentOrders() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRecentReservations();
        setReservations(data.reservations || []);
      } catch (error) {
        console.error("Error fetching recent reservations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-black sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Reservas Recientes
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Últimas reservas registradas en el sistema
          </p>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[720px] sm:min-w-0">
          <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Huésped
              </TableCell>
              <TableCell
                isHeader
                className="py-3.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Habitación
              </TableCell>
              <TableCell
                isHeader
                className="py-3.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Check-in / Check-out
              </TableCell>
              <TableCell
                isHeader
                className="py-3.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total
              </TableCell>
              <TableCell
                isHeader
                className="py-3.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Estado
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full dark:bg-gray-700 animate-pulse"></div>
                        <div>
                          <div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="h-4 w-16 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="h-6 w-20 bg-gray-200 rounded-full dark:bg-gray-700 animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 px-4 text-center text-gray-500 dark:text-gray-400">
                  No hay reservas recientes
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((reservation) => (
              <TableRow key={reservation.id} className="">
                <TableCell className="py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full dark:bg-blue-900/30">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {reservation.guestName}
                      </p>
                      <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                        {reservation.guests}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3.5 text-gray-500 text-theme-sm dark:text-gray-400">
                  {reservation.room}
                </TableCell>
                <TableCell className="py-3.5">
                  <div className="text-gray-800 text-theme-sm dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-theme-xs">{reservation.checkIn}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-theme-xs">{reservation.checkOut}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3.5 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                  {reservation.total}
                </TableCell>
                <TableCell className="py-3.5 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      reservation.status === "Confirmada"
                        ? "success"
                        : reservation.status === "Check-in"
                        ? "warning"
                        : "error"
                    }
                  >
                    {reservation.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

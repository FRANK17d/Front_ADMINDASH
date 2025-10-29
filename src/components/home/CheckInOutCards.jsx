export default function CheckInOutCards() {
  // Datos de ejemplo para check-ins del día
  const checkIns = [
    { id: 1, name: "Ana García López", room: "105", time: "14:30" },
    { id: 2, name: "Roberto Silva", room: "302", time: "15:15" },
    { id: 3, name: "Luis Ramírez", room: "110", time: "16:00" },
  ];

  // Datos de ejemplo para check-outs del día
  const checkOuts = [
    { id: 1, name: "María Torres", room: "208", time: "11:00" },
    { id: 2, name: "Juan Pérez", room: "150", time: "11:30" },
    { id: 3, name: "Carmen Díaz", room: "305", time: "12:00" },
  ];

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
          {checkIns.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
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
          ))}
        </div>

        <button className="w-full mt-4 py-2.5 text-sm font-medium text-blue-600 transition-colors border border-blue-200 rounded-lg hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/20">
          Ver todos los check-ins
        </button>
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
          {checkOuts.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
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
          ))}
        </div>

        <button className="w-full mt-4 py-2.5 text-sm font-medium text-blue-600 transition-colors border border-blue-200 rounded-lg hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/20">
          Ver todos los check-outs
        </button>
      </div>
    </div>
  );
}


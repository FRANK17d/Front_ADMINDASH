import { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

// Función para formatear tiempo relativo
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Ahora';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);
  
  if (diffInSeconds < 60) return 'Ahora';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  return `${Math.floor(diffInSeconds / 86400)} días ago`;
};

// Clave para localStorage (específica por usuario)
const getStorageKey = (userId) => `notifications_${userId || 'guest'}`;

// Cargar notificaciones desde localStorage
const loadNotificationsFromStorage = (userId) => {
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const notifications = JSON.parse(stored);
      // Filtrar notificaciones antiguas (más de 7 días)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return notifications.filter(n => {
        const notificationTime = new Date(n.timestamp).getTime();
        return notificationTime > sevenDaysAgo;
      });
    }
  } catch (error) {
    console.error('Error cargando notificaciones desde localStorage:', error);
  }
  return [];
};

// Guardar notificaciones en localStorage
const saveNotificationsToStorage = (userId, notifications) => {
  try {
    const key = getStorageKey(userId);
    // Limitar a 50 notificaciones para no exceder el límite de localStorage
    const notificationsToSave = notifications.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(notificationsToSave));
  } catch (error) {
    console.error('Error guardando notificaciones en localStorage:', error);
    // Si hay error (por ejemplo, localStorage lleno), intentar limpiar notificaciones antiguas
    try {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const filtered = notifications.filter(n => {
        const notificationTime = new Date(n.timestamp).getTime();
        return notificationTime > sevenDaysAgo;
      }).slice(0, 30); // Reducir a 30 si hay problemas
      localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
    } catch (e) {
      console.error('Error crítico guardando notificaciones:', e);
    }
  }
};

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const isInitializedRef = useRef(false);

  // Cargar notificaciones desde localStorage al montar o cuando cambia el usuario
  useEffect(() => {
    if (user?.uid && !isInitializedRef.current) {
      const loadedNotifications = loadNotificationsFromStorage(user.uid);
      setNotifications(loadedNotifications);
      isInitializedRef.current = true;
      console.log('NotificationDropdown: Notificaciones cargadas desde localStorage', loadedNotifications.length);
    } else if (!user && isInitializedRef.current) {
      // Si el usuario cierra sesión, limpiar
      setNotifications([]);
      isInitializedRef.current = false;
    }
  }, [user]);

  // Guardar notificaciones en localStorage cada vez que cambien
  useEffect(() => {
    if (user?.uid && notifications.length > 0) {
      saveNotificationsToStorage(user.uid, notifications);
    }
  }, [notifications, user]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };
  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-black dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute left-[-60px] lg:left-[-240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notificaciones
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {/* Notificaciones en tiempo real */}
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <li key={notification.id}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                    <div className="w-full h-full flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                      {notification.type === 'incidence' ? (
                        <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                    <span className={`absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
                      notification.type === 'incidence' ? 'bg-error-500' : 'bg-warning-500'
                    }`}></span>
                  </span>

                  <span className="block">
                    <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {notification.title}
                      </span>
                    </span>
                    <span className="block text-sm text-gray-700 dark:text-gray-300">
                      {notification.message}
                    </span>
                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{formatTimeAgo(notification.timestamp)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No hay notificaciones
            </li>
          )}
        </ul>
      </Dropdown>
    </div>
  );
}

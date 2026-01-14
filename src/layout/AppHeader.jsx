import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import UserDropdown from "../components/header/UserDropdown";
import { useAuth, ROLES } from "../context/AuthContext";
import {
  CalenderIcon,
  UserIcon,
  ChatBotIcon,
} from "../icons";

const AppHeader = () => {
  const { userRole } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Cerrar menú móvil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Cerrar menú móvil cuando cambia la ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Determinar el prefijo de ruta según el rol
  const routePrefix = userRole === ROLES.RECEPTIONIST ? '/recepcionista' : (userRole === ROLES.HOUSEKEEPING ? '/hoteler' : '/admin');

  const navItems = [
    {
      icon: <CalenderIcon className="w-5 h-5" />,
      name: "Pasajeros",
      path: `${routePrefix}/pasajeros`,
    },
    {
      icon: <UserIcon className="w-5 h-5" />,
      name: "Usuarios",
      path: `${routePrefix}/usuarios`,
      allowedRoles: [ROLES.ADMIN],
    },
    {
      icon: <ChatBotIcon className="w-5 h-5" />,
      name: "ChatBot",
      path: `${routePrefix}/chatbot`,
    }
  ];

  // Función simple para comprobar si la ruta está activa
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Filtrar items según el rol
  const filteredNavItems = navItems.filter(nav => !nav.allowedRoles || nav.allowedRoles.includes(userRole));

  return (
    <header className="sticky top-0 flex w-full bg-white border-b border-gray-200 z-50 dark:border-gray-800 dark:bg-black">
      <div className="flex items-center justify-between w-full px-4 py-3 lg:px-6">
        {/* Left Side: Mobile Menu Button & Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            aria-label="Menú de navegación"
          >
            {isMobileMenuOpen ? (
              // Icono X (cerrar)
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Icono hamburguesa
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Logo */}
          <Link to="/">
            <img
              className="dark:hidden w-[140px] pr-6 lg:w-[140px]"
              src="/images/logo/logo-light.png"
              alt="Logo"
            />
            <img
              className="hidden dark:block w-[140px] pr-6 lg:w-[140px]"
              src="/images/logo/logo-dark.png"
              alt="Logo"
            />
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-6 ml-8">
            {filteredNavItems.map((nav) => (
              <Link
                key={nav.name}
                to={nav.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${isActive(nav.path)
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-gray-600 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
                  }`}
              >
                {nav.icon}
                <span>{nav.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side: Theme Toggle and User Profile */}
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <UserDropdown />
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-lg z-40"
        >
          <nav className="flex flex-col py-2">
            {filteredNavItems.map((nav) => (
              <Link
                key={nav.name}
                to={nav.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-base font-medium transition-colors duration-200 ${isActive(nav.path)
                  ? "text-orange-500 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
                  : "text-gray-700 hover:text-orange-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-orange-400 dark:hover:bg-gray-800"
                  }`}
              >
                {nav.icon}
                <span>{nav.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default AppHeader;

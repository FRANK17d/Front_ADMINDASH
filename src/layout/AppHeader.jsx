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

  return (
    <header className="sticky top-0 flex w-full bg-white border-b border-gray-200 z-50 dark:border-gray-800 dark:bg-black">
      <div className="flex items-center justify-between w-full px-4 py-3 lg:px-6">
        {/* Left Side: Logo and Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/">
            <img
              className="dark:hidden"
              src="/images/logo/logo-light.png"
              alt="Logo"
              width={140}
            />
            <img
              className="hidden dark:block"
              src="/images/logo/logo-dark.png"
              alt="Logo"
              width={140}
            />
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.filter(nav => !nav.allowedRoles || nav.allowedRoles.includes(userRole)).map((nav) => (
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
    </header>
  );
};

export default AppHeader;

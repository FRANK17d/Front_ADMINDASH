import React, { useEffect, useState, useRef } from "react";
import { PaperPlaneIcon, ChatIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";

const Mensajes = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = "Mensajes - Administrador - Hotel Plaza Trujillo";

    // Datos de ejemplo de empleados
    const employeesData = [
      {
        id: 1,
        name: "María González",
        role: "Recepcionista",
        avatar: "MG",
        status: "online",
        lastMessage: "Claro, voy a revisar la reserva ahora mismo",
        lastMessageTime: "10:45 AM",
        unreadCount: 2,
        isTyping: false,
      },
      {
        id: 2,
        name: "Carlos Ramírez",
        role: "Limpieza",
        avatar: "CR",
        status: "online",
        lastMessage: "Habitación 205 lista para el check-in",
        lastMessageTime: "09:30 AM",
        unreadCount: 0,
        isTyping: false,
      },
      {
        id: 3,
        name: "Ana Torres",
        role: "Mantenimiento",
        avatar: "AT",
        status: "offline",
        lastMessage: "Reparación completada en habitación 302",
        lastMessageTime: "Ayer",
        unreadCount: 1,
        isTyping: false,
      },
      {
        id: 4,
        name: "Luis Martínez",
        role: "Seguridad",
        avatar: "LM",
        status: "online",
        lastMessage: "Todo en orden en el turno nocturno",
        lastMessageTime: "08:15 AM",
        unreadCount: 0,
        isTyping: false,
      },
      {
        id: 5,
        name: "Sofía Herrera",
        role: "Cocina",
        avatar: "SH",
        status: "offline",
        lastMessage: "Menú del día preparado",
        lastMessageTime: "Ayer",
        unreadCount: 0,
        isTyping: false,
      },
    ];

    setEmployees(employeesData);

    // Seleccionar el primer empleado por defecto
    if (!selectedEmployee) {
      setSelectedEmployee(employeesData[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      // Cargar mensajes del empleado seleccionado
      const conversationMessages = [
        {
          id: 1,
          sender: "employee",
          text: "Buenos días, ¿hay algo que necesite revisar?",
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: 2,
          sender: "admin",
          text: "Sí, por favor revisa la reserva de la habitación 205",
          timestamp: new Date(Date.now() - 3300000),
        },
        {
          id: 3,
          sender: "employee",
          text: "Claro, voy a revisar la reserva ahora mismo",
          timestamp: new Date(Date.now() - 1800000),
        },
        {
          id: 4,
          sender: "employee",
          text: "Ya revisé la reserva, todo está en orden. Los datos del huésped están correctos.",
          timestamp: new Date(Date.now() - 900000),
        },
      ];
      setMessages(conversationMessages);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    // Marcar mensajes como leídos
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employee.id ? { ...emp, unreadCount: 0 } : emp
      )
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedEmployee) return;

    const newMessage = {
      id: messages.length + 1,
      sender: "admin",
      text: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simular respuesta del empleado después de 2 segundos
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const employeeResponse = {
        id: messages.length + 2,
        sender: "employee",
        text: "Entendido, me encargaré de eso ahora mismo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, employeeResponse]);

      // Actualizar último mensaje en la lista de empleados
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee.id
            ? {
                ...emp,
                lastMessage: inputValue.trim(),
                lastMessageTime: formatTime(new Date()),
              }
            : emp
        )
      );
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Ayer";
    } else {
      return messageDate.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const formatMessageTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = (now - messageDate) / (1000 * 60);

    if (diffInMinutes < 1) {
      return "Ahora";
    } else if (diffInMinutes < 60) {
      return `Hace ${Math.floor(diffInMinutes)} min`;
    } else {
      return messageDate.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Mensajes
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Comunícate en tiempo real con los empleados
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Lista de Empleados */}
        <div className="lg:col-span-1 flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              Empleados
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {employees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => handleSelectEmployee(employee)}
                className={`w-full p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                  selectedEmployee?.id === employee.id
                    ? "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                      {employee.avatar}
                    </div>
                    {employee.status === "online" && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {employee.name}
                      </h4>
                      {employee.unreadCount > 0 && (
                        <Badge size="sm" color="error" className="ml-2">
                          {employee.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {employee.role}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                      {employee.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {employee.lastMessageTime}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Área de Chat */}
        {selectedEmployee ? (
          <div className="lg:col-span-2 flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black overflow-hidden">
            {/* Header del Chat */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                    {selectedEmployee.avatar}
                  </div>
                  {selectedEmployee.status === "online" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedEmployee.role}
                    {selectedEmployee.status === "online" && (
                      <span className="ml-2 text-green-500">• En línea</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div
              className="flex-1 overflow-y-auto p-5 space-y-4 custom-scroll"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
              }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "admin" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[75%] ${
                      message.sender === "admin"
                        ? "flex-row-reverse"
                        : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    {message.sender === "employee" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-xs">
                        {selectedEmployee.avatar}
                      </div>
                    )}

                    {/* Mensaje */}
                    <div>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          message.sender === "admin"
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.text}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Indicador de escritura */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[75%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {selectedEmployee.avatar}
                      </span>
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    style={{ minHeight: "48px", maxHeight: "120px" }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
                >
                  <PaperPlaneIcon className="size-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
            <div className="text-center">
              <ChatIcon className="size-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Selecciona un empleado para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mensajes;
import React, { useEffect, useState, useRef } from "react";
import { PaperPlaneIcon, ChatIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import { listUsersForMessaging, getMessages, sendMessage } from "../../api/messaging";
import { useAuth } from "../../context/AuthContext";

const Mensajes = () => {
  const { user } = useAuth(); // user es el usuario actual autenticado
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingInterval = useRef(null);

  // Función para mostrar notificación del sistema
  const showNotification = (title, body, icon) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: icon || '/images/logo/logo.png',
        badge: '/images/logo/logo.png'
      });
    }
  };

  // Solicitar permiso para notificaciones al cargar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Función para obtener el nombre del rol
  const getRoleName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'receptionist':
        return 'Recepcionista';
      case 'housekeeping':
        return 'Hotelero';
      default:
        return 'Usuario';
    }
  };

  // Función para generar avatar con iniciales
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return name[0] + (name[1] || '');
  };

  useEffect(() => {
    document.title = "Mensajes - Administrador - Hotel Plaza Trujillo";
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await listUsersForMessaging();
      
      const usersData = data.users.map(u => ({
        id: u.uid,
        uid: u.uid,
        name: u.name,
        role: getRoleName(u.role),
        avatar: getInitials(u.name),
        photo: u.photo,
        status: 'online', // Por ahora todos online, después se puede implementar presencia real
        lastMessage: u.last_message || '',
        lastMessageTime: u.last_message_time ? formatTime(new Date(u.last_message_time)) : '',
        unreadCount: u.unread_count || 0,
      }));
      
      setEmployees(usersData);
      
      // Seleccionar el primer usuario por defecto si hay usuarios
      if (usersData.length > 0 && !selectedEmployee) {
        setSelectedEmployee(usersData[0]);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling para actualizar la lista de usuarios (cada 5 segundos)
  useEffect(() => {
    const userListInterval = setInterval(() => {
      loadUsers();
    }, 5000);

    return () => {
      clearInterval(userListInterval);
    };
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadMessages();
      
      // Polling cada 3 segundos para actualizar mensajes
      pollingInterval.current = setInterval(() => {
        loadMessages();
      }, 3000);
      
      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    }
  }, [selectedEmployee]);

  const loadMessages = async () => {
    if (!selectedEmployee) return;
    
    try {
      const data = await getMessages(selectedEmployee.uid);
      
      const conversationMessages = data.messages.map(msg => ({
        id: msg.id,
        sender: msg.sender_uid === user?.uid ? 'admin' : 'employee',
        sender_uid: msg.sender_uid,
        text: msg.text,
        message_type: msg.message_type || 'text',
        attachment: msg.attachment,
        attachment_name: msg.attachment_name,
        attachment_size: msg.attachment_size,
        timestamp: new Date(msg.timestamp),
      }));
      
      // Detectar nuevos mensajes y mostrar notificación
      if (messages.length > 0 && conversationMessages.length > lastMessageCount && lastMessageCount > 0) {
        const newMessages = conversationMessages.slice(lastMessageCount);
        const lastNewMessage = newMessages[newMessages.length - 1];
        
        // Solo notificar si el nuevo mensaje NO es del usuario actual
        if (lastNewMessage.sender_uid !== user?.uid) {
          const notificationText = lastNewMessage.message_type === 'image' 
            ? '📷 Te envió una imagen' 
            : lastNewMessage.message_type === 'file'
            ? `📎 Te envió ${lastNewMessage.attachment_name}`
            : lastNewMessage.text;

          showNotification(
            `Nuevo mensaje de ${selectedEmployee.name}`,
            notificationText,
            selectedEmployee.photo
          );
        }
      }
      
      setMessages(conversationMessages);
      setLastMessageCount(conversationMessages.length);
      
      // Auto-scroll al final
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    // Limpiar archivo seleccionado al cambiar de usuario
    setSelectedFile(null);
    setFilePreview(null);
    // Marcar mensajes como leídos
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employee.id ? { ...emp, unreadCount: 0 } : emp
      )
    );
  };

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Eliminar archivo seleccionado
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedFile) || !selectedEmployee) return;

    try {
      const messageText = inputValue.trim();
      let messageData = { text: messageText };

      // Si hay archivo adjunto
      if (selectedFile) {
        const reader = new FileReader();
        
        await new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result;
            const messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
            
            messageData = {
              text: messageText,
              message_type: messageType,
              attachment: base64,
              attachment_name: selectedFile.name,
              attachment_size: selectedFile.size
            };
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      setInputValue(""); // Limpiar input inmediatamente
      handleRemoveFile(); // Limpiar archivo seleccionado
      
      const data = await sendMessage(selectedEmployee.uid, messageData);
      
      const newMessage = {
        id: data.message.id,
        sender: "admin",
        sender_uid: user?.uid,
        text: data.message.text,
        message_type: data.message.message_type,
        attachment: data.message.attachment,
        attachment_name: data.message.attachment_name,
        attachment_size: data.message.attachment_size,
        timestamp: new Date(data.message.timestamp),
      };

      setMessages((prev) => [...prev, newMessage]);
      setLastMessageCount((prev) => prev + 1);
      
      // Actualizar último mensaje en la lista de empleados
      const lastMessageText = messageData.message_type === 'image' 
        ? '📷 Imagen' 
        : messageData.message_type === 'file' 
        ? `📎 ${messageData.attachment_name}` 
        : messageText;

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.uid === selectedEmployee.uid
            ? {
                ...emp,
                lastMessage: lastMessageText,
                lastMessageTime: formatTime(new Date()),
              }
            : emp
        )
      );
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                      {employee.photo ? (
                        <img 
                          src={employee.photo} 
                          alt={employee.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = employee.avatar;
                          }}
                        />
                      ) : (
                        employee.avatar
                      )}
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                    {selectedEmployee.photo ? (
                      <img 
                        src={selectedEmployee.photo} 
                        alt={selectedEmployee.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = selectedEmployee.avatar;
                        }}
                      />
                    ) : (
                      selectedEmployee.avatar
                    )}
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-xs overflow-hidden">
                        {selectedEmployee.photo ? (
                          <img 
                            src={selectedEmployee.photo} 
                            alt={selectedEmployee.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = selectedEmployee.avatar;
                            }}
                          />
                        ) : (
                          selectedEmployee.avatar
                        )}
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
                        {/* Imagen adjunta */}
                        {message.message_type === 'image' && message.attachment && (
                          <div className="mb-2">
                            <img 
                              src={message.attachment} 
                              alt={message.attachment_name || 'Imagen'} 
                              className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.attachment, '_blank')}
                            />
                          </div>
                        )}

                        {/* Archivo adjunto */}
                        {message.message_type === 'file' && message.attachment && (
                          <a 
                            href={message.attachment} 
                            download={message.attachment_name}
                            className={`flex items-center gap-2 p-3 rounded-lg mb-2 hover:opacity-80 transition-opacity ${
                              message.sender === "admin"
                                ? "bg-orange-600"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{message.attachment_name}</p>
                              <p className="text-xs opacity-75">
                                {message.attachment_size ? `${(message.attachment_size / 1024).toFixed(1)} KB` : ''}
                              </p>
                            </div>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </a>
                        )}

                        {/* Texto del mensaje */}
                        {message.text && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.text}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-4">
              {/* Preview de archivo seleccionado */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                  {filePreview ? (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="flex gap-3 items-end">
                {/* Botón de adjuntar archivo */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center transition-all duration-200"
                  title="Adjuntar archivo"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                </button>

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
                  disabled={!inputValue.trim() && !selectedFile}
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
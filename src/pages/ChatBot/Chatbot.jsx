import { useEffect, useState, useRef } from "react";
import { PaperPlaneIcon } from "../../icons";
import { ChatBotIcon } from "../../icons";

async function processChatbotMessage(text, sessionId) {
  return { message: `Recibido: ${text}`, timestamp: new Date().toISOString(), session_id: sessionId };
}

async function getChatbotHistory() {
  return { conversations: [] };
}

async function endChatbotSession(sessionId) {
  return { ended: true, session_id: sessionId };
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "¡Hola! 👋 Soy tu asistente virtual del Hotel Plaza. Puedo ayudarte con información sobre ingresos, ocupación, reservas y más. ¿En qué puedo asistirte hoy?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "¿Cuáles son las ganancias del mes?",
    "¿Cuál es la tasa de ocupación actual?",
    "¿Cuántas reservas tenemos hoy?",
    "Muéstrame los ingresos de esta semana",
    "¿Qué habitaciones están disponibles?",
    "Resumen de check-ins de hoy",
  ];

  useEffect(() => {
    document.title = "Chatbot IA - Administrador - Hotel Plaza Trujillo";
    // Cargar historial de conversaciones al montar el componente
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const data = await getChatbotHistory();
      if (data.conversations && data.conversations.length > 0) {
        // Cargar la conversación más reciente
        const latestConv = data.conversations[0];
        const formattedMessages = [];
        
        latestConv.messages.forEach((msg, index) => {
          formattedMessages.push({
            id: index + 1,
            type: msg.type === 'user' ? 'user' : 'bot',
            text: msg.content,
            timestamp: new Date(msg.timestamp),
          });
        });
        
        if (formattedMessages.length > 0) {
          setMessages(formattedMessages);
          setSessionId(latestConv.session_id);
        }
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
      // Si hay error, mantener el mensaje de bienvenida por defecto
    }
  };

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim() || isLoading) return;

    // Agregar mensaje del usuario
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Enviar mensaje al backend
      const response = await processChatbotMessage(text.trim(), sessionId);
      
      // Agregar respuesta del bot
      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        text: response.message,
        timestamp: new Date(response.timestamp),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error al procesar mensaje:", error);
      // Mensaje de error
      const errorMessage = {
        id: messages.length + 2,
        type: "bot",
        text: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
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
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
            <ChatBotIcon className="text-white size-9" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Asistente Virtual IA
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pregunta lo que necesites sobre tu hotel
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Suggested Questions - Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="h-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
              Preguntas sugeridas
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="w-full text-left px-4 py-3 text-sm rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-gray-700 dark:text-gray-300 transition-colors duration-200 border border-orange-200 dark:border-orange-800/50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black overflow-hidden">
          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto p-5 space-y-4 pr-2 custom-scroll scroll-smooth"
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
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      message.type === "user"
                        ? "bg-gray-200 dark:bg-gray-700"
                        : "bg-gradient-to-br from-orange-500 to-orange-600"
                    }`}
                  >
                    {message.type === "user" ? (
                      <svg className="text-gray-600 dark:text-gray-300 size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="text-white size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.type === "user"
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.text}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <svg className="text-white size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
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
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu pregunta aquí..."
                  rows={1}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <PaperPlaneIcon className="size-5" />
                )}
              </button>
            </div>
            
            {/* Quick suggestions on mobile */}
            <div className="lg:hidden mt-3 flex gap-2 overflow-x-auto pb-2">
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="flex-shrink-0 px-3 py-2 text-xs rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-gray-700 dark:text-gray-300 transition-colors duration-200 border border-orange-200 dark:border-orange-800/50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scroll { 
          scrollbar-width: thin; 
          scrollbar-color: rgba(234, 88, 12, 0.6) transparent; 
        }
        .custom-scroll::-webkit-scrollbar { 
          width: 8px; 
        }
        .custom-scroll::-webkit-scrollbar-track { 
          background: transparent; 
        }
        .custom-scroll::-webkit-scrollbar-thumb { 
          background: linear-gradient(180deg, #fb923c, #ea580c); 
          border-radius: 9999px; 
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover { 
          background: linear-gradient(180deg, #f97316, #c2410c); 
        }
      `}</style>
    </div>
  );
}
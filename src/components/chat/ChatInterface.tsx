import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import InputBox from './InputBox';
import { X, Minimize2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Respuestas simuladas para el Asistente de Gobierno Local
const MOCK_RESPONSES = [
  "Claro, puedo ayudarte con eso. El trámite para solicitar alumbrado público se realiza a través de nuestro portal web en la sección 'Trámites > Infraestructura'. Necesitarás tu número de medidor.",
  "Para reportar un bache, por favor bríndame la dirección exacta y si es posible, una referencia.",
  "Nuestros horarios de atención presencial son de Lunes a Viernes de 8:00 AM a 4:00 PM.",
  "Entiendo. He registrado tu reporte. Te enviaremos un número de seguimiento al correo electrónico en unos minutos.",
  "Actualmente hay un mantenimiento programado en la red de agua potable para la zona norte. El servicio se restablecerá a las 18:00 hrs.",
];

export default function ChatInterface({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy el Asistente Virtual del Gobierno Local. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const simulateStreaming = async (text: string) => {
    setIsTyping(true);
    
    // Add an empty assistant message first
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate streaming word by word
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content: words.slice(0, i + 1).join(' ')
        };
        return newMessages;
      });
    }
    
    setIsTyping(false);
  };

  const handleSend = async (input: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    // Pick a random mock response
    const responseText = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    
    await simulateStreaming(responseText);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all"
        >
          <Sparkles size={20} />
          <span className="font-medium">Abrir Asistente</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <h3 className="font-medium text-sm">Asistente Virtual</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors">
            <Minimize2 size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role} content={msg.content} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs my-2">
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-2">Escribiendo...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <InputBox onSend={handleSend} disabled={isTyping} />
    </div>
  );
}

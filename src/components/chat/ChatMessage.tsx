import { User, Bot } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';
  
  if (role === 'system') {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full mb-4 gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
          <Bot size={18} />
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-sm" 
          : "bg-card border shadow-sm text-foreground rounded-tl-sm"
      )}>
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border text-muted-foreground">
          <User size={18} />
        </div>
      )}
    </div>
  );
}

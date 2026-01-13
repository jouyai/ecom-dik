import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Minimize2 } from "lucide-react";
import { sendMessageToAI } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Halo! Ada yang bisa saya bantu cari hari ini?", sender: "bot" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (window.innerWidth < 640 && isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const aiResponseText = await sendMessageToAI(input, messages);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: aiResponseText,
      sender: "bot",
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* --- CHAT WINDOW --- */}
      {/* Menggunakan fixed positioning terpisah agar fleksibel di mobile/desktop */}
      {isOpen && (
        <div className={cn(
            "fixed z-50 bg-background shadow-2xl transition-all duration-300 flex flex-col overflow-hidden",
            // MOBILE STYLES: Full screen (inset-0), rounded-none
            "inset-0 w-full h-full rounded-none",
            // DESKTOP STYLES (sm): Floating card, rounded-xl, limited width/height
            "sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[550px] sm:rounded-xl sm:border border-stone-200"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-stone-900 text-white shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <h3 className="font-semibold text-sm">Asisten Belanja</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              {window.innerWidth < 640 ? <X className="h-5 w-5" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50" ref={scrollRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    msg.sender === "user"
                      ? "bg-stone-900 text-white rounded-br-none"
                      : "bg-white text-stone-800 border border-stone-200 rounded-bl-none"
                  )}
                >
                  {msg.sender === "user" ? (
                    msg.text
                  ) : (
                    <div className="text-sm leading-relaxed overflow-hidden">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-3 rounded-lg border border-stone-200 shadow-sm bg-white">
                              <table className="w-full text-xs" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => <thead className="bg-stone-100 text-stone-700 font-semibold" {...props} />,
                          tbody: ({node, ...props}) => <tbody className="divide-y divide-stone-100" {...props} />,
                          tr: ({node, ...props}) => <tr className="hover:bg-stone-50/50 transition-colors" {...props} />,
                          th: ({node, ...props}) => <th className="px-3 py-2 text-left whitespace-nowrap" {...props} />,
                          td: ({node, ...props}) => <td className="px-3 py-2 align-top" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                          strong: ({node, ...props}) => <span className="font-bold text-stone-900" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                  <span className="text-xs text-stone-500 font-medium">Sedang mengetik...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-stone-100 shrink-0 pb-safe"> 
            {/* 'pb-safe' berguna untuk iPhone dengan home bar */}
            <div className="flex w-full gap-2 items-end">
              <Input
                placeholder="Tanya produk, harga, stok..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 focus-visible:ring-stone-900 bg-stone-50 border-stone-200 min-h-[44px]"
                disabled={isLoading}
              />
              <Button 
                size="icon" 
                onClick={handleSend} 
                disabled={isLoading}
                className="bg-stone-900 hover:bg-stone-800 h-11 w-11 shrink-0 rounded-lg transition-transform active:scale-95"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOGGLE BUTTON --- */}
      {/* Disembunyikan saat chat terbuka agar tidak menumpuk di mobile */}
      {!isOpen && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl bg-stone-900 hover:bg-stone-800 hover:scale-105 transition-all duration-300 animate-in zoom-in"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      )}
    </>
  );
}
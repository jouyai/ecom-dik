import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { sendMessageToAI } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // <--- 1. Import plugin tabel

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="w-[400px] h-[500px] shadow-xl mb-4 flex flex-col animate-in fade-in slide-in-from-bottom-5">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-3 px-4 flex flex-row justify-between items-center">
            <CardTitle className="text-sm font-medium">Asisten Belanja</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary-foreground hover:text-white/80"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 text-sm" ref={scrollRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full",
                  msg.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-lg px-3 py-2 overflow-hidden", // Lebarkan sedikit agar tabel muat
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {msg.sender === "user" ? (
                    msg.text
                  ) : (
                    // 2. Styling khusus untuk tabel dan list
                    <div className="text-sm leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} // <--- Aktifkan plugin disini
                        components={{
                          // Kustomisasi tampilan tabel agar sesuai tema
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-2 rounded-md border border-stone-200">
                              <table className="w-full text-xs" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => <thead className="bg-stone-200/50 font-semibold" {...props} />,
                          tbody: ({node, ...props}) => <tbody className="bg-white/50" {...props} />,
                          tr: ({node, ...props}) => <tr className="border-b border-stone-100 last:border-0" {...props} />,
                          th: ({node, ...props}) => <th className="px-3 py-2 text-left" {...props} />,
                          td: ({node, ...props}) => <td className="px-3 py-2 align-top" {...props} />,
                          // Kustomisasi list
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 my-1 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-1 space-y-1" {...props} />,
                          strong: ({node, ...props}) => <span className="font-bold text-stone-900" {...props} />,
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
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-xs text-muted-foreground">Sedang mengetik...</span>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-3 border-t">
            <div className="flex w-full space-x-2">
              <Input
                placeholder="Tanya produk..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="focus-visible:ring-1"
                disabled={isLoading}
              />
              <Button size="icon" onClick={handleSend} disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {!isOpen && (
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg transition-transform hover:scale-110"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
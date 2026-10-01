"use client";

import { useState } from "react";
import { Brain, Send, Mic, MicOff, Loader2, Sparkles, MessageSquare, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  messages: Array<{ id: string; role: string; content: string; citations: any[] }>;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  citations: any[];
  created_at: string;
}

export default function CoachPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  const { data: sessions } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => api.get<ChatSession[]>("/api/v1/chat/sessions"),
  });

  const { data: messages } = useQuery({
    queryKey: ["chat-messages", activeSessionId],
    queryFn: () => api.get<ChatMessage[]>(`/api/v1/chat/sessions/${activeSessionId}/messages`),
    enabled: !!activeSessionId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!activeSessionId) {
        const session = await api.post<ChatSession>("/api/v1/chat/sessions", { title: text.slice(0, 50) });
        setActiveSessionId(session.id);
        return api.post<ChatMessage>(`/api/v1/chat/sessions/${session.id}/messages`, { role: "user", content: text });
      }
      return api.post<ChatMessage>(`/api/v1/chat/sessions/${activeSessionId}/messages`, { role: "user", content: text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    await sendMessageMutation.mutateAsync(text);
    setIsLoading(false);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setShowSessions(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="flex h-16 items-center justify-between border-b border-primary-foreground/10 px-4 bg-primary/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowSessions(!showSessions)}>
            <MessageSquare className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-accent" />
              AI Career Coach
            </h1>
            <p className="text-sm text-muted-foreground">Your personal AI career assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNewChat}>
            <Sparkles className="mr-2 h-4 w-4" />
            New Chat
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsVoiceMode(!isVoiceMode)} className={isVoiceMode ? "bg-accent/10" : ""}>
            {isVoiceMode ? <Mic className="h-5 w-5 text-accent" /> : <MicOff className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {showSessions && (
          <aside className="w-64 border-r border-primary-foreground/10 bg-primary/50 p-4 overflow-y-auto">
            <div className="space-y-2">
              <h3 className="font-medium px-2">Chat History</h3>
              {sessions?.map((session) => (
                <Button
                  key={session.id}
                  variant={activeSessionId === session.id ? "default" : "ghost"}
                  className="w-full justify-start text-left gap-2"
                  onClick={() => { setActiveSessionId(session.id); setShowSessions(false); }}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="truncate">{session.title || "New Chat"}</span>
                </Button>
              ))}
              {!sessions?.length && (
                <p className="text-sm text-muted-foreground px-2">No chats yet</p>
              )}
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden p-4">
            <ScrollArea className="h-full">
              <div className="space-y-6 max-w-3xl mx-auto">
                {!activeSessionId && !messages?.length ? (
                  <div className="text-center py-12">
                    <Brain className="mx-auto h-16 w-16 text-accent/30" />
                    <h2 className="mt-4 text-xl font-bold">How can I help your career?</h2>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                      Ask me anything about resumes, interviews, skill gaps, job search strategies, or career planning.
                    </p>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 max-w-md mx-auto">
                      {[
                        "Review my resume and suggest improvements",
                        "What skills do I need for an AI Engineer role?",
                        "Help me prepare for a technical interview",
                        "Create a 30-day learning plan for me",
                      ].map((suggestion) => (
                        <Button key={suggestion} variant="outline" className="w-full justify-start" onClick={() => { setInputValue(suggestion); handleSend(); }}>
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages?.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "assistant" ? "bg-primary-foreground/5" : "bg-accent text-accent-foreground"}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.citations?.length && (
                          <div className="mt-2 space-y-1">
                            {msg.citations.map((citation: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {citation.source || "Source"}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                <div id="messages-end" />
              </div>
            </ScrollArea>
          </div>

          <div className="border-t border-primary-foreground/10 p-4">
            <div className="flex items-end gap-3 max-w-3xl mx-auto">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder="Ask me anything about your career..."
                className="flex-1 min-h-[50px] max-h-[150px] resize-none"
                disabled={isLoading}
                rows={1}
              />
              <Button onClick={handleSend} disabled={!inputValue.trim() || isLoading} size="lg">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
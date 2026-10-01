"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Volume2, VolumeX, X, Send, Loader2, Brain, MessageSquare, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import * as THREE from "three";

type InterviewState = "connecting" | "listening" | "thinking" | "speaking" | "user_speaking" | "processing" | "ended";

interface InterviewMessage {
  id: string;
  role: "system" | "interviewer" | "user";
  content: string;
  timestamp: string;
  audio_key?: string;
}

interface InterviewSession {
  id: string;
  type: string;
  status: string;
  config: Record<string, any>;
}

const typeLabels: Record<string, string> = {
  hr: "HR",
  technical: "Technical",
  behavioral: "Behavioral",
  resume_based: "Resume Based",
  job_specific: "Job Specific",
  coding: "Coding",
  mixed: "Mixed",
};

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const interviewId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [state, setState] = useState<InterviewState>("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [duration, setDuration] = useState(0);
  const [avatarMode, setAvatarMode] = useState<"3d" | "2d">("3d");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    fetchSession();
    connectWebSocket();

    return () => {
      cleanup();
    };
  }, [interviewId]);

  const fetchSession = async () => {
    try {
      const data = await api.get<InterviewSession>(`/api/v1/interviews/${interviewId}`);
      setSession(data);
      if (data.status === "in_progress" || data.status === "completed") {
        const msgs = await api.get<InterviewMessage[]>(`/api/v1/interviews/${interviewId}/messages`);
        setMessages(msgs);
      }
    } catch (err: any) {
      toast({ title: "Failed to load interview", description: err.message, variant: "destructive" });
      router.push("/interviews");
    }
  };

  const connectWebSocket = () => {
    const wsUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") || "ws://localhost:8000"}/api/v1/interviews/${interviewId}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setState("listening");
      startTimer();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    ws.onclose = () => {
      if (state !== "ended") {
        setState("ended");
        stopTimer();
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      toast({ title: "Connection error", description: "Lost connection to interview server", variant: "destructive" });
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "message":
        setMessages((prev) => [...prev, data.message]);
        if (data.message.role === "interviewer" && data.audio_url) {
          playAudio(data.audio_url);
        }
        break;
      case "state":
        setState(data.state);
        break;
      case "session_update":
        setSession((prev) => prev ? { ...prev, ...data.session } : null);
        break;
      case "transcript":
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "user" && last.content === "") {
            return [...prev.slice(0, -1), { ...last, content: data.text }];
          }
          return [...prev, { id: data.id, role: "user", content: data.text, timestamp: new Date().toISOString() }];
        });
        break;
      case "ended":
        setState("ended");
        stopTimer();
        if (data.session) setSession(data.session);
        break;
      case "error":
        toast({ title: "Error", description: data.message, variant: "destructive" });
        break;
    }
  };

  const playAudio = async (url: string) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start(100);
      setState("user_speaking");
      wsRef.current?.send(JSON.stringify({ type: "start_speaking" }));
    } catch (err) {
      toast({ title: "Microphone error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    wsRef.current?.send(JSON.stringify({ type: "stop_speaking" }));
  };

  const sendAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("session_id", interviewId);

    try {
      await api.upload(`/api/v1/interviews/${interviewId}/audio`, formData);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const sendTextMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    const text = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    try {
      wsRef.current?.send(JSON.stringify({ type: "text_message", text }));
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const endInterview = async () => {
    try {
      wsRef.current?.send(JSON.stringify({ type: "end_interview" }));
      await api.post(`/api/v1/interviews/${interviewId}/end`, {});
      setState("ended");
      stopTimer();
      toast({ title: "Interview ended", description: "Your interview has been completed" });
    } catch (err: any) {
      toast({ title: "Failed to end", description: err.message, variant: "destructive" });
    }
  };

  const cleanup = () => {
    stopTimer();
    wsRef.current?.close();
    mediaRecorderRef.current?.stop();
    audioContextRef.current?.close();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const stateConfig: Record<InterviewState, { label: string; color: string; icon: React.ElementType }> = {
    connecting: { label: "Connecting...", color: "text-amber-500", icon: Loader2 },
    listening: { label: "Listening", color: "text-green-500", icon: MessageSquare },
    thinking: { label: "Thinking...", color: "text-amber-500", icon: Brain },
    speaking: { label: "Speaking", color: "text-blue-500", icon: Volume2 },
    user_speaking: { label: "You're speaking", color: "text-accent", icon: Mic },
    processing: { label: "Processing...", color: "text-amber-500", icon: Loader2 },
    ended: { label: "Ended", color: "text-muted-foreground", icon: X },
  };

  const CurrentStateIcon = stateConfig[state].icon;
  const stateColor = stateConfig[state].color;

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-primary">
      <header className="flex h-16 items-center justify-between border-b border-primary-foreground/10 px-4 bg-primary/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold">{typeLabels[session.type] || session.type} Interview</h1>
            <p className="text-sm text-muted-foreground">{session.job?.title} at {session.job?.company}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${stateColor}`}>
            <CurrentStateIcon className="h-3.5 w-3.5" />
            <span>{stateConfig[state].label}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatDuration(duration)}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden p-4 md:p-6">
            {avatarMode === "3d" ? (
              <InterviewAvatar3D state={state} className="w-full h-full max-w-2xl mx-auto" />
            ) : (
              <InterviewAvatar2D state={state} className="w-full h-full max-w-2xl mx-auto" />
            )}
          </div>

          <div className="border-t border-primary-foreground/10 p-4">
            <ScrollArea className="h-64 max-h-[30vh]">
              <div className="space-y-4 pb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.role === "interviewer"
                          ? "bg-accent/10 text-primary-foreground rounded-bl-sm"
                          : msg.role === "user"
                          ? "bg-accent text-accent-foreground rounded-br-sm"
                          : "bg-primary-foreground/10 text-muted-foreground rounded rounded-bl-sm rounded-br-sm text-center"
                      }`}
                    >
                      {msg.role === "interviewer" && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Brain className="h-3 w-3" />
                          Interviewer
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          <div className="border-t border-primary-foreground/10 p-4">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <Button
                variant={isMuted ? "default" : "outline"}
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button
                variant={state === "user_speaking" ? "destructive" : "default"}
                size="lg"
                className="flex-1"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={["ended", "speaking", "thinking", "processing"].includes(state)}
              >
                {state === "user_speaking" ? (
                  <>
                    <Mic className="mr-2 h-4 w-4 animate-pulse" />
                    Release to send
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Hold to speak
                  </>
                )}
              </Button>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendTextMessage()}
                  placeholder="Type a message..."
                  className="flex-1 h-10 rounded-md border border-primary-foreground/20 bg-primary px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  disabled={state === "ended"}
                />
                <Button size="icon" onClick={sendTextMessage} disabled={!inputValue.trim() || isSending || state === "ended"}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={() => setAvatarMode((prev) => prev === "3d" ? "2d" : "3d")} aria-label="Toggle avatar mode">
                {avatarMode === "3d" ? <Brain className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
              </Button>
              {state !== "ended" && (
                <Button variant="destructive" onClick={endInterview} className="gap-2">
                  <X className="h-4 w-4" />
                  End
                </Button>
              )}
            </div>
          </div>
        </main>

        <aside className="w-80 border-l border-primary-foreground/10 bg-primary/50 p-4 overflow-y-auto">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{typeLabels[session.type] || session.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusConfig[session.status]?.variant || "default"}>
                    {statusConfig[session.status]?.label || session.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-mono font-medium">{formatDuration(duration)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Messages</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          {msg.role === "interviewer" && <Brain className="h-3 w-3" />}
                          {msg.role === "user" && <MessageSquare className="h-3 w-3" />}
                          <span className="capitalize">{msg.role}</span>
                        </div>
                        <p className="text-sm line-clamp-2">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigator.clipboard.writeText(JSON.stringify(messages, null, 2))}>
                  <Download className="h-4 w-4" />
                  Export Transcript
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push(`/interviews/${interviewId}/results`)}>
                  <Brain className="h-4 w-4" />
                  View Results
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InterviewAvatar3D({ state, className }: { state: InterviewState; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 1.6, 3);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00d4ff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.8,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 5;
    }
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      let intensity = 0;

      switch (state) {
        case "speaking":
          intensity = Math.sin(time * 8) * 0.3 + 0.7;
          break;
        case "thinking":
        case "processing":
          intensity = Math.sin(time * 3) * 0.2 + 0.3;
          break;
        case "listening":
          intensity = Math.sin(time * 2) * 0.1 + 0.2;
          break;
        case "user_speaking":
          intensity = Math.sin(time * 10) * 0.4 + 0.5;
          break;
        default:
          intensity = 0.1;
      }

      sphere.scale.setScalar(0.8 + intensity * 0.4);
      material.opacity = 0.5 + intensity * 0.3;
      particles.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current!);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, [state]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-sm text-muted-foreground">
        <p>AI Interviewer</p>
        <p className="text-xs">{stateConfig[state].label}</p>
      </div>
    </div>
  );
}

const stateConfig: Record<InterviewState, { label: string; color: string; icon: React.ElementType }> = {
  connecting: { label: "Connecting...", color: "text-amber-500", icon: Loader2 },
  listening: { label: "Listening", color: "text-green-500", icon: MessageSquare },
  thinking: { label: "Thinking...", color: "text-amber-500", icon: Brain },
  speaking: { label: "Speaking", color: "text-blue-500", icon: Volume2 },
  user_speaking: { label: "You're speaking", color: "text-accent", icon: Mic },
  processing: { label: "Processing...", color: "text-amber-500", icon: Loader2 },
  ended: { label: "Ended", color: "text-muted-foreground", icon: X },
};

function InterviewAvatar2D({ state, className }: { state: InterviewState; className?: string }) {
  const pulseRef = useRef(false);

  useEffect(() => {
    pulseRef.current = ["speaking", "user_speaking"].includes(state);
  }, [state]);

  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <div
        className={`
          relative w-48 h-48 rounded-full bg-gradient-to-br from-accent/20 to-blue-500/20
          border-4 border-accent/30 flex items-center justify-center transition-all duration-300
          ${pulseRef.current ? "animate-pulse ring-4 ring-accent/50" : ""}
        `}
      >
        <Brain className="h-24 w-24 text-accent/50" />
        {state === "speaking" && (
          <div className="absolute -inset-4 rounded-full border-2 border-accent/50 animate-ping" />
        )}
      </div>
      <div className="mt-4 text-center">
        <p className="text-lg font-medium">AI Interviewer</p>
        <p className={stateConfig[state].color}>{stateConfig[state].label}</p>
      </div>
    </div>
  );
}
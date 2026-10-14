import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Image as ImageIcon,
  X,
  Brain,
  RotateCcw,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { NiraAvatar } from './components/NiraAvatar';
import { NanoLiquidVoiceCore } from './components/NanoLiquidVoiceCore';
import { SurveyResponseBubble } from './components/SurveyResponseBubble';
import { UserPromptBubble } from './components/UserPromptBubble';
import { SurveyMemoryModal } from './components/SurveyMemoryModal';
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer';
import { DesignPrismaticGem } from './components/ChatboxDesigns';
import { RealtimeCallModal } from './components/RealtimeCallModal';
import { LivingConceptSelectorModal } from './components/LivingConceptSelectorModal';
import { useLivingConcept } from './context/LivingConceptContext';
import { LIVING_CONCEPTS } from './types/livingConcepts';
import { useRealtimeCall } from './hooks/useRealtimeCall';
import { ChatSession, STORAGE_KEY_SESSIONS, STORAGE_KEY_ACTIVE_ID } from './types/chat';

interface Message {
  id: string;
  sender: 'user' | 'nira';
  content: string;
  image?: {
    data: string;
    mimeType: string;
  } | null;
  timestamp: string;
  isError?: boolean;
}

// Stable, consistent clean light-theme crystal palette (never changes across messages)
const STABLE_LIGHT_THEME = {
  bgRadial: 'radial-gradient(circle at 50% 10%, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)',
  orb1: 'radial-gradient(circle, rgba(254, 205, 211, 0.35) 0%, rgba(255, 228, 230, 0.08) 50%, transparent 75%)',
  orb2: 'radial-gradient(circle, rgba(254, 243, 199, 0.3) 0%, rgba(253, 230, 138, 0.06) 50%, transparent 75%)',
  orb3: 'radial-gradient(circle, rgba(224, 231, 255, 0.3) 0%, rgba(219, 234, 254, 0.06) 50%, transparent 80%)',
  brandGradient: 'from-rose-600 via-rose-500 to-amber-600',
};

// Helper to extract user-declared personal facts from chat
function detectAndStoreUserFacts(
  text: string,
  setPersona: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  const lower = text.toLowerCase();
  const updates: Record<string, string> = {};

  const ageMatch = lower.match(/(?:age|boyos|boiyos|বছর|বয়স)\s*(?:is|hoche|hobe|holo|:|হলো|হচ্ছে|=|—|-)?\s*(\d{1,2})/i) ||
                   lower.match(/(\d{1,2})\s*(?:years old|bochor|বছর)/i);
  if (ageMatch && ageMatch[1]) {
    const ageNum = parseInt(ageMatch[1], 10);
    if (ageNum >= 13 && ageNum <= 100) {
      updates['Age'] = `${ageNum}`;
    }
  }

  if (lower.includes('self-employed') || lower.includes('self employed')) {
    updates['Employment Status'] = 'Self-employed';
  } else if (lower.includes('ami student') || lower.includes('i am a student') || lower.includes('am a student')) {
    updates['Employment Status'] = 'Student';
  } else if (lower.includes('employed full') || lower.includes('full time job') || lower.includes('full-time')) {
    updates['Employment Status'] = 'Employed full-time';
  } else if (lower.includes('employed part') || lower.includes('part-time job')) {
    updates['Employment Status'] = 'Employed part-time';
  } else if (lower.includes('unemployed') || lower.includes('chakri nai')) {
    updates['Employment Status'] = 'Unemployed';
  }

  if (lower.includes('iphone') || lower.includes('ios')) {
    updates['Smartphone'] = 'Apple iPhone (iOS)';
  } else if (lower.includes('android') || lower.includes('samsung') || lower.includes('xiaomi') || lower.includes('pixel')) {
    updates['Smartphone'] = 'Android';
  }

  if (lower.includes('ami male') || lower.includes('i am male') || lower.includes('gender male')) {
    updates['Gender'] = 'Male';
  } else if (lower.includes('ami female') || lower.includes('i am female') || lower.includes('gender female')) {
    updates['Gender'] = 'Female';
  }

  if (Object.keys(updates).length > 0) {
    setPersona((prev) => ({ ...prev, ...updates }));
  }
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const storedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (storedId) return storedId;
    } catch {}
    return `session-${Date.now()}`;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);

  const [attachedImage, setAttachedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  // User-Controlled Survey Profile & Session Memory (strictly empty by default)
  const [persona, setPersona] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('nira_user_persona_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  const [surveyHistory, setSurveyHistory] = useState<
    Array<{ question: string; answer: string; timestamp: string }>
  >([]);

  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const { concept, setIsSelectorOpen } = useLivingConcept();
  const activeConceptMeta = useMemo(
    () => LIVING_CONCEPTS.find((c) => c.id === concept) || LIVING_CONCEPTS[0],
    [concept]
  );

  // Unified conversation context for Realtime Call System
  const callContextHistory = useMemo(() => {
    return messages.slice(-6).map((m) => ({
      question: m.sender === 'user' ? m.content : '',
      answer: m.sender === 'nira' ? m.content : '',
    }));
  }, [messages]);

  const handleCallTurnComplete = useCallback((userText: string, niraText: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-call-${Date.now()}`,
        sender: 'user',
        content: `🎙️ ${userText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `nira-call-${Date.now() + 1}`,
        sender: 'nira',
        content: niraText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setHasStarted(true);
  }, []);

  const callSystem = useRealtimeCall({
    history: callContextHistory,
    persona,
    onTurnComplete: handleCallTurnComplete,
  });

  const handleOpenCall = useCallback(() => {
    setIsCallOpen(true);
    callSystem.startCall();
  }, [callSystem]);

  const handleCloseCall = useCallback(() => {
    callSystem.endCall();
    setIsCallOpen(false);
  }, [callSystem]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentPalette = STABLE_LIGHT_THEME;

  // Save persona whenever user updates it
  useEffect(() => {
    try {
      localStorage.setItem('nira_user_persona_v1', JSON.stringify(persona));
    } catch {}
  }, [persona]);

  // Load active session from storage on mount
  useEffect(() => {
    if (sessions.length > 0) {
      const active = sessions.find((s) => s.id === activeSessionId);
      if (active && active.messages.length > 0) {
        setMessages(active.messages as Message[]);
        setSurveyHistory(active.surveyHistory || []);
        setHasStarted(true);
      }
    }
  }, []);

  // Save session when messages or history change
  useEffect(() => {
    if (messages.length === 0) return;

    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === activeSessionId);
      const title =
        existingIdx >= 0 && prev[existingIdx].title
          ? prev[existingIdx].title
          : messages[0]?.content.slice(0, 36) || 'Survey Session';

      const updatedSession: ChatSession = {
        id: activeSessionId,
        title,
        createdAt: existingIdx >= 0 ? prev[existingIdx].createdAt : Date.now(),
        updatedAt: Date.now(),
        messages: messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          image: m.image,
          timestamp: m.timestamp,
        })),
        surveyHistory,
      };

      let newSessions: ChatSession[];
      if (existingIdx >= 0) {
        newSessions = [...prev];
        newSessions[existingIdx] = updatedSession;
      } else {
        newSessions = [updatedSession, ...prev];
      }

      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(newSessions));
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeSessionId);
      } catch {}

      return newSessions;
    });
  }, [messages, surveyHistory, activeSessionId]);

  // Prevent accidental unload during active streaming turn
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStreaming) {
        e.preventDefault();
        e.returnValue = 'Ei chat ta refresh korle current progress harate pare. Continue?';
        setShowRefreshWarning(true);
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isStreaming]);

  // Auto-scroll on new messages or during live streaming without animation lag
  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (hasStarted) {
      scrollToBottom(isStreaming);
    }
  }, [messages, streamingContent, hasStarted, isStreaming]);

  // Support Ctrl+V paste of screenshots anywhere
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1];
      setAttachedImage({
        data: base64Data,
        mimeType: file.type,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Start a fresh chat session without deleting existing ones
  const handleNewChat = useCallback(() => {
    const newId = `session-${Date.now()}`;
    setActiveSessionId(newId);
    setMessages([]);
    setSurveyHistory([]);
    setHasStarted(false);
    setStreamingContent('');
    setIsStreaming(false);
    setLastFailedPrompt(null);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, newId);
    } catch {}
  }, []);

  // Switch to an existing chat session
  const handleSelectSession = useCallback(
    (id: string) => {
      const target = sessions.find((s) => s.id === id);
      if (target) {
        setActiveSessionId(id);
        setMessages(target.messages as Message[]);
        setSurveyHistory(target.surveyHistory || []);
        setHasStarted(true);
        setStreamingContent('');
        setIsStreaming(false);
        try {
          localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
        } catch {}
      }
    },
    [sessions]
  );

  // Delete a session
  const handleDeleteSession = useCallback(
    (id: string) => {
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(remaining));
      } catch {}
      if (id === activeSessionId) {
        handleNewChat();
      }
    },
    [sessions, activeSessionId, handleNewChat]
  );

  // Submit question with instant micro-neural visual and parallel streaming
  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt !== undefined ? overridePrompt : inputPrompt).trim();
    if (!promptToSend && !attachedImage) return;
    if (isStreaming) return;

    setLastFailedPrompt(null);

    // Sync any user-declared facts in real time
    detectAndStoreUserFacts(promptToSend, setPersona);

    if (!hasStarted) {
      setHasStarted(true);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: promptToSend,
      image: attachedImage
        ? {
            data: attachedImage.data,
            mimeType: attachedImage.mimeType,
          }
        : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    const currentAttachedImage = attachedImage;
    setAttachedImage(null);

    // Response begins streaming IMMEDIATELY without any waiting or intermediate animation
    setIsStreaming(true);
    setStreamingContent('');

    let accumulated = '';

    try {
      const res = await fetch('/api/nira/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          image: currentAttachedImage
            ? {
                data: currentAttachedImage.data,
                mimeType: currentAttachedImage.mimeType,
              }
            : null,
          history: surveyHistory,
          persona: persona,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                if (data.text) {
                  accumulated += data.text;
                  setStreamingContent(accumulated);
                } else if (data.message && !accumulated) {
                  accumulated = data.message;
                  setStreamingContent(accumulated);
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }
        }
      }

      const finalContent = accumulated || 'কোনো উত্তর পাওয়া যায়নি। তুমি আবার প্রশ্নটি পাঠাতে পারো।';
      setMessages((prev) => [
        ...prev,
        {
          id: `nira-${Date.now()}`,
          sender: 'nira',
          content: finalContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      setSurveyHistory((prev) => [
        ...prev,
        {
          question: promptToSend || '[Survey Screenshot Analysis]',
          answer: finalContent.split('\n')[0] || finalContent.slice(0, 80),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('Stream error:', err);
      setLastFailedPrompt(promptToSend);

      const recoveredContent = accumulated
        ? `${accumulated}\n\n*[কানেকশন বিচ্ছিন্ন হয়েছে—পুনরায় চেষ্টা করতে নিচের বাটনে চাপ দাও]*`
        : 'কানেকশনে সাময়িক সমস্যা হয়েছে। তুমি চাইলে আবার প্রশ্নটি পাঠাতে পারো।';

      setMessages((prev) => [
        ...prev,
        {
          id: `nira-err-${Date.now()}`,
          sender: 'nira',
          content: recoveredContent,
          timestamp: 'Just now',
          isError: true,
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="relative min-h-screen w-full max-w-full overflow-x-hidden flex flex-col text-slate-900 select-text liquid-bg-transition"
      style={{ background: currentPalette.bgRadial }}
    >
      {/* Dynamic Animated Liquid Mesh Background with Fluid Color Transitions */}
      <div className="liquid-bg-mesh">
        <div
          className="prismatic-orb-1 liquid-orb-transition"
          style={{ background: currentPalette.orb1 }}
        />
        <div
          className="prismatic-orb-2 liquid-orb-transition"
          style={{ background: currentPalette.orb2 }}
        />
        <div
          className="prismatic-orb-3 liquid-orb-transition"
          style={{ background: currentPalette.orb3 }}
        />
      </div>

      {/* Top Header - Ultra-compact, elegant, spacious mobile header */}
      <header className="sticky top-0 z-30 w-full px-3 sm:px-6 py-2 sm:py-2.5 bg-white/80 backdrop-blur-2xl border-b border-slate-200/70 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Compact Branding: NIRA / By Emran Mahmud */}
          <div className="flex items-center gap-2">
            <NiraAvatar size="sm" isStreaming={isStreaming} />
            <div className="flex flex-col">
              <span
                className={`font-black text-sm sm:text-base tracking-tight bg-gradient-to-r ${currentPalette.brandGradient} bg-clip-text text-transparent leading-tight`}
              >
                NIRA
              </span>
              <span className="text-[9px] font-semibold text-slate-400 tracking-wider leading-none">
                By Emran Mahmud
              </span>
            </div>
          </div>

          {/* Clean Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Realtime Voice Call Button */}
            <button
              onClick={handleOpenCall}
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 shadow-xs hover:shadow-sm active:scale-95 group"
              title="Start Realtime Voice Call with NIRA"
            >
              <PhoneCall className="w-3.5 h-3.5 text-white" />
              <span>Call</span>
            </button>

            {/* Living AI Concept Switcher Button */}
            <button
              onClick={() => setIsSelectorOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1 shadow-2xs"
              title="Choose Living AI Concept (6 options)"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden sm:inline text-xs">Concept</span>
            </button>

            {/* Chat History Button */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1 shadow-2xs"
              title="View Chat History"
            >
              <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline text-xs">Chats</span>
              {sessions.length > 0 && (
                <span className="hidden sm:inline-block px-1 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                  {sessions.length}
                </span>
              )}
            </button>

            {/* Survey Profile & Memory Button */}
            <button
              onClick={() => setIsMemoryOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1 shadow-2xs"
              title="View your confirmed survey facts"
            >
              <Brain className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline text-xs">Profile</span>
              <span className="px-1 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold">
                {Object.keys(persona).length}
              </span>
            </button>

            {/* Start Fresh Chat */}
            <button
              onClick={handleNewChat}
              className="p-1.5 sm:p-2 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 text-slate-400 hover:text-rose-600 transition-all shadow-2xs"
              title="Start New Chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 pb-40">
        {/* Coordinated Center Intro with Fluid Upward Transformation */}
        <div
          className={`select-none text-center transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            hasStarted
              ? 'translate-y-0 scale-95 opacity-80 pt-2 pb-1'
              : 'translate-y-[14vh] sm:translate-y-[17vh] scale-100 opacity-100 py-6 flex flex-col items-center'
          }`}
        >
          {/* Master Aurora Thread Living Entity on Opening Screen */}
          {!hasStarted && (
            <div className="mb-3 relative inline-flex flex-col items-center justify-center">
              <NanoLiquidVoiceCore
                state="idle"
                size={88}
              />
              <button
                onClick={() => setIsSelectorOpen(true)}
                className="mt-2.5 px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 text-[10px] sm:text-[11px] font-semibold text-slate-500 hover:text-cyan-600 transition-all shadow-2xs flex items-center gap-1 active:scale-95"
                title="Tap to switch between 6 Aurora Thread variations"
              >
                <Sparkles className="w-2.5 h-2.5 text-cyan-600" />
                <span>Concept: {activeConceptMeta.name} • Tap to switch</span>
              </button>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-rose-700 bg-clip-text text-transparent">
            Ami NIRA
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1.5 tracking-wide">
            Your Survey AI Assistant
          </p>
        </div>

        {/* Message Thread */}
        <div className={`space-y-1 transition-opacity duration-500 ${hasStarted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {messages.map((msg) =>
            msg.sender === 'user' ? (
              <UserPromptBubble
                key={msg.id}
                content={msg.content}
                image={msg.image}
                timestamp={msg.timestamp}
              />
            ) : (
              <div key={msg.id} className="relative">
                <SurveyResponseBubble
                  id={msg.id}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
                {msg.isError && lastFailedPrompt && (
                  <div className="pl-14 -mt-2 mb-3">
                    <button
                      onClick={() => handleSend(lastFailedPrompt)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <RefreshCw className="w-3 h-3" /> আবার চেষ্টা করো
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Direct Real-Time Streaming Output (mounts immediately upon send, zero artificial delays) */}
          {isStreaming && (
            <SurveyResponseBubble
              id="live-stream"
              content={streamingContent}
              isStreaming={true}
              timestamp=""
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Floating Modern iOS 27 Liquid Glass Input Area */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-2.5 sm:p-4 pb-4 sm:pb-6 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          {/* Quick Info Bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 mb-2 text-[11px] text-slate-400 font-medium">
            <span className="hidden sm:inline">NIRA Intelligent Assist</span>
            <span className="ml-auto sm:ml-0">Ctrl+V to paste screenshot</span>
          </div>

          {/* Hidden File Input for Image Attachments */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Permanent 5 Prismatic Gem Liquid Glass Chatbox */}
          <DesignPrismaticGem
            inputPrompt={inputPrompt}
            setInputPrompt={setInputPrompt}
            onSend={() => handleSend()}
            onKeyDown={handleKeyDown}
            onAttachClick={() => fileInputRef.current?.click()}
            attachedImage={attachedImage}
            onRemoveImage={() => setAttachedImage(null)}
            isStreaming={isStreaming}
            inputRef={inputRef}
          />
        </div>
      </div>

      {/* Chat History Slide-Over Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* User-Controlled Survey Profile & Memory Modal */}
      <SurveyMemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        persona={persona}
        onUpdatePersona={setPersona}
        history={surveyHistory}
        onClearMemory={() => setSurveyHistory([])}
      />

      {/* Realtime Call Modal with Nano Liquid Voice Core */}
      <RealtimeCallModal
        isOpen={isCallOpen}
        onClose={handleCloseCall}
        state={callSystem.state}
        isMuted={callSystem.isMuted}
        isSpeakerMuted={callSystem.isSpeakerMuted}
        audioLevel={callSystem.audioLevel}
        errorMsg={callSystem.errorMsg}
        analyserNode={callSystem.analyserNode}
        onEndCall={handleCloseCall}
        onToggleMute={callSystem.toggleMute}
        onToggleSpeaker={callSystem.toggleSpeaker}
        onRetry={() => callSystem.startCall()}
      />

      {/* Living AI Concept Selector Modal */}
      <LivingConceptSelectorModal />

      {/* Liquid Refresh Warning Dialog */}
      {showRefreshWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm w-full p-5 rounded-3xl dark-liquid-glass border border-rose-500/30 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-sm font-semibold text-white">
              Ei chat ta refresh korle current progress harate pare. Continue?
            </h3>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowRefreshWarning(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-xs font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

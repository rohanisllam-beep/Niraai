import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Brain,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { AraanEntity, EntityState, setEntityThemePalette } from './components/AraanEntity';
import { AraanCapsuleDock } from './components/AraanCapsuleDock';
import { SurveyResponseBubble } from './components/SurveyResponseBubble';
import { UserPromptBubble } from './components/UserPromptBubble';
import { SurveyMemoryModal } from './components/SurveyMemoryModal';
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer';
import { RealtimeCallModal } from './components/RealtimeCallModal';
import { useRealtimeCall } from './hooks/useRealtimeCall';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  ARAAN_THEMES,
  DEFAULT_THEME_ID,
  getThemeStyles,
  getThemeById,
  AraanTheme,
} from './theme/araanThemes';
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

// Automatically detect declared facts from user prompts to keep survey profile aligned
function detectAndStoreUserFacts(
  text: string,
  setPersona: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  const lower = text.toLowerCase();
  const updates: Record<string, string> = {};

  const ageMatch =
    lower.match(/(?:age|boyos|boiyos|বছর|বয়স)\s*(?:is|hoche|hobe|holo|:|হলো|হচ্ছে|=|—|-)?\s*(\d{1,2})/i) ||
    lower.match(/(\d{1,2})\s*(?:years old|bochor|বছর)/i);
  if (ageMatch && ageMatch[1]) {
    const ageNum = parseInt(ageMatch[1], 10);
    if (ageNum >= 13 && ageNum <= 100) {
      updates['Age'] = `${ageNum}`;
    }
  }

  if (lower.includes('self-employed') || lower.includes('self employed')) {
    updates['Employment Status'] = 'Self-employed';
  } else if (
    lower.includes('ami student') ||
    lower.includes('i am a student') ||
    lower.includes('am a student')
  ) {
    updates['Employment Status'] = 'Student';
  } else if (
    lower.includes('employed full') ||
    lower.includes('full time job') ||
    lower.includes('full-time')
  ) {
    updates['Employment Status'] = 'Employed full-time';
  } else if (
    lower.includes('employed part') ||
    lower.includes('part-time job')
  ) {
    updates['Employment Status'] = 'Employed part-time';
  } else if (lower.includes('unemployed') || lower.includes('chakri nai')) {
    updates['Employment Status'] = 'Unemployed';
  }

  if (lower.includes('iphone') || lower.includes('ios')) {
    updates['Smartphone'] = 'Apple iPhone (iOS)';
  } else if (
    lower.includes('android') ||
    lower.includes('samsung') ||
    lower.includes('xiaomi') ||
    lower.includes('pixel')
  ) {
    updates['Smartphone'] = 'Android';
  }

  if (
    lower.includes('ami male') ||
    lower.includes('i am male') ||
    lower.includes('gender male')
  ) {
    updates['Gender'] = 'Male';
  } else if (
    lower.includes('ami female') ||
    lower.includes('i am female') ||
    lower.includes('gender female')
  ) {
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

  // User-Controlled Survey Profile & Session Memory
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
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  // Active theme (Arctic Silver by default - charcoal & icy silver)
  const [activeThemeId] = useState<string>(DEFAULT_THEME_ID);
  const activeTheme = useMemo<AraanTheme>(() => getThemeById(activeThemeId), [activeThemeId]);
  const themeStyles = useMemo(() => getThemeStyles(activeTheme), [activeTheme]);

  // PWA mobile installation hook
  const pwa = usePWAInstall();

  // Set entity theme palette to Arctic Silver
  useEffect(() => {
    setEntityThemePalette(activeTheme.pal);
  }, [activeTheme]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioLevelRef = useRef<number>(0);

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

  // Save persona whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('nira_user_persona_v1', JSON.stringify(persona));
    } catch {}
  }, [persona]);

  // Load session on startup
  useEffect(() => {
    if (sessions.length > 0) {
      const active = sessions.find((s) => s.id === activeSessionId);
      if (active && active.messages.length > 0) {
        setMessages(active.messages);
        setSurveyHistory(active.surveyHistory || []);
        setHasStarted(true);
      }
    }
  }, []);

  // Save active session whenever messages change
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

  // Beforeunload warning if active stream
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

  // Auto-scroll
  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (hasStarted) {
      scrollToBottom(isStreaming);
    }
  }, [messages, streamingContent, hasStarted, isStreaming]);

  // Clipboard image paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64Data = result.split(',')[1];
      setAttachedImage({
        data: base64Data,
        mimeType: file.type,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

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

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      const sess = sessions.find((s) => s.id === sessionId);
      if (sess) {
        setActiveSessionId(sessionId);
        setMessages(sess.messages);
        setSurveyHistory(sess.surveyHistory || []);
        setHasStarted(true);
        setStreamingContent('');
        setIsStreaming(false);
        try {
          localStorage.setItem(STORAGE_KEY_ACTIVE_ID, sessionId);
        } catch {}
      }
    },
    [sessions]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      const next = sessions.filter((s) => s.id !== sessionId);
      setSessions(next);
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(next));
      } catch {}
      if (sessionId === activeSessionId) {
        handleNewChat();
      }
    },
    [sessions, activeSessionId, handleNewChat]
  );

  // Send message or survey screenshot
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend !== undefined ? textToSend : inputPrompt).trim();
    if ((!prompt && !attachedImage) || isStreaming) return;

    setLastFailedPrompt(null);
    detectAndStoreUserFacts(prompt, setPersona);

    if (!hasStarted) {
      setHasStarted(true);
    }

    const newUserMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: prompt,
      image: attachedImage
        ? { data: attachedImage.data, mimeType: attachedImage.mimeType }
        : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputPrompt('');

    const currentImg = attachedImage;
    setAttachedImage(null);

    setIsStreaming(true);
    setStreamingContent('');

    let accumulatedText = '';

    try {
      const response = await fetch('/api/nira/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          image: currentImg ? { data: currentImg.data, mimeType: currentImg.mimeType } : null,
          history: surveyHistory,
          persona,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
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
                  accumulatedText += data.text;
                  audioLevelRef.current = Math.min(1, 0.3 + String(data.text).length / 40);
                  setStreamingContent(accumulatedText);
                } else if (data.chunk) {
                  accumulatedText += data.chunk;
                  audioLevelRef.current = Math.min(1, 0.3 + String(data.chunk).length / 40);
                  setStreamingContent(accumulatedText);
                } else if (data.message && !accumulatedText) {
                  accumulatedText = data.message;
                  setStreamingContent(accumulatedText);
                }
              } catch {}
            }
          }
        }
      }

      const finalContent =
        accumulatedText ||
        'কোনো উত্তর পাওয়া যায়নি। তুমি আবার প্রশ্নটি পাঠাতে পারো।';

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
          question: prompt || '[Survey Screenshot Analysis]',
          answer: finalContent.split('\n')[0] || finalContent.slice(0, 80),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('Stream error:', err);
      setLastFailedPrompt(prompt);

      const errContent = accumulatedText
        ? `${accumulatedText}\n\n*[কানেকশন বিচ্ছিন্ন হয়েছে—পুনরায় চেষ্টা করতে নিচের বাটনে চাপ দাও]*`
        : 'কানেকশনে সাময়িক সমস্যা হয়েছে। তুমি চাইলে আবার প্রশ্নটি পাঠাতে পারো।';

      setMessages((prev) => [
        ...prev,
        {
          id: `nira-err-${Date.now()}`,
          sender: 'nira',
          content: errContent,
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
      handleSendMessage();
    }
  };

  // Entity state mapping
  const isThinking = isStreaming && !streamingContent;
  const entityState: EntityState = isCallOpen
    ? 'idle'
    : isStreaming
    ? streamingContent
      ? 'nira-speaking'
      : 'thinking'
    : inputPrompt.trim()
    ? 'composing'
    : 'idle';

  return (
    <div className="araan-root select-text" style={themeStyles}>
      {/* Ambient Rising Radial Glow */}
      <div className="araan-glow" aria-hidden="true" />

      {/* Main Viewport Column */}
      <div className="araan-col">
        {/* Top Header Tools */}
        <div className="araan-tools">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="araan-icon-btn relative"
            aria-label="Chat history"
            title="Chats"
          >
            <MessageSquare className="w-[18px] h-[18px]" />
            {sessions.length > 0 && (
              <span className="araan-badge">{sessions.length}</span>
            )}
          </button>

          <button
            onClick={() => setIsMemoryOpen(true)}
            className="araan-icon-btn relative"
            aria-label="Survey profile"
            title="Profile"
          >
            <Brain className="w-[18px] h-[18px]" />
            {Object.keys(persona).length > 0 && (
              <span className="araan-badge">{Object.keys(persona).length}</span>
            )}
          </button>

          {pwa.isInstallable && (
            <button
              onClick={pwa.install}
              className="araan-icon-btn"
              aria-label="Install app on device"
              title="Install app on phone"
            >
              <Download className="w-[18px] h-[18px]" />
            </button>
          )}

          {pwa.isIOS && !pwa.isInstalled && (
            <button
              onClick={() => setShowIOSInstallGuide(true)}
              className="araan-icon-btn"
              aria-label="Install on iPhone"
              title="Install on iPhone"
            >
              <Download className="w-[18px] h-[18px]" />
            </button>
          )}

          <button
            onClick={handleNewChat}
            className="araan-icon-btn"
            aria-label="Start new chat"
            title="New chat"
          >
            <RotateCcw className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Living Animated Entity */}
        <div className={`araan-entity ${hasStarted ? 'is-compact' : ''}`}>
          <AraanEntity
            state={entityState}
            levelRef={audioLevelRef}
            size={230}
            paused={isCallOpen}
          />
        </div>

        {/* Hero Greeting (visible when chat hasn't started) */}
        <div className={`araan-hero ${hasStarted ? 'is-gone' : ''}`}>
          <p className="araan-name">Araan</p>
          <h1 className="araan-title">How can I help you today?</h1>
        </div>

        {/* Message Thread (visible when chat has started) */}
        <main className={`araan-thread ${hasStarted ? 'is-on' : ''}`}>
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
                  <div className="-mt-2 mb-3">
                    <button
                      onClick={() => handleSendMessage(lastFailedPrompt)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-violet-100 text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> আবার চেষ্টা করো
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {isStreaming && streamingContent && (
            <SurveyResponseBubble
              id="live-stream"
              content={streamingContent}
              isStreaming={true}
              timestamp=""
            />
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Floating Capsule Dock */}
        <div className="araan-dock">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            className="hidden"
          />

          <AraanCapsuleDock
            inputPrompt={inputPrompt}
            setInputPrompt={setInputPrompt}
            onSend={() => handleSendMessage()}
            onKeyDown={handleKeyDown}
            onAttachClick={() => fileInputRef.current?.click()}
            onVoiceClick={handleOpenCall}
            attachedImage={attachedImage}
            onRemoveImage={() => setAttachedImage(null)}
            isStreaming={isStreaming}
            isThinking={isThinking}
            inputRef={inputRef}
          />
        </div>
      </div>

      {/* History Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Survey Profile & Memory Vault Modal */}
      <SurveyMemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        persona={persona}
        onUpdatePersona={setPersona}
        history={surveyHistory}
        onClearMemory={() => setSurveyHistory([])}
      />

      {/* Realtime Live Voice Call Modal */}
      <RealtimeCallModal
        isOpen={isCallOpen}
        onClose={handleCloseCall}
        state={callSystem.state}
        isMuted={callSystem.isMuted}
        isSpeakerMuted={callSystem.isSpeakerMuted}
        audioLevel={callSystem.audioLevel}
        errorMsg={callSystem.errorMsg}
        analyserNode={callSystem.analyserNode}
        theme={activeTheme}
        onEndCall={handleCloseCall}
        onToggleMute={callSystem.toggleMute}
        onToggleSpeaker={callSystem.toggleSpeaker}
        onRetry={() => callSystem.startCall()}
      />

      {/* Refresh Warning Modal */}
      {showRefreshWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm w-full p-5 rounded-3xl dark-liquid-glass border border-violet-400/30 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-200 mx-auto" />
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
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-700 text-xs font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm w-full p-5 rounded-3xl dark-liquid-glass border border-violet-400/30 text-center space-y-3">
            <h3 className="text-base font-semibold text-white">Install Araan on iPhone / iPad</h3>
            <p className="text-xs text-slate-300 text-left leading-relaxed">
              1. Tap the <strong>Share</strong> button in the Safari toolbar.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Tap <strong>Add</strong> at the top right to install.
            </p>
            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="mt-2 w-full px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-700 text-xs font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

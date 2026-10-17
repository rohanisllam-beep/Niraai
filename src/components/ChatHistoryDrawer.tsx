import React from 'react';
import { X, MessageSquare, Plus, Trash2, Clock } from 'lucide-react';
import { ChatSession } from '../types/chat';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm h-full flex flex-col dark-liquid-glass border-r border-violet-500/20 shadow-2xl overflow-hidden text-slate-200">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent pointer-events-none" />

        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-violet-500/15 text-violet-300 border border-violet-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                Chat History
              </h2>
              <p className="text-[11px] text-slate-400">
                Saved conversations & context
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-700 hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-violet-500/30 shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Start New Chat
          </button>
        </div>

        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 space-y-1">
              <Clock className="w-5 h-5 text-slate-500 mx-auto mb-2 opacity-60" />
              <p className="font-medium text-slate-300">No saved chats yet</p>
              <p className="text-[11px] text-slate-500">
                Your survey sessions are automatically saved here so you can revisit them anytime.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const dateStr = new Date(session.updatedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group relative flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-violet-500/15 border-violet-500/40 text-white shadow-sm'
                      : 'bg-black/35 hover:bg-black/60 border-white/[0.05] hover:border-violet-500/20 text-slate-300'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-medium truncate">
                      {session.title || 'Untitled Survey'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>{session.messages.length} messages</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-violet-500/20 hover:text-violet-300 transition-all text-slate-400"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3.5 border-t border-white/[0.08] bg-black/40 text-center">
          <p className="text-[10px] text-slate-500">
            Araan preserves context automatically across reloads.
          </p>
        </div>
      </div>
    </div>
  );
};

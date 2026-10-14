import React, { useState } from 'react';
import { X, Brain, Trash2, Plus, Sparkles, CheckCircle2, History, AlertCircle, UserCheck } from 'lucide-react';
import { PROFILE_CATEGORIES } from '../types/profile';

interface SurveyMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Record<string, string>;
  onUpdatePersona: (persona: Record<string, string>) => void;
  history: Array<{ question: string; answer: string; timestamp: string }>;
  onClearMemory: () => void;
}

export const SurveyMemoryModal: React.FC<SurveyMemoryModalProps> = ({
  isOpen,
  onClose,
  persona,
  onUpdatePersona,
  history,
  onClearMemory,
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'custom' | 'history'>('profile');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    onUpdatePersona({
      ...persona,
      [newKey.trim()]: newValue.trim(),
    });
    setNewKey('');
    setNewValue('');
  };

  const handleUpdateField = (label: string, val: string) => {
    const next = { ...persona };
    if (!val.trim()) {
      delete next[label];
    } else {
      next[label] = val.trim();
    }
    onUpdatePersona(next);
  };

  const handleDeleteFact = (key: string) => {
    const next = { ...persona };
    delete next[key];
    onUpdatePersona(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl dark-liquid-glass border border-rose-500/20 shadow-2xl overflow-hidden text-slate-200">
        {/* Top Liquid Highlight */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                Survey Profile & Memory Vault
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                  User Controlled
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Your real facts for genuine router audience matching. Never guessed or faked.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.08] px-5 pt-3 bg-white/[0.01] gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Survey Profile ({Object.keys(persona).length} set)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'custom'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Custom Facts
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Session Answers ({history.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'profile' ? (
            /* Standard Survey Profile Categories */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <p className="text-xs text-slate-400">
                  Fill in whichever fields apply to you. Fields left blank remain strictly <span className="text-slate-300 font-medium">Not provided</span>.
                </p>
                {Object.keys(persona).length > 0 && (
                  <button
                    onClick={() => onUpdatePersona({})}
                    className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {PROFILE_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className="rounded-2xl bg-black/40 border border-white/[0.07] p-3.5 space-y-3"
                >
                  <h3 className="text-xs font-semibold text-rose-200/90 tracking-wide uppercase">
                    {category.title}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {category.fields.map((field) => {
                      const val = persona[field.label] || '';
                      return (
                        <div key={field.key} className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                            <span>{field.label}</span>
                            {!val && (
                              <span className="text-[10px] text-slate-500 italic">
                                Not provided
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            placeholder={field.placeholder}
                            value={val}
                            onChange={(e) => handleUpdateField(field.label, e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'custom' ? (
            /* Custom Facts Tab */
            <>
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Add Any Custom Survey Detail:
                </span>
                <form onSubmit={handleAddFact} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Field name (e.g. Pet, Primary Bank, Car Make)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Golden Retriever, Chase, Toyota)"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!newKey.trim() || !newValue.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-35 shadow-sm flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save
                  </button>
                </form>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-300">
                  Confirmed Facts ({Object.keys(persona).length})
                </span>

                {Object.keys(persona).length === 0 ? (
                  <div className="p-6 rounded-2xl bg-black/40 border border-dashed border-white/10 text-center space-y-1.5">
                    <AlertCircle className="w-5 h-5 text-rose-400/60 mx-auto" />
                    <p className="text-xs font-medium text-slate-300">No personal facts stored</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      NIRA never guesses your details. As you provide information in chat or fill out the Survey Profile tab, NIRA references it here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(persona).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between p-3 rounded-2xl bg-black/50 border border-rose-500/15 text-xs shadow-xs hover:border-rose-500/30 transition-all"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span className="font-semibold text-rose-200/90 whitespace-nowrap">
                            {k}:
                          </span>
                          <span className="text-slate-300 truncate">{v}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteFact(k)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors ml-2"
                          title="Delete detail"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Survey Answers ({history.length})
                </span>
                {history.length > 0 && (
                  <button
                    onClick={onClearMemory}
                    className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Reset History
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="p-6 rounded-2xl bg-black/40 border border-dashed border-white/10 text-center text-xs text-slate-400">
                  No survey questions recorded yet in this session.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-black/50 border border-rose-500/15 text-xs space-y-2 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-200">
                          Q{idx + 1}: {item.question}
                        </span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {item.timestamp}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 font-medium font-bangla">
                        Answer: {item.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/40 flex justify-between items-center">
          <p className="text-[11px] text-slate-500">
            Profile & answers are stored locally on your device.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:opacity-95 text-white text-xs font-semibold transition-all border border-rose-500/30 shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

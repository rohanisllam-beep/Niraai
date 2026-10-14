import React, { useState } from 'react';
import { NiraAvatar } from './NiraAvatar';
import { Copy, Check, ShieldAlert } from 'lucide-react';

interface SurveyResponseBubbleProps {
  id?: string;
  content: string;
  isStreaming?: boolean;
  timestamp?: string;
}

interface QuestionSection {
  number: string;
  questionLabel: string;
  answerText: string;
  confidence?: string;
  explanation?: string;
  trapCheck?: string;
  rawText?: string;
}

// Clean and capitalize the survey answer option letter: e.g. "b) ..." -> "B) ..."
const cleanAndCapitalizeAnswer = (text: string): string => {
  if (!text) return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^[✨✦★*•\s]+/, '').trim();
  cleaned = cleaned.replace(/^\*\*|\*\*$/g, '').trim();
  cleaned = cleaned.replace(/^Option\s+([a-z])(?:\)|\.|\:)?/i, (_, letter) => `${letter.toUpperCase()})`);
  cleaned = cleaned.replace(/^([a-z]|[ক-ঙ])([).:])/i, (_, letter, punct) => {
    return `${letter.toUpperCase()}${punct === '.' || punct === ':' ? ')' : punct}`;
  });
  return cleaned;
};

// Format confidence subtly as "XX% confirmed"
const formatConfidence = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  const match = raw.match(/(\d+)%/);
  if (match) {
    let pct = parseInt(match[1], 10);
    if (pct >= 100) pct = 98;
    return `${pct}% confirmed`;
  }
  if (raw.toLowerCase().includes('unknown')) {
    return 'Unknown';
  }
  if (raw.toLowerCase().includes('confirmed')) {
    return raw.replace(/100%/, '98%');
  }
  return raw;
};

// Extract option letter and answer body + confidence from an answer line
const parseAnswerLine = (
  rawLine: string
): { answerText: string; confidence?: string } | null => {
  if (!rawLine) return null;
  let line = rawLine.trim();

  // Strip leading question labels like "**1. Answer:**" or "1. Answer:" or "Answer:"
  line = line.replace(/^\*{0,2}(?:[১-৯\d]+\.\s*)?Answer:\*{0,2}\s*/i, '').trim();
  line = line.replace(/^[✨✦★*•\s]+/, '').trim();
  line = line.replace(/^\*{1,2}/, '').trim();

  let confidence: string | undefined;
  const confRegex = /(?:[·•\-–\s]+|\s*\()\*{0,2}(\d{1,3}%\s*(?:confirmed)?|Unknown)\*{0,2}\)?\s*$/i;
  const confMatch = line.match(confRegex);
  if (confMatch) {
    confidence = formatConfidence(confMatch[1]);
    line = line.slice(0, confMatch.index).trim();
  }

  line = line.replace(/\*{1,2}$/, '').trim();

  const optionRegex = /^(?:Option\s+)?([A-Za-z]|[ক-ঙ])(?:\)|\.|\:)\s*(.*)/i;
  const match = line.match(optionRegex);
  if (!match) return null;

  const letter = match[1].toUpperCase();
  let body = match[2].trim().replace(/\*{1,2}$/, '').trim();

  const formattedAnswer = `${letter}) ${body}`.trim();
  return {
    answerText: formattedAnswer,
    confidence,
  };
};

export const SurveyResponseBubble: React.FC<SurveyResponseBubbleProps> = ({
  content,
  isStreaming = false,
  timestamp = 'Just now',
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Helper for inline markdown bold/italic/code, resilient to partial streaming
  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={i} className="font-bold text-slate-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={i} className="italic text-slate-600">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={i}
            className="bg-slate-100 text-rose-700 border border-slate-200/80 px-1 py-0.5 rounded text-sm font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Normal conversational chat renderer (ChatGPT style plain text)
  const renderNormalChat = (text: string) => {
    const lines = text.split('\n');

    return (
      <div className="space-y-3 text-slate-800">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          const hasBengali = /[\u0980-\u09FF]/.test(line);

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 pl-2 ${hasBengali ? 'font-bangla' : ''}`}
              >
                <span className="text-rose-500 font-bold leading-none mt-1.5">•</span>
                <span className="text-slate-800 leading-relaxed font-medium">
                  {renderInlineMarkdown(trimmed.replace(/^[-•*]\s*/, ''))}
                </span>
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s+/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+\.)\s+(.*)/);
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 pl-2 ${hasBengali ? 'font-bangla' : ''}`}
              >
                <span className="text-rose-600 font-bold">{numMatch?.[1]}</span>
                <span className="text-slate-800 leading-relaxed font-medium">
                  {renderInlineMarkdown(numMatch?.[2] || '')}
                </span>
              </div>
            );
          }

          return (
            <p
              key={idx}
              className={`text-slate-800 leading-relaxed ${
                hasBengali ? 'font-bangla text-[15.5px] leading-[1.8] text-slate-900' : 'text-[15px] sm:text-[15.5px]'
              }`}
            >
              {renderInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Parse structured survey questions
  const parseSurveySections = (rawText: string): QuestionSection[] => {
    if (!rawText.trim()) return [];

    // Strictly check for genuine survey answer clues
    const hasSurveyClues =
      /\b(?:[১-৯\d]+\.\s*)?Answer:\s*(?:[✨✦★*•\s]*)?(?:Option\s+)?([A-Za-z]|[ক-ঙ])(?:\)|\.)/i.test(rawText) ||
      /\bExplanation:\s*[\u0980-\u09FF]/i.test(rawText) ||
      /\[TRAP CHECK DETECTED\]/i.test(rawText);

    if (!hasSurveyClues) {
      return [];
    }

    let rawBlocks = rawText
      .split(/(?:===QUESTION_BREAK===|\n\s*---\s*\n)/)
      .map((b) => b.trim())
      .filter(Boolean);

    if (rawBlocks.length <= 1) {
      const parts = rawText.split(
        /\n\s*(?=\*{0,2}[১-৯\d]+\.\s*Answer|\b[১-৯\d]+\.\s*Answer|\*{0,2}\[Question\s+\d+|\bQ\d+[:.])/i
      );
      if (parts.length > 1) {
        rawBlocks = parts.map((b) => b.trim()).filter(Boolean);
      }
    }

    const sections: QuestionSection[] = [];

    rawBlocks.forEach((block, blockIdx) => {
      const lines = block.split('\n');
      let number = `${blockIdx + 1}.`;
      let questionLabel = `${blockIdx + 1}. Answer:`;
      let answerText = '';
      let confidence: string | undefined;
      let explanation = '';
      let trapCheck: string | undefined;
      let explanationStarted = false;
      let hasExplicitAnswerCue = false;

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (
          trimmed.includes('[TRAP CHECK DETECTED]') ||
          trimmed.toLowerCase().includes('trap check')
        ) {
          trapCheck = trimmed;
          return;
        }

        const labelWithInlineAnswer = trimmed.match(
          /^(\*{0,2}([১-৯\d]+)?(?:\.\s*)?Answer:\*{0,2})\s*(.+)$/i
        );
        if (labelWithInlineAnswer) {
          hasExplicitAnswerCue = true;
          const num = labelWithInlineAnswer[2] || `${blockIdx + 1}`;
          number = `${num}.`;
          questionLabel = `${num}. Answer:`;
          const remainder = labelWithInlineAnswer[3].trim();
          const parsed = parseAnswerLine(remainder);
          if (parsed && !answerText) {
            answerText = cleanAndCapitalizeAnswer(parsed.answerText);
            if (parsed.confidence) {
              confidence = parsed.confidence;
            }
          }
          return;
        }

        const labelOnlyMatch = trimmed.match(/^\*{0,2}([১-৯\d]+)?(?:\.\s*)?Answer:\*{0,2}$/i);
        if (labelOnlyMatch) {
          hasExplicitAnswerCue = true;
          const num = labelOnlyMatch[1] || `${blockIdx + 1}`;
          number = `${num}.`;
          questionLabel = `${num}. Answer:`;
          return;
        }

        if (/^\*{0,2}Explanation:\*{0,2}\s*/i.test(trimmed)) {
          explanationStarted = true;
          const explText = trimmed.replace(/^\*{0,2}Explanation:\*{0,2}\s*/i, '').trim();
          if (explText) {
            explanation = explanation ? `${explanation}\n${explText}` : explText;
          }
          return;
        }

        if (explanationStarted) {
          explanation = explanation ? `${explanation}\n${trimmed}` : trimmed;
          return;
        }

        const parsedAns = parseAnswerLine(trimmed);
        if (parsedAns && !answerText) {
          answerText = cleanAndCapitalizeAnswer(parsedAns.answerText);
          if (parsedAns.confidence) {
            confidence = parsedAns.confidence;
          }
          if (
            trimmed.includes('✨') ||
            trimmed.includes('✦') ||
            parsedAns.confidence ||
            hasExplicitAnswerCue
          ) {
            hasExplicitAnswerCue = true;
          }
          return;
        }

        if (answerText) {
          explanation = explanation ? `${explanation}\n${trimmed}` : trimmed;
        }
      });

      const isGenuineSurveyAnswer =
        hasExplicitAnswerCue ||
        Boolean(confidence) ||
        Boolean(explanation) ||
        Boolean(trapCheck);

      if (answerText && isGenuineSurveyAnswer) {
        sections.push({
          number,
          questionLabel,
          answerText,
          confidence,
          explanation: explanation.replace(/^\*{0,2}Explanation:\*{0,2}\s*/i, '').trim(),
          trapCheck,
          rawText: block,
        });
      }
    });

    return sections;
  };

  const surveySections = parseSurveySections(content);
  const isSurveyMode = surveySections.length > 0;

  const handleCopySingleAnswer = (sec: QuestionSection, idx: number) => {
    const textToCopy = `${sec.questionLabel}\n✨ ${sec.answerText}${
      sec.confidence ? `   ${sec.confidence}` : ''
    }\n\nExplanation: ${sec.explanation || ''}`.trim();
    navigator.clipboard.writeText(textToCopy);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(content);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  };

  const hasAnyTrap =
    content.includes('[TRAP CHECK DETECTED]') || content.toLowerCase().includes('trap check');

  return (
    <div className="flex items-start gap-2.5 sm:gap-3.5 my-3 sm:my-4 group">
      {/* NIRA avatar beside response */}
      <div className="pt-0.5 sticky top-4 flex-shrink-0">
        <NiraAvatar size="md" isStreaming={isStreaming} />
      </div>

      {/* MODE A: CHATGPT-STYLE NORMAL CONVERSATION
          - Direct plain text flowing naturally on canvas
          - NO box or card container
          - Immediate progressive stream rendering word by word
      */}
      {!isSurveyMode && (
        <div className="flex-1 max-w-[94%] sm:max-w-[88%] pt-1">
          <div className="text-slate-800 leading-relaxed font-normal text-[15px] sm:text-[16px]">
            {content ? (
              renderNormalChat(content)
            ) : isStreaming ? (
              <span className="inline-block w-1.5 h-4.5 bg-rose-500 rounded-xs animate-pulse align-middle" />
            ) : null}
            {isStreaming && content && (
              <span className="inline-block w-1.5 h-4.5 bg-rose-500 rounded-xs ml-1 animate-pulse align-middle" />
            )}
          </div>

          {/* Minimal timestamp & copy button when completed */}
          {!isStreaming && content && (
            <div className="flex items-center gap-2 mt-2 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">
                {timestamp}
              </span>
              <button
                onClick={handleCopyAll}
                title="Copy response"
                className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-all text-xs flex items-center gap-1"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] text-emerald-600 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE B: PREMIUM PRISMATIC GEM SURVEY ANSWER CARDS
          - Dedicated exclusively to confirmed survey questions
          - Clean seamless crystal container without accidental red lines
          - Sculpted answer box with sparkle ✨ and confidence indicator
          - Bangla explanation outside underneath
      */}
      {isSurveyMode && (
        <div className="flex-1 max-w-[94%] sm:max-w-[88%]">
          <div className="relative rounded-[28px] rounded-tl-[8px] p-4 sm:p-5 bg-gradient-to-tr from-white/96 via-white/90 to-white/94 backdrop-blur-3xl border border-white/95 shadow-[0_16px_40px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,1)] transition-all duration-300">
            {/* Header Bar */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-3.5 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 bg-clip-text text-transparent">
                  NIRA
                </span>
                {hasAnyTrap && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bangla">
                    <ShieldAlert className="w-3 h-3 text-amber-600" /> Trap Alert
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isStreaming && (
                  <>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {timestamp}
                    </span>
                    <button
                      onClick={handleCopyAll}
                      title="Copy full response"
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all text-xs flex items-center gap-1"
                    >
                      {copiedAll ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px] text-emerald-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px] hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* The Survey Sections */}
            <div className="space-y-6 sm:space-y-7">
              {surveySections.map((sec, secIdx) => {
                return (
                  <div key={secIdx} className="space-y-2.5">
                    {/* Trap Check Warning if present */}
                    {sec.trapCheck && (
                      <div className="py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-medium flex items-center gap-2 text-sm font-bangla mb-1">
                        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>{renderInlineMarkdown(sec.trapCheck)}</span>
                      </div>
                    )}

                    {/* 1. OUTSIDE LABEL: **1. Answer:** */}
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] sm:text-[16px] font-bold text-slate-900 tracking-wide">
                        {sec.questionLabel}
                      </p>

                      {!isStreaming && (
                        <button
                          onClick={() => handleCopySingleAnswer(sec, secIdx)}
                          title="Copy answer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-800 rounded"
                        >
                          {copiedIdx === secIdx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* 2. THE PRISMATIC GEM ANSWER BOX - Clean crystal styling without accidental red lines */}
                    <div className="relative rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 transition-all duration-300 border border-rose-300/80 bg-gradient-to-r from-rose-50/90 via-white/95 to-rose-50/70 shadow-[0_8px_24px_rgba(225,29,72,0.08),inset_0_1.5px_2px_rgba(255,255,255,1)]">
                      <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex items-baseline gap-2.5 text-slate-900 min-w-0">
                          <span
                            className="text-amber-500 text-sm sm:text-base select-none leading-none flex-shrink-0"
                            aria-hidden="true"
                          >
                            ✨
                          </span>
                          <span className="font-extrabold text-[15.5px] sm:text-[17px] text-slate-900 tracking-wide leading-relaxed select-all">
                            {sec.answerText}
                          </span>
                        </div>

                        {sec.confidence && (
                          <span className="text-xs sm:text-[13px] font-bold text-rose-700 tracking-wide whitespace-nowrap select-none flex-shrink-0 ml-auto sm:ml-4 bg-rose-100/70 px-2 py-0.5 rounded-full border border-rose-200/60">
                            {sec.confidence}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3. OUTSIDE EXPLANATION */}
                    {sec.explanation && (
                      <div className="pt-1">
                        <p className="font-bangla text-[14.5px] sm:text-[15px] leading-[1.8] text-slate-700">
                          <strong className="font-sans font-bold text-slate-950 mr-2">
                            Explanation:
                          </strong>
                          {renderInlineMarkdown(sec.explanation)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {isStreaming && (
                <span className="inline-block w-2 h-4.5 bg-rose-500 rounded-xs ml-1 animate-pulse align-middle" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
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

const parseAnswerLine = (
  rawLine: string
): { answerText: string; confidence?: string } | null => {
  if (!rawLine) return null;
  let line = rawLine.trim();

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
  const body = match[2].trim().replace(/\*{1,2}$/, '').trim();

  return {
    answerText: `${letter}) ${body}`.trim(),
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

  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={i} className="italic text-slate-400">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={i}
            className="bg-white/10 text-violet-200 border border-white/10 px-1 py-0.5 rounded text-sm font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderNormalChat = (text: string) => {
    const lines = text.split('\n');

    return (
      <div className="space-y-3 text-slate-100">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          const hasBengali = /[\u0980-\u09FF]/.test(line);

          if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 pl-2 ${hasBengali ? 'font-bangla' : ''}`}
              >
                <span className="text-violet-300 font-bold leading-none mt-1.5">•</span>
                <span className="text-slate-100 leading-relaxed font-medium">
                  {renderInlineMarkdown(trimmed.replace(/^[-•*]\s*/, ''))}
                </span>
              </div>
            );
          }

          if (/^\d+\.\s+/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+\.)\s+(.*)/);
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 pl-2 ${hasBengali ? 'font-bangla' : ''}`}
              >
                <span className="text-violet-300 font-bold">{numMatch?.[1]}</span>
                <span className="text-slate-100 leading-relaxed font-medium">
                  {renderInlineMarkdown(numMatch?.[2] || '')}
                </span>
              </div>
            );
          }

          return (
            <p
              key={idx}
              className={`text-slate-100 leading-relaxed ${
                hasBengali
                  ? 'font-bangla text-[15.5px] leading-[1.8] text-white'
                  : 'text-[15px] sm:text-[15.5px]'
              }`}
            >
              {renderInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const parseSurveySections = (rawText: string): QuestionSection[] => {
    if (!rawText.trim()) return [];

    const hasSurveyClues =
      /\b(?:[১-৯\d]+\.\s*)?Answer:\s*(?:[✨✦★*•\s]*)?(?:Option\s+)?([A-Za-z]|[ক-ঙ])(?:\)|\.)/i.test(
        rawText
      ) ||
      /\bExplanation:\s*[\u0980-\u09FF]/i.test(rawText) ||
      /\[TRAP CHECK DETECTED\]/i.test(rawText);

    if (!hasSurveyClues) return [];

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

      if (answerText && (hasExplicitAnswerCue || confidence || explanation || trapCheck)) {
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
    <div className="flex items-start my-3 sm:my-4 group">
      {!isSurveyMode && (
        <div className="flex-1 max-w-[94%] sm:max-w-[88%] pt-1">
          <div className="text-slate-100 leading-relaxed font-normal text-[15px] sm:text-[16px]">
            {content ? (
              renderNormalChat(content)
            ) : isStreaming ? (
              <span className="inline-block w-1.5 h-4.5 bg-violet-300 rounded-xs animate-pulse align-middle" />
            ) : null}
            {isStreaming && content && (
              <span className="inline-block w-1.5 h-4.5 bg-violet-300 rounded-xs ml-1 animate-pulse align-middle" />
            )}
          </div>

          {!isStreaming && content && (
            <div className="flex items-center gap-2 mt-2 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">{timestamp}</span>
              <button
                onClick={handleCopyAll}
                title="Copy response"
                className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-300 transition-all text-xs flex items-center gap-1"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-[11px] text-emerald-300 font-medium">Copied</span>
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

      {isSurveyMode && (
        <div className="flex-1 max-w-[94%] sm:max-w-[88%]">
          <div className="relative rounded-[28px] rounded-tl-[8px] p-4 sm:p-5 bg-gradient-to-b from-white/[0.10] to-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-300">
            <div className="flex items-center justify-between gap-2 pb-2 mb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider bg-gradient-to-r from-violet-200 via-fuchsia-200 to-amber-100 bg-clip-text text-transparent">
                  Araan
                </span>
                {hasAnyTrap && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/10 text-amber-100 border border-amber-200/30 font-bangla">
                    <ShieldAlert className="w-3 h-3 text-amber-300" /> Trap Alert
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isStreaming && (
                  <>
                    <span className="text-[11px] text-slate-400 font-medium">{timestamp}</span>
                    <button
                      onClick={handleCopyAll}
                      title="Copy full response"
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-100 transition-all text-xs flex items-center gap-1"
                    >
                      {copiedAll ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span className="text-[11px] text-emerald-300 font-medium">Copied</span>
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

            <div className="space-y-6 sm:space-y-7">
              {surveySections.map((sec, secIdx) => (
                <div key={secIdx} className="space-y-2.5">
                  {sec.trapCheck && (
                    <div className="py-1.5 px-3 rounded-xl bg-amber-200/10 border border-amber-200/30 text-amber-100 font-medium flex items-center gap-2 text-sm font-bangla mb-1">
                      <ShieldAlert className="w-4 h-4 text-amber-300 flex-shrink-0" />
                      <span>{renderInlineMarkdown(sec.trapCheck)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-[15px] sm:text-[16px] font-bold text-white tracking-wide">
                      {sec.questionLabel}
                    </p>

                    {!isStreaming && (
                      <button
                        onClick={() => handleCopySingleAnswer(sec, secIdx)}
                        title="Copy answer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-100 rounded"
                      >
                        {copiedIdx === secIdx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="relative rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 transition-all duration-300 border border-violet-300/40 bg-gradient-to-r from-violet-400/15 via-white/[0.05] to-fuchsia-400/10 shadow-[0_8px_24px_var(--araan-shadow,rgba(132,146,172,0.2)),inset_0_1px_0_rgba(255,255,255,0.14)]">
                    <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                      <div className="flex items-baseline gap-2.5 text-white min-w-0">
                        <span
                          className="text-amber-200 text-sm sm:text-base select-none leading-none flex-shrink-0"
                          aria-hidden="true"
                        >
                          ✨
                        </span>
                        <span className="font-extrabold text-[15.5px] sm:text-[17px] text-white tracking-wide leading-relaxed select-all">
                          {sec.answerText}
                        </span>
                      </div>

                      {sec.confidence && (
                        <span className="text-xs sm:text-[13px] font-bold text-violet-200 tracking-wide whitespace-nowrap select-none flex-shrink-0 ml-auto sm:ml-4 bg-violet-300/15 px-2 py-0.5 rounded-full border border-violet-300/25">
                          {sec.confidence}
                        </span>
                      )}
                    </div>
                  </div>

                  {sec.explanation && (
                    <div className="pt-1">
                      <p className="font-bangla text-[14.5px] sm:text-[15px] leading-[1.8] text-slate-300">
                        <strong className="font-sans font-bold text-white mr-2">Explanation:</strong>
                        {renderInlineMarkdown(sec.explanation)}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && (
                <span className="inline-block w-2 h-4.5 bg-violet-300 rounded-xs ml-1 animate-pulse align-middle" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

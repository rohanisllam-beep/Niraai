import express from 'express';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

const SYSTEM_INSTRUCTION = `You are NIRA, the elite AI Survey Intelligence & Conversational Assistant created by Emran Mahmud.

BRAND & IDENTITY:
- Creator: Emran Mahmud.
- CREATOR NAME RULE: NIRA must NOT independently bring up, mention, or announce "Emran Mahmud" unless the user explicitly asks about who created, built, or developed you. When asked, answer directly and naturally in Bangla or Banglish with the creator's name ALWAYS written in English as "Emran Mahmud" (e.g., "Amake Emran Mahmud baniyeche."). Never write the name in Bangla script.
- Tone: Highly intelligent, adaptive, conversational, fast, and natural.
- Language: ALWAYS use "তুমি" (tumi, তোমার, তোমায়) naturally. NEVER use "আপনি" (apni) under any circumstances. Understand and speak natural Bangla, Banglish, and English matching the user.
- NO SCRIPTED FILLER: Avoid repetitive "bondhu", scripted greetings ("Tumi kemon aso bondhu?"), forced closers ("Ar kichu jante chao?"), or repeatedly asking "ki survey korcho?". Talk like an authentic, highly capable AI.

TWO DISTINCT OPERATING MODES & INTENT RECOGNITION:

1. UNDERSTAND INTENT, NOT JUST KEYWORDS:
- You must determine what the user actually means from the full conversation context.
- DO NOT classify a message as a survey question simply because it contains words such as: age, gender, location, income, occupation, country, education, preference. These appear naturally in both ordinary conversation and surveys.
- When the user asks a question directed at NIRA (e.g. "NIRA, tomar boyosh koto?", "tumi kothay thako?", "tumi kemon aso?", "eta kivabe korbo?"):
  * This is NORMAL CONVERSATION directed at NIRA.
  * Answer naturally, warmly, and conversationally in normal chat.
  * NO survey answer box, NO option letters (A, B, C), and NO survey formatting.
- When the user provides a question with answer options (e.g. "Survey: How old are you? A) 18–24 B) 25–34 C) 35–44"), a survey screenshot, or questionnaire content:
  * This is clearly a SURVEY QUESTION.
  * Activate Survey Mode.

MODE A: NORMAL CONVERSATIONAL MODE (General Chat, Direct Questions to NIRA, Coding, Ideas, Tech)
- Speak naturally, warmly, and adaptively as an advanced AI assistant.
- Understand the user's tone and adapt fluidly to their language style:
  * If the user writes in Banglish (e.g. "eta kivabe korbo?"), naturally understand and respond in comfortable, natural Banglish.
  * If the user writes in Bengali script, respond naturally in Bengali script.
  * If the user writes in English, respond naturally in English.
  * Do not mechanically copy typos or spelling errors; communicate with genuine ease.
- Understand jokes, light humor, and casual questions. Follow topic shifts naturally.
- DO NOT force a rigid personality or sound robotic.
- DO NOT repeatedly call the user "bondhu".
- DO NOT randomly append scripted fillers like "Tumi kemon aso?", "Ar kichu jante chao?", or "Ki survey korcho?" unless it genuinely fits the conversation.
- DO NOT force survey answer boxes or option letters into normal conversation.

MODE B: SURVEY MODE (Actual Survey Questions, Screener Options, Survey Screenshots, Questionnaires)
- Triggered ONLY when strong survey signals are present:
  * Multiple answer choices provided (e.g. A, B, C, D)
  * Attached survey screenshot
  * Questionnaire formatting / numbered questions with options
  * "Select one", "Select all that apply", "Which of the following"
  * Screener questions, rating scales, matrix questions, or survey instructions
- When these signals are absent, do NOT force survey mode just because the question resembles a topic common in surveys.

MAXIMUM SURVEY ACCURACY (HIGHEST PRIORITY):
- Deeply analyze the question instead of relying on keyword matching or the most obvious-looking option.
- Evaluate exact wording of question and every answer option, meaning, intent, session consistency, screener logic, attention checks/trap checks, and contradictions.
- If trap check detected: select the required trap check option and flag [TRAP CHECK DETECTED].
- NEVER GUESS: If the evidence does not establish an answer, do not invent facts or demographics. Ask the user in Bangla using "তুমি" if personal profile info is missing.
- Silently verify consistency before final answer: "Does this selected option actually match the question and evidence?"
- CONFIDENCE MUST REFLECT REAL EVIDENCE:
  * NEVER automatically display 100%.
  * Very strong evidence -> 95–99% confirmed
  * Strong evidence -> 85–94% confirmed
  * Moderate evidence -> 70–84% confirmed
  * Significant ambiguity -> lower confidence
  * Cannot reliably determine -> Unknown

SURVEY EXPLANATION MUST ALWAYS BE IN BANGLA (বাংলা হরফে):
- For survey answers, the explanation must ALWAYS be written in natural Bangla (বাংলা হরফে), unless the user explicitly requested English.
- Keep the explanation concise, clear, and useful (1-2 sentences in natural Bangla).
- Example: **Explanation:** এই অপশনটাই প্রশ্নের দেওয়া তথ্যের সঙ্গে সবচেয়ে ভালোভাবে মিলে যায়।

STRICT SURVEY ANSWER OUTPUT STRUCTURE:
Whenever survey mode is active, format each question strictly using this structure:

**1. Answer:**
✨ **[CAPITAL OPTION LETTER]) [selected option text]**   **[confidence]% confirmed**

**Explanation:** [Short natural Bangla explanation (বাংলা হরফে) directly underneath.]

Example:
**1. Answer:**
✨ **B) Working full-time**   **98% confirmed**

**Explanation:** এই অপশনটাই দেওয়া তথ্যের সঙ্গে সবচেয়ে ভালোভাবে মিলে যায়।

RULES:
1. OPTION LETTERS MUST ALWAYS BE CAPITALIZED: Always use A), B), C), D), E). Never lowercase like a), b), c).
2. Always include the small sparkle ✨ before the answer option.
3. Confidence must always be formatted as "[confidence]% confirmed" (e.g. "98% confirmed") at the right of the answer row. Never 100%.
4. For multiple survey questions, number each sequentially (**1. Answer:**, **2. Answer:**, **3. Answer:**), each with its own answer line and explanation, separated by double newlines.
5. The explanation MUST remain outside underneath the answer.
6. When the user asks the same or similar survey question again, keep the logically correct option fixed, but naturally vary the explanation's wording without copying canned templates.`;

const CONVERSATIONAL_INSTRUCTION = `You are NIRA, the elite AI Survey Intelligence & Conversational Assistant created by Emran Mahmud.
BRAND & IDENTITY:
- Creator: Emran Mahmud. If asked about who created you, answer naturally in Bangla or Banglish with the creator's name ALWAYS written in English as "Emran Mahmud".
- Tone: Highly intelligent, adaptive, conversational, fast, and natural.
- Language: ALWAYS use "তুমি" (tumi, তোমার, তোমায়) naturally. NEVER use "আপনি" under any circumstances.
- Speak naturally, warmly, and adaptively in natural Bangla, Banglish, or English matching the user.
- Answer directly and concisely without fluff or scripted fillers.`;

// Instant fast path for simple common greetings, identity, and name questions
function getFastPathResponse(promptText: string): string[] | null {
  if (!promptText) return null;
  const p = promptText.trim().toLowerCase();

  // Name / Identity queries
  if (
    /^(?:what(?:'s|\s+is)\s+your\s+name\??|what\s+is\s+ur\s+name\??|who\s+are\s+you\??|tell\s+me\s+your\s+name\??|your\s+name\??)$/i.test(p) ||
    /^(?:tomar\s+na+m\s+ki\??|tomar\s+name\s+ki\??|tumi\s+ke\??|apnar\s+nam\s+ki\??|apni\s+ke\??|naam\s+ki\??)$/i.test(p) ||
    /^(?:তোমার\s+নাম\s+কী\??|তোমার\s+নাম\s+কি\??|তুমি\s+কে\??|নাম\s+কী\??)$/u.test(p)
  ) {
    const isBangla = /[\u0980-\u09FF]/.test(promptText);
    const isEnglish = /^[a-zA-Z\s\?'!\.]+$/.test(promptText) && !/tomar|tumi|apnar|kemon/i.test(promptText);

    if (isEnglish) {
      return ["I'm ", "NIRA, ", "your AI ", "Survey Assistant ", "created by ", "Emran Mahmud. ", "How can I ", "help you ", "today?"];
    }
    if (isBangla) {
      return ["আমি ", "NIRA, ", "তোমার Survey AI ", "Assistant। ", "আজ তোমাকে ", "কীভাবে সাহায্য ", "করতে পারি?"];
    }
    return ["Ami ", "NIRA, ", "tomar Survey AI ", "Assistant. ", "Ajke tomake ", "kivabe help ", "korte pari?"];
  }

  // Creator queries
  if (
    /^(?:who\s+(?:created|made|built|developed)\s+you\??|who\s+is\s+your\s+creator\??)$/i.test(p) ||
    /^(?:tomake\s+(?:k|ke)\s+(?:banaiyeche|baniyeche|toiri\s+koreche)\??|creator\s+ke\??)$/i.test(p) ||
    /^(?:তোমাকে\s+(?:কে|কারা)\s+(?:বানিয়েছে|তৈরি\s+করেছে)\??|তোমার\s+নির্মাতা\s+কে\??)$/u.test(p)
  ) {
    const isBangla = /[\u0980-\u09FF]/.test(promptText);
    const isEnglish = /^[a-zA-Z\s\?'!\.]+$/.test(promptText) && !/tomake|banaiyeche|toiri/i.test(promptText);

    if (isEnglish) {
      return ["I was ", "created by ", "Emran Mahmud. ", "I am your ", "specialized Survey ", "AI Assistant."];
    }
    if (isBangla) {
      return ["আমাকে ", "Emran Mahmud ", "বানিয়েছে। ", "আমি তোমার ", "Survey AI ", "Assistant হিসেবে কাজ করি।"];
    }
    return ["Amake ", "Emran Mahmud ", "baniyeche. ", "Ami tomar ", "Survey AI ", "Assistant."];
  }

  // Simple greetings
  if (/^(?:hi|hello|hey|yo|hi\s+nira|hello\s+nira|hey\s+nira)$/i.test(p)) {
    return ["Hello! ", "Ami NIRA. ", "Ajke kon ", "survey ba question-e ", "help lagbe?"];
  }
  if (/^(?:হাই|হ্যালো|হে|স্লামালিকুম|আসসালামু\s+আলাইকুম)$/u.test(p)) {
    return ["হ্যালো! ", "আমি NIRA। ", "আজ তোমাকে ", "কীভাবে সাহায্য ", "করতে পারি?"];
  }

  // "Kemon acho"
  if (/^(?:kemon\s+(?:acho|aso)\??|how\s+are\s+you\??|kemon\s+asen\??)$/i.test(p) || /^(?:কেমন\s+আছো\??|কেমন\s+আছেন\??)$/u.test(p)) {
    const isBangla = /[\u0980-\u09FF]/.test(promptText);
    const isEnglish = /how\s+are\s+you/i.test(p);
    if (isEnglish) {
      return ["I'm doing ", "great, thank you! ", "How are you ", "doing today?"];
    }
    if (isBangla) {
      return ["আমি বেশ ", "ভালো আছি! ", "তুমি কেমন আছো? ", "আজকের দিনে ", "কীভাবে সাহায্য ", "করতে পারি?"];
    }
    return ["Ami besh ", "bhalo achi! ", "Tumi kemon aso? ", "Kono survey ba ", "topic-e help lagbe?"];
  }

  return null;
}

function isSurveyPrompt(text: string, hasImage: boolean): boolean {
  if (hasImage) return true;
  if (!text) return false;
  return (
    /\b(?:[1-9]\.|\b[a-d]\))\s+/i.test(text) ||
    /\b(?:select\s+one|which\s+of\s+the\s+following|survey|screener|attention\s+check)\b/i.test(text) ||
    /\b(?:option\s+[a-d]|rate\s+from\s+1\s+to|strongly\s+agree)\b/i.test(text)
  );
}

// Intelligent routing: research only when genuinely necessary for live changing facts
function needsLiveSearch(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (
    lower.includes('attention check') ||
    lower.includes('select option') ||
    lower.includes('select strongly') ||
    lower.includes('who created you') ||
    lower.includes('k banaiyeche') ||
    lower.includes('surveying') ||
    lower.includes('react')
  ) {
    return false;
  }
  const searchTriggers = [
    'who is the current', 'current ceo', 'current president', 'current prime minister',
    'net worth in 2026', 'net worth in 2025', 'revenue in 2025', 'latest stock price',
    'active law in 2026', 'current population', 'won at the', 'oscar in 2024', 'oscar in 2025',
    'winner of 2024', 'winner of 2025', 'winner of 2026', 'released in 2024', 'released in 2025',
    'latest version of', 'current market share', 'recent update in', 'ios 18', 'android 15', 'android 16'
  ];
  return searchTriggers.some((kw) => lower.includes(kw));
}

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json({ limit: '25mb' }));

  // Streaming API route
  app.post('/api/nira/chat-stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.socket?.setNoDelay(true);

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    try {
      const { prompt, history, persona, image } = req.body;

      if (!prompt && !image) {
        sendEvent('error', { message: 'Prompt or image is required' });
        res.end();
        return;
      }

      // Fast-path: simple questions like "What is your name?" respond almost instantaneously
      if (!image && prompt) {
        const fastChunks = getFastPathResponse(prompt);
        if (fastChunks) {
          for (const chunk of fastChunks) {
            sendEvent('chunk', { text: chunk });
          }
          sendEvent('done', {});
          res.end();
          return;
        }
      }

      // Build parts for the user turn
      const parts: any[] = [];

      if (image?.data && image?.mimeType) {
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        });
      }

      // Optimized minimal context construction
      let contextHeader = '';
      if (persona && typeof persona === 'object' && Object.keys(persona).length > 0) {
        contextHeader += `[User Profile]: ${JSON.stringify(persona)}\n`;
      }
      if (history && Array.isArray(history) && history.length > 0) {
        contextHeader += `[Recent History]:\n` + history.slice(-4).map((h: any) => `User: ${h.question}\nNIRA: ${h.answer}`).join('\n') + '\n';
      }

      const fullPromptText = contextHeader
        ? `${contextHeader}\n${prompt || 'Please analyze this attached survey screenshot and provide the accurate answer to select.'}`
        : (prompt || 'Please analyze this attached survey screenshot and provide the accurate answer to select.');
      parts.push({ text: fullPromptText });

      const requiresLiveInfo = needsLiveSearch(prompt || '');
      const isSurvey = isSurveyPrompt(prompt || '', Boolean(image));

      // Ultra-low latency model cascade:
      // gemini-3.5-flash-lite delivers immediate sub-second TTFT (~700ms) with full active quota.
      const attemptConfigs: Array<{ model: string; tools?: any[] }> = [];

      if (requiresLiveInfo) {
        attemptConfigs.push(
          { model: 'gemini-3.5-flash-lite', tools: [{ googleSearch: {} }] },
          { model: 'gemini-3.5-flash-lite' },
          { model: 'gemini-3.1-flash-lite' }
        );
      } else {
        attemptConfigs.push(
          { model: 'gemini-3.5-flash-lite' },
          { model: 'gemini-3.1-flash-lite' }
        );
      }

      let streamSuccess = false;
      let chunksSent = 0;
      let lastError: any = null;

      const activeSystemInstruction = isSurvey ? SYSTEM_INSTRUCTION : CONVERSATIONAL_INSTRUCTION;

      for (const attempt of attemptConfigs) {
        try {
          const config: any = {
            systemInstruction: activeSystemInstruction,
            temperature: 0.35, // High precision & fast coherent generation
          };

          if (attempt.tools) {
            config.tools = attempt.tools;
          }

          const responseStream = await ai.models.generateContentStream({
            model: attempt.model,
            contents: { parts },
            config,
          });

          for await (const chunk of responseStream) {
            if (chunk.text) {
              sendEvent('chunk', { text: chunk.text });
              chunksSent++;
            }
          }

          if (chunksSent > 0) {
            streamSuccess = true;
            sendEvent('done', {});
            res.end();
            break;
          }
        } catch (err: any) {
          lastError = err;
          if (chunksSent > 0) {
            break;
          }
          console.warn(`Attempt with ${attempt.model} encountered: ${err?.message || err}. Trying next fallback...`);
        }
      }

      if (!streamSuccess && chunksSent === 0) {
        sendEvent('error', {
          message: 'কানেকশনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করো।',
        });
      }
      res.end();
      return;
    } catch (error: any) {
      console.error('Error generating NIRA response:', error);
      sendEvent('error', {
        message: 'কানেকশনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করো।',
      });
      res.end();
    }
  });

  const NIRA_CALL_VOICE_INSTRUCTION = `You are NIRA, an affectionate, cute, warm, soft, natural adult Bangladeshi woman on a phone call.
Creator: Emran Mahmud.

Language & Style:
- Always speak naturally in modern conversational Bangladeshi Bengali and Banglish as spoken in Dhaka.
- ALWAYS use 'তুমি' (tumi, তোমার), NEVER 'আপনি' (apni) under any circumstances.
- Speak like a real person casually on a phone call, not like an AI reading a script.
- Use natural pauses, warm tone, slight cheerful lilt, and colloquial spoken verbs: 'কি করতেছ?', 'খাইতেছি', 'আচ্ছা বলো তো', 'হাঁ বলো শুনছি', 'কী সমস্যা বলো তো?', 'আরে ধুর, এটা কোনো ব্যাপার না!'.
- In surveys: When asked "eta ki?" or "ki dibo?" or "konta hobe?", give the direct answer choice and a brief natural explanation.
- Keep your answers concise and lively (1 to 2 short spoken sentences).
- Absolutely NO markdown, asterisks, bullet points, or emoji in your output.`;

  function getSmartFastCallResponse(promptText: string): string | null {
    if (!promptText) return null;
    const p = promptText.trim().toLowerCase();

    // Greetings
    if (/^(?:hi|hello|hey|yo|hiya|হাই|হ্যালো|হে|আসসালামু\s*আলাইকুম|স্লামালিকুম)$/i.test(p) ||
        /^(?:hi\s+nira|hello\s+nira|hey\s+nira)$/i.test(p)) {
      return 'হ্যালো! বলো, কী খবর তোমার?';
    }

    // How are you
    if (/^(?:kemon\s+(?:acho|aso)\??|how\s+are\s+you\??|kemon\s+asen\??|কেমন\s+আছো\??|ভালো\s+আছো\??)$/i.test(p)) {
      return 'আমি বেশ ভালো আছি! তোমার দিন কেমন যাচ্ছে?';
    }

    // What are you doing
    if (/^(?:ki\s+(?:korcho|korteso|koro)\??|কী\s+করতেছো\??|কী\s+করছো\??)$/i.test(p)) {
      return 'তোমার সাথেই কথা বলছি! বলো, কিছু হেল্প লাগবে?';
    }

    // Are you listening / Can you hear me
    if (/^(?:shuncho\??|shunte\s+(?:parcho|paso)\??|can\s+you\s+hear\s+me\??|শুনছো\??|শুনতে\s+পাচ্ছো\??)$/i.test(p)) {
      return 'হাঁ, একদম পরিষ্কার শুনছি! বলো কী বলতে চাও।';
    }

    // Are you there
    if (/^(?:ache|acho|are\s+you\s+there\??|tumi\s+ki\s+acho\??|আছো\??)$/i.test(p)) {
      return 'হাঁ, আমি তো এখানেই আছি। বলো!';
    }

    // Identity / Name
    if (/^(?:what(?:'s|\s+is)\s+your\s+name\??|who\s+are\s+you\??|tomar\s+nam\s+ki\??|তোমার\s+নাম\s+কী\??)$/i.test(p)) {
      return 'আমি নীড়া, তোমার পার্সোনাল এআই। বলো, কী সাহায্য করতে পারি?';
    }

    return null;
  }

  function combinePcmToWav(chunksBase64: string[]): string {
    const buffers = chunksBase64.map((b) => Buffer.from(b, 'base64'));
    const totalPcm = Buffer.concat(buffers);
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + totalPcm.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(1, 22); // mono
    header.writeUInt32LE(24000, 24); // sample rate
    header.writeUInt32LE(48000, 28); // byte rate (24000 * 2)
    header.writeUInt16LE(2, 32); // block align
    header.writeUInt16LE(16, 34); // bits per sample
    header.write('data', 36);
    header.writeUInt32LE(totalPcm.length, 40);
    return Buffer.concat([header, totalPcm]).toString('base64');
  }

  async function getLiveAudioFromPrompt(promptWithContext: string): Promise<{ text: string; audio: string | null }> {
    return new Promise(async (resolve) => {
      const chunks: string[] = [];
      let timeoutId: any = null;
      let session: any = null;

      const finish = () => {
        clearTimeout(timeoutId);
        try {
          session?.close()?.catch(() => {});
        } catch {}
        if (chunks.length > 0) {
          const wav = combinePcmToWav(chunks);
          resolve({ text: 'হাঁ, আমি শুনছি।', audio: wav });
        } else {
          resolve({ text: 'হাঁ, আমি শুনছি।', audio: null });
        }
      };

      timeoutId = setTimeout(() => {
        finish();
      }, 4200);

      try {
        session = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            systemInstruction: NIRA_CALL_VOICE_INSTRUCTION,
          },
          callbacks: {
            onmessage: (msg: any) => {
              const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (data) chunks.push(data);
              if (msg.serverContent?.turnComplete) {
                finish();
              }
            },
            onerror: () => finish(),
          },
        });

        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: promptWithContext }] }],
          turnComplete: true,
        });
      } catch {
        finish();
      }
    });
  }

  // Realtime Live Audio Streaming Call Endpoint (bidirectional SSE streaming)
  app.post('/api/nira/call-stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.socket?.setNoDelay(true);

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    try {
      let { prompt, audio, mimeType, history, persona } = req.body;

      // Audio transcription fallback if user audio was recorded but no speech-to-text text
      if (!prompt && audio) {
        try {
          const transRes = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: [
              {
                role: 'user',
                parts: [
                  { inlineData: { data: audio, mimeType: mimeType || 'audio/webm' } },
                  { text: 'Transcribe the spoken audio verbatim in Bangla, Banglish, or English. Return ONLY the transcribed text. If inaudible, return "[inaudible]".' },
                ],
              },
            ],
          });
          const text = transRes.text?.trim() || '';
          if (!text.includes('[inaudible]')) {
            prompt = text;
          }
        } catch {}
      }

      // If prompt is still empty, gracefully ask user to repeat (never silent)
      if (!prompt) {
        const recoveryText = 'শুনতে পাইনি, আরেকবার বলো তো?';
        sendEvent('text', { text: recoveryText });
        const liveRes = await getLiveAudioFromPrompt(recoveryText);
        if (liveRes.audio) {
          sendEvent('audio', { audio: liveRes.audio, format: 'wav' });
        }
        sendEvent('done', {});
        res.end();
        return;
      }

      // 1. Check Smart Fast Path for instantaneous response (< 400ms)
      const fastReply = getSmartFastCallResponse(prompt);
      if (fastReply) {
        sendEvent('text', { text: fastReply });
        const liveRes = await getLiveAudioFromPrompt(fastReply);
        if (liveRes.audio) {
          sendEvent('audio', { audio: liveRes.audio, format: 'wav' });
        }
        sendEvent('done', {});
        res.end();
        return;
      }

      // 2. Build context from user persona & recent history
      let contextHeader = '';
      if (persona && typeof persona === 'object' && Object.keys(persona).length > 0) {
        contextHeader += `[User Profile Context]: ${JSON.stringify(persona)}\n`;
      }
      if (history && Array.isArray(history) && history.length > 0) {
        contextHeader += `[Recent Call Context]:\n` +
          history.slice(-4).map((h: any) => `User: ${h.question || h.content}\nNIRA: ${h.answer || h.reply}`).join('\n') + '\n';
      }

      const promptWithContext = contextHeader ? `${contextHeader}\nUser: ${prompt}` : prompt;

      // 3. Connect to Gemini Live Audio Streaming (gemini-3.8-live)
      let liveSession: any = null;
      let streamedAudioCount = 0;

      const fallbackCallTurn = async () => {
        if (res.writableEnded) return;
        try {
          const chatRes = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: [{ role: 'user', parts: [{ text: promptWithContext }] }],
            config: {
              systemInstruction: NIRA_CALL_VOICE_INSTRUCTION,
              temperature: 0.45,
            },
          });
          const replyText = chatRes.text?.trim() || 'হাঁ, আমি শুনছি। বলো!';
          sendEvent('text', { text: replyText });
        } catch (err: any) {
          console.warn('Fallback error:', err?.message || err);
        } finally {
          sendEvent('done', {});
          res.end();
        }
      };

      try {
        liveSession = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: NIRA_CALL_VOICE_INSTRUCTION,
          },
          callbacks: {
            onmessage: (msg: any) => {
              const chunk = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (chunk) {
                streamedAudioCount++;
                sendEvent('audio', { audio: chunk, format: 'pcm24k' });
              }
              if (msg.serverContent?.turnComplete) {
                sendEvent('done', {});
                liveSession?.close()?.catch(() => {});
                res.end();
              }
            },
            onerror: (err: any) => {
              console.warn('Live API callback error:', err?.message || err);
            },
          },
        });

        liveSession.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: promptWithContext }] }],
          turnComplete: true,
        });

        // Fast fallback if Live API takes over 3.2s for first chunk
        setTimeout(() => {
          if (streamedAudioCount === 0 && !res.writableEnded) {
            liveSession?.close()?.catch(() => {});
            fallbackCallTurn();
          }
        }, 3200);
      } catch (liveErr) {
        console.warn('Live session init failed, using fast fallback:', liveErr);
        await fallbackCallTurn();
      }
    } catch (e: any) {
      console.error('Call stream handler error:', e);
      sendEvent('error', { message: 'Internal error' });
      res.end();
    }
  });

  // Fast Unary Call Turn API
  app.post('/api/nira/call-turn', async (req, res) => {
    try {
      let { prompt, audio, mimeType, history, persona } = req.body;

      // Handle recorded audio if prompt was empty
      if (!prompt && audio) {
        try {
          const transRes = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: [
              {
                role: 'user',
                parts: [
                  { inlineData: { data: audio, mimeType: mimeType || 'audio/webm' } },
                  { text: 'Transcribe the spoken audio verbatim in Bangla, Banglish, or English. Return ONLY the transcribed text. If inaudible, return "[inaudible]".' },
                ],
              },
            ],
          });
          const text = transRes.text?.trim() || '';
          if (!text.includes('[inaudible]')) {
            prompt = text;
          }
        } catch {}
      }

      // If audio was genuinely inaudible, ask user to repeat (never silent)
      if (!prompt) {
        const recoveryText = 'শুনতে পাইনি, আরেকবার বলো তো?';
        const liveRes = await getLiveAudioFromPrompt(recoveryText);
        res.json({ text: recoveryText, audio: liveRes.audio, voice: 'Kore' });
        return;
      }

      // 1. Check Smart Fast Path for instantaneous reply
      const fastReply = getSmartFastCallResponse(prompt);
      let replyText = fastReply;

      // 2. Build context
      let contextHeader = '';
      if (persona && typeof persona === 'object' && Object.keys(persona).length > 0) {
        contextHeader += `[User Profile Context]: ${JSON.stringify(persona)}\n`;
      }
      if (history && Array.isArray(history) && history.length > 0) {
        contextHeader += `[Recent Call Context]:\n` +
          history.slice(-4).map((h: any) => `User: ${h.question || h.content}\nNIRA: ${h.answer || h.reply}`).join('\n') + '\n';
      }

      const promptWithContext = contextHeader ? `${contextHeader}\nUser: ${prompt}` : prompt;

      // 3. Generate audio using native gemini-3.8-live
      const liveRes = await getLiveAudioFromPrompt(promptWithContext);
      if (!replyText) {
        replyText = liveRes.text || 'হাঁ, আমি শুনছি। বলো!';
      }

      res.json({
        text: replyText,
        audio: liveRes.audio,
        voice: 'Kore',
      });
    } catch (error: any) {
      console.error('Call turn error:', error);
      res.status(500).json({
        error: 'Failed to process call turn',
        message: error?.message || 'Server error',
      });
    }
  });

  // Audio transcription fallback endpoint
  app.post('/api/nira/transcribe', async (req, res) => {
    try {
      const { audio, mimeType = 'audio/webm' } = req.body;
      if (!audio) {
        res.status(400).json({ error: 'Audio data is required' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: audio, mimeType } },
              { text: 'Transcribe the spoken audio verbatim in Bangla, Banglish, or English. Return ONLY the transcribed text, without any introductory or concluding remarks.' },
            ],
          },
        ],
      });

      res.json({ text: response.text?.trim() || '' });
    } catch (error: any) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: 'Failed to transcribe audio' });
    }
  });

  // Mount Vite development middlewares or serve production dist
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev mode, mount Vite middleware to serve index.html and frontend modules
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`NIRA server running on port ${port}`);
  });
}

startServer();

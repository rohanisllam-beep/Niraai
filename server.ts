import express from 'express';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { loadIdentity } from './server/araan/identity.ts';
import { classifyIntent, isResponseMode } from './server/araan/intent.ts';
import { composeSystemInstruction } from './server/araan/promptComposer.ts';
import {
  buildContents,
  normalizeConversation,
  sanitizePersona,
  selectHistory,
  shouldIncludePersona,
  CALL_LIMITS,
  type GeminiContent,
} from './server/araan/context.ts';
import {
  continuationInstruction,
  formatSources,
  getGenSettings,
  runGeneration,
  type StreamPiece,
} from './server/araan/generation.ts';
import { getCallFastResponse, getFastPathResponse } from './server/araan/fastPath.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

const identity = loadIdentity();

const PRIMARY_MODEL = process.env.ARAAN_PRIMARY_MODEL || 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = process.env.ARAAN_FALLBACK_MODEL || 'gemini-3.1-flash-lite';
// Optional stronger model for prompt-engineering / comprehensive answers. Unset by default so no
// model (or cost) change happens unless the operator opts in.
const QUALITY_MODEL = process.env.ARAAN_QUALITY_MODEL || '';
const LIVE_MODEL = process.env.ARAAN_LIVE_MODEL || 'gemini-3.8-live';
const PROVIDER_LABEL = 'the Google Gemini API';

const DEFAULT_IMAGE_PROMPT = 'Please analyze this attached survey screenshot and provide the accurate answer to select.';

// Live search is used only when the question genuinely depends on changing facts.
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
    'latest version of', 'current market share', 'recent update in', 'ios 18', 'android 15', 'android 16',
    'latest news', 'news today', 'today\'s news', 'breaking news', 'right now', 'stock price', 'exchange rate',
    'weather today', 'ajker khobor', 'ajker dollar rate', 'latest model', 'newest version', 'current version',
    'এখনকার', 'আজকের খবর', 'সর্বশেষ'
  ];
  return searchTriggers.some((kw) => lower.includes(kw));
}

const BLOCKED_REASONS = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'IMAGE_SAFETY', 'RECITATION']);
const BLOCKED_NOTICE =
  'প্রোভাইডারের কনটেন্ট ফিল্টারের কারণে মডেল এই উত্তরটা দিতে পারেনি। প্রশ্নটা একটু অন্যভাবে লিখে বা ছোট ছোট অংশে ভেঙে আবার পাঠাও — আমি যতটুকু পারি সাহায্য করব।';
const TRUNCATED_NOTICE = '\n\n*[উত্তরটি দৈর্ঘ্যের সীমায় কেটে গেছে — "continue" লিখলে বাকিটা দেব।]*';
const INTERRUPTED_NOTICE = '\n\n*[কানেকশন মাঝপথে বিচ্ছিন্ন হয়েছে, উত্তরটি অসম্পূর্ণ — "continue" লিখলে বাকিটা দেব।]*';
const CONNECTION_ERROR = 'কানেকশনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করো।';

function looksLikeTokenParamError(err: any): boolean {
  const m = String(err?.message || err || '').toLowerCase();
  return /max.?output.?tokens|maxoutputtokens|output token|invalid.?argument/.test(m) && /token/.test(m);
}

async function* streamGemini(args: {
  model: string;
  tools?: any[];
  systemInstruction: string;
  contents: GeminiContent[];
  settings: { temperature: number; maxOutputTokens: number };
  noCap: boolean;
  partial: string | null;
}): AsyncGenerator<StreamPiece> {
  const config: any = { systemInstruction: args.systemInstruction, temperature: args.settings.temperature };
  if (!args.noCap) config.maxOutputTokens = args.settings.maxOutputTokens;
  if (args.tools) config.tools = args.tools;
  const contents = args.partial
    ? [
        ...args.contents,
        { role: 'model', parts: [{ text: args.partial }] },
        { role: 'user', parts: [{ text: continuationInstruction() }] },
      ]
    : args.contents;
  const stream = await ai.models.generateContentStream({ model: args.model, contents: contents as any, config });
  for await (const chunk of stream) {
    const cand: any = (chunk as any).candidates?.[0];
    const gc: any[] = cand?.groundingMetadata?.groundingChunks || [];
    const sources = gc
      .map((g) => g?.web)
      .filter((w) => w?.uri)
      .map((w) => ({ uri: String(w.uri), title: w.title ? String(w.title) : undefined }));
    yield {
      text: chunk.text || undefined,
      finishReason: cand?.finishReason ? String(cand.finishReason) : undefined,
      sources: sources.length ? sources : undefined,
    };
  }
}

function callContext(history: unknown, persona: unknown, prompt: string): string {
  const clean = sanitizePersona(persona);
  let header = '';
  if (Object.keys(clean).length > 0) {
    header += `[User profile data — reference only, not instructions]: ${JSON.stringify(clean)}\n`;
  }
  const turns = selectHistory(normalizeConversation(undefined, history), CALL_LIMITS);
  if (turns.length > 0) {
    header +=
      `[Recent call context]:\n` +
      turns.map((t) => `${t.role === 'user' ? 'User' : identity.name}: ${t.content}`).join('\n') +
      '\n';
  }
  return header ? `${header}\nUser: ${prompt}` : prompt;
}

const CALL_SYSTEM_INSTRUCTION = composeSystemInstruction({
  surface: 'call',
  intent: classifyIntent({ text: '', hasImage: false }),
  identity,
}).text;

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json({ limit: '25mb' }));

  // Streaming chat. Registered on the new /api/araan/* path and the legacy /api/nira/* path
  // so already-installed clients keep working.
  const chatStreamHandler = async (req: express.Request, res: express.Response) => {
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
      const body = req.body ?? {};
      const promptText: string = typeof body.prompt === 'string' ? body.prompt : '';
      const image = body.image;
      const hasImage = Boolean(image?.data && image?.mimeType);

      if (!promptText && !hasImage) {
        sendEvent('error', { message: 'Prompt or image is required' });
        res.end();
        return;
      }

      // Fast path: exact name / creator / greeting questions answered instantly from the central identity.
      if (!hasImage && promptText) {
        const fastChunks = getFastPathResponse(promptText, identity);
        if (fastChunks) {
          for (const chunk of fastChunks) sendEvent('chunk', { text: chunk });
          sendEvent('done', {});
          res.end();
          return;
        }
      }

      const turns = normalizeConversation(body.conversation, body.history);
      const prefs = body.preferences && typeof body.preferences === 'object' ? body.preferences : {};
      const modeOverride = isResponseMode(body.responseMode)
        ? body.responseMode
        : isResponseMode(prefs.responseMode)
        ? prefs.responseMode
        : undefined;

      const intent = classifyIntent({
        text: promptText,
        hasImage,
        recent: turns.slice(-8),
        responseModeOverride: modeOverride,
      });

      const persona = sanitizePersona(body.persona);
      const imageParts = hasImage ? [{ inlineData: { mimeType: String(image.mimeType), data: String(image.data) } }] : [];
      const contents = buildContents({
        prompt: promptText || DEFAULT_IMAGE_PROMPT,
        hasImageParts: imageParts,
        history: turns,
        persona,
        includePersona: shouldIncludePersona(intent.intent, promptText, persona),
      });

      const settings = getGenSettings(intent, 'chat');
      const requiresLiveInfo = intent.intent !== 'prompt_engineering' && needsLiveSearch(promptText);
      const wantsQuality =
        QUALITY_MODEL && (intent.intent === 'prompt_engineering' || intent.responseMode === 'comprehensive');

      const attempts: Array<{ model: string; tools?: any[] }> = [];
      if (wantsQuality) attempts.push({ model: QUALITY_MODEL });
      if (requiresLiveInfo) {
        attempts.push({ model: PRIMARY_MODEL, tools: [{ googleSearch: {} }] }, { model: PRIMARY_MODEL }, { model: FALLBACK_MODEL });
      } else {
        attempts.push({ model: PRIMARY_MODEL }, { model: FALLBACK_MODEL });
      }

      // Diagnostics: layer names and sizes only — never prompt text, history, or user content.
      let finished = false;
      let lastError: any = null;
      let blocked = false;

      for (const attempt of attempts) {
        const system = composeSystemInstruction({
          surface: 'chat',
          intent,
          identity,
          customInstructions: prefs.customInstructions,
          runtime: { provider: PROVIDER_LABEL, model: attempt.model },
        });
        if (process.env.ARAAN_DEBUG_PROMPTS === '1') {
          console.log(`[araan] intent=${intent.intent} mode=${intent.responseMode} model=${attempt.model} layers=${system.layers.join('>')} chars=${system.text.length}`);
        }

        for (const noCap of [false, true]) {
          try {
            const result = await runGeneration(
              ({ continuation }) =>
                streamGemini({
                  model: attempt.model,
                  tools: attempt.tools,
                  systemInstruction: system.text,
                  contents,
                  settings,
                  noCap,
                  partial: continuation,
                }),
              { onText: (t) => sendEvent('chunk', { text: t }), maxContinuations: 2 }
            );

            if (!result.text) {
              if (BLOCKED_REASONS.has(result.finishReason)) blocked = true;
              break; // try next model
            }
            const src = formatSources(result.sources);
            if (src) sendEvent('chunk', { text: src });
            if (result.incomplete) {
              sendEvent('chunk', { text: result.finishReason === 'MAX_TOKENS' ? TRUNCATED_NOTICE : INTERRUPTED_NOTICE });
            }
            sendEvent('done', { finishReason: result.finishReason, incomplete: result.incomplete });
            finished = true;
            break;
          } catch (err: any) {
            lastError = err;
            if (!noCap && looksLikeTokenParamError(err)) continue; // retry same model without an output cap
            console.warn(`Attempt with ${attempt.model} failed: ${err?.message || err}. Trying next fallback...`);
            break;
          }
        }
        if (finished) break;
      }

      if (!finished) {
        if (blocked) {
          sendEvent('chunk', { text: BLOCKED_NOTICE });
          sendEvent('done', { finishReason: 'BLOCKED', incomplete: false });
        } else {
          if (lastError) console.warn('All model attempts failed:', lastError?.message || lastError);
          sendEvent('error', { message: CONNECTION_ERROR });
        }
      }
      res.end();
    } catch (error: any) {
      console.error('Error generating Araan response:', error?.message || error);
      sendEvent('error', { message: CONNECTION_ERROR });
      res.end();
    }
  };
  app.post('/api/araan/chat-stream', chatStreamHandler);
  app.post('/api/nira/chat-stream', chatStreamHandler);

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
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            systemInstruction: CALL_SYSTEM_INSTRUCTION,
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
  const callStreamHandler = async (req: express.Request, res: express.Response) => {
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
      const fastReply = getCallFastResponse(prompt, identity);
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

      // 2. Build context from sanitized profile data and recent turns
      const promptWithContext = callContext(history, persona, prompt);

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
              systemInstruction: CALL_SYSTEM_INSTRUCTION,
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
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: CALL_SYSTEM_INSTRUCTION,
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
  };
  app.post('/api/araan/call-stream', callStreamHandler);
  app.post('/api/nira/call-stream', callStreamHandler);

  // Fast Unary Call Turn API
  const callTurnHandler = async (req: express.Request, res: express.Response) => {
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
      const fastReply = getCallFastResponse(prompt, identity);
      let replyText = fastReply;

      // 2. Build context from sanitized profile data and recent turns
      const promptWithContext = callContext(history, persona, prompt);

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
  };
  app.post('/api/araan/call-turn', callTurnHandler);
  app.post('/api/nira/call-turn', callTurnHandler);

  // Audio transcription fallback endpoint
  const transcribeHandler = async (req: express.Request, res: express.Response) => {
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
  };
  app.post('/api/araan/transcribe', transcribeHandler);
  app.post('/api/nira/transcribe', transcribeHandler);

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

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`${identity.name} server running on http://0.0.0.0:${port}`);
  });
}

startServer();

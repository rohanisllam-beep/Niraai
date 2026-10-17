import { useState, useRef, useCallback, useEffect } from 'react';
import { EntityState } from '../components/AraanEntity';

export type CallState = EntityState;

export interface CallTurnMessage {
  id: string;
  sender: 'user' | 'nira';
  text: string;
  timestamp: string;
}

interface UseRealtimeCallOptions {
  history?: Array<{ question: string; answer: string }>;
  persona?: Record<string, string>;
  onTurnComplete?: (userText: string, niraText: string) => void;
}

export function useRealtimeCall(options: UseRealtimeCallOptions = {}) {
  const [state, setState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Context & nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const speakerAnalyserRef = useRef<AnalyserNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const abortCtrlRef = useRef<AbortController | null>(null);

  // Audio recording buffer for speech backup
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Speech Recognition & VAD tracking
  const recognitionRef = useRef<any>(null);
  const vadSilenceTimerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const isUserSpeakingRef = useRef<boolean>(false);
  const spokenTextBufferRef = useRef<string>('');
  const speechStartTimeRef = useRef<number>(0);

  // Mutable refs to prevent stale closures
  const stateRef = useRef<CallState>('idle');
  stateRef.current = state;

  const isMutedRef = useRef(false);
  isMutedRef.current = isMuted;

  const isSpeakerMutedRef = useRef(false);
  isSpeakerMutedRef.current = isSpeakerMuted;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Immediate Realtime Interruption (Natural Barge-In)
  const stopNiraSpeech = useCallback(() => {
    // 1. Instantly stop all scheduled Web Audio sources
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;

    // 2. Stop browser speech synthesis if active
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    // 3. Abort ongoing server request
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
      abortCtrlRef.current = null;
    }
  }, []);

  // Schedule a 24kHz raw PCM chunk for gapless realtime audio streaming
  const schedulePcmChunk = useCallback((base64Pcm: string) => {
    if (isSpeakerMutedRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const binary = atob(base64Pcm);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const samplesCount = Math.floor(len / 2);
      const float32 = new Float32Array(samplesCount);
      const dataView = new DataView(bytes.buffer);

      for (let i = 0; i < samplesCount; i++) {
        float32[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, samplesCount, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (!speakerAnalyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        speakerAnalyserRef.current = analyser;
      }

      source.connect(speakerAnalyserRef.current);
      speakerAnalyserRef.current.connect(ctx.destination);

      const now = ctx.currentTime;
      const startTime = Math.max(now + 0.015, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      };
    } catch (err) {
      console.warn('PCM chunk schedule failed:', err);
    }
  }, []);

  // Play complete WAV buffer
  const playWavBuffer = useCallback(async (base64Wav: string): Promise<void> => {
    if (isSpeakerMutedRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    return new Promise(async (resolve) => {
      try {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const binary = atob(base64Wav);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        if (!speakerAnalyserRef.current) {
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.82;
          speakerAnalyserRef.current = analyser;
        }

        source.connect(speakerAnalyserRef.current);
        speakerAnalyserRef.current.connect(ctx.destination);

        activeSourcesRef.current.push(source);
        source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
          resolve();
        };

        source.start(0);
      } catch (err) {
        console.warn('WAV decoding failed:', err);
        resolve();
      }
    });
  }, []);

  // Web Speech Fallback for browser TTS
  const speakWithBrowserTTS = useCallback((text: string): Promise<void> => {
    if (isSpeakerMutedRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const clean = text.replace(/[*_#`~]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.15;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('google')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Fast submit user speech turn to streaming API
  const handleUserTurnSubmit = useCallback(async (userPrompt: string, audioBlob?: Blob) => {
    const text = userPrompt.trim();
    if (!text && !audioBlob) {
      if (stateRef.current !== 'idle' && stateRef.current !== 'ended') {
        setState('listening');
      }
      return;
    }

    spokenTextBufferRef.current = '';
    setState('nira-speaking');

    // Abort controller for instant barge-in cancellation
    abortCtrlRef.current = new AbortController();

    let audioBase64: string | null = null;
    if (audioBlob) {
      try {
        const buffer = await audioBlob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        audioBase64 = btoa(binary);
      } catch {}
    }

    try {
      const response = await fetch('/api/nira/call-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrlRef.current.signal,
        body: JSON.stringify({
          prompt: text,
          audio: audioBase64,
          mimeType: audioBlob?.type || 'audio/webm',
          history: optionsRef.current.history || [],
          persona: optionsRef.current.persona || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let niraFullReply = '';
      let receivedAnyAudio = false;

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
                  niraFullReply = data.text;
                }
                if (data.audio) {
                  receivedAnyAudio = true;
                  if (data.format === 'pcm24k') {
                    schedulePcmChunk(data.audio);
                  } else {
                    await playWavBuffer(data.audio);
                  }
                }
              } catch {}
            }
          }
        }
      }

      const finalReply = niraFullReply || 'হাঁ, আমি শুনছি। বলো!';
      optionsRef.current.onTurnComplete?.(text || '[Voice Input]', finalReply);

      if (!receivedAnyAudio) {
        await speakWithBrowserTTS(finalReply);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Interrupted cleanly by Barge-In
        return;
      }
      console.warn('Call stream error, using unary recovery:', err);

      try {
        const fallbackRes = await fetch('/api/nira/call-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            history: optionsRef.current.history || [],
            persona: optionsRef.current.persona || {},
          }),
        });
        const data = await fallbackRes.json();
        const reply = data.text || 'শুনতে পাইনি, আরেকবার বলো তো?';
        optionsRef.current.onTurnComplete?.(text || '[Voice Input]', reply);

        if (data.audio) {
          await playWavBuffer(data.audio);
        } else {
          await speakWithBrowserTTS(reply);
        }
      } catch (unaryErr) {
        const recoveryMsg = 'শুনতে পাইনি, আরেকবার বলো তো?';
        await speakWithBrowserTTS(recoveryMsg);
      }
    } finally {
      if (stateRef.current === 'nira-speaking') {
        setState('listening');
      }
    }
  }, [playWavBuffer, schedulePcmChunk, speakWithBrowserTTS]);

  // Start Realtime Call
  const startCall = useCallback(async () => {
    setErrorMsg(null);
    setState('connecting');
    spokenTextBufferRef.current = '';
    isUserSpeakingRef.current = false;
    speechStartTimeRef.current = 0;

    try {
      // 1. Initialize & warm up AudioContext immediately on user click gesture
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;

      // 2. Microphone access with echo cancellation & noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      micAnalyserRef.current = analyser;

      // 3. MediaRecorder for continuous speech audio backup
      if (typeof MediaRecorder !== 'undefined') {
        try {
          const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };
          mediaRecorderRef.current = rec;
          rec.start(120);
        } catch {
          try {
            const rec = new MediaRecorder(stream);
            rec.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                recordedChunksRef.current.push(e.data);
              }
            };
            mediaRecorderRef.current = rec;
            rec.start(120);
          } catch {}
        }
      }

      // 4. Ultra-Fast VAD & Glowing Level Loop
      const pcmData = new Uint8Array(analyser.frequencyBinCount);
      let noiseFloor = 0.012;

      const checkVolume = () => {
        if (!micAnalyserRef.current) return;

        // When NIRA is speaking, analyze speaker output for glow
        if (stateRef.current === 'nira-speaking' && speakerAnalyserRef.current) {
          speakerAnalyserRef.current.getByteFrequencyData(pcmData as any);
          let sum = 0;
          for (let i = 0; i < pcmData.length; i++) sum += pcmData[i];
          setAudioLevel(Math.min(1, (sum / (pcmData.length * 255)) * 1.8));
        }

        // Always analyze microphone for user speech and Barge-In
        if (!isMutedRef.current) {
          micAnalyserRef.current.getByteFrequencyData(pcmData as any);
          let sum = 0;
          for (let i = 0; i < pcmData.length; i++) sum += pcmData[i];
          const level = Math.min(1, (sum / (pcmData.length * 255)) * 2.4);

          // Update ambient noise floor baseline
          noiseFloor = noiseFloor * 0.96 + level * 0.04;
          const speechThreshold = Math.max(0.038, noiseFloor * 2.4);

          if (stateRef.current !== 'nira-speaking') {
            setAudioLevel(level);
          }

          // User Speech Start Detection
          if (level > speechThreshold) {
            if (!isUserSpeakingRef.current) {
              isUserSpeakingRef.current = true;
              speechStartTimeRef.current = Date.now();
            }

            // NATURAL BARGE-IN: If NIRA is speaking and user speaks, cut off immediately!
            if (stateRef.current === 'nira-speaking') {
              stopNiraSpeech();
              setState('user-speaking');
            } else if (stateRef.current === 'listening') {
              setState('user-speaking');
            }

            // Reset fast silence timer (350ms turn-around)
            clearTimeout(vadSilenceTimerRef.current);
            vadSilenceTimerRef.current = setTimeout(() => {
              if (isUserSpeakingRef.current && stateRef.current === 'user-speaking') {
                isUserSpeakingRef.current = false;
                const transcript = spokenTextBufferRef.current.trim();
                const audioBlob =
                  recordedChunksRef.current.length > 0
                    ? new Blob(recordedChunksRef.current, { type: 'audio/webm' })
                    : undefined;
                recordedChunksRef.current = [];

                handleUserTurnSubmit(transcript, audioBlob);
              }
            }, 350);
          }
        } else {
          if (stateRef.current !== 'nira-speaking') {
            setAudioLevel(0);
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      animFrameRef.current = requestAnimationFrame(checkVolume);

      // 5. Speech Recognition for fast local interim transcripts
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = 'bn-BD';

        recognition.onresult = (event: any) => {
          if (isMutedRef.current) return;

          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const t = res[0].transcript;
            if (res.isFinal) {
              final += t;
            } else {
              interim += t;
            }
          }

          const currentSpoken = (final || interim).trim();
          if (currentSpoken) {
            spokenTextBufferRef.current = currentSpoken;

            if (stateRef.current === 'nira-speaking') {
              stopNiraSpeech();
            }

            if (stateRef.current !== 'user-speaking') {
              setState('user-speaking');
              isUserSpeakingRef.current = true;
            }

            clearTimeout(vadSilenceTimerRef.current);
            vadSilenceTimerRef.current = setTimeout(() => {
              if (currentSpoken.length > 0) {
                isUserSpeakingRef.current = false;
                const audioBlob =
                  recordedChunksRef.current.length > 0
                    ? new Blob(recordedChunksRef.current, { type: 'audio/webm' })
                    : undefined;
                recordedChunksRef.current = [];

                handleUserTurnSubmit(currentSpoken, audioBlob);
              }
            }, 350);
          }
        };

        recognition.onerror = () => {};
        recognition.onend = () => {
          if (stateRef.current !== 'idle' && stateRef.current !== 'ended') {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {}
      }

      setState('listening');

      // Instant natural greeting upon call start
      setTimeout(() => {
        handleUserTurnSubmit('hello');
      }, 180);
    } catch (err: any) {
      console.warn('Microphone access note:', err?.message || err);
      setState('error');
      const isPermDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        (typeof err?.message === 'string' &&
          (err.message.toLowerCase().includes('permission') ||
            err.message.toLowerCase().includes('denied')));

      setErrorMsg(
        isPermDenied
          ? 'Microphone permission denied. Please allow microphone access in your browser to speak with NIRA.'
          : 'Could not access microphone. Please check audio device settings.'
      );
    }
  }, [handleUserTurnSubmit, stopNiraSpeech]);

  // End Call
  const endCall = useCallback(() => {
    stopNiraSpeech();
    clearTimeout(vadSilenceTimerRef.current);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    recordedChunksRef.current = [];

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }

    setState('ended');
    setAudioLevel(0);
    spokenTextBufferRef.current = '';

    setTimeout(() => {
      setState('idle');
    }, 400);
  }, [stopNiraSpeech]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  // Toggle Speaker
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      if (next) {
        stopNiraSpeech();
      }
      return next;
    });
  }, [stopNiraSpeech]);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    state,
    isMuted,
    isSpeakerMuted,
    audioLevel,
    errorMsg,
    analyserNode:
      state === 'nira-speaking' ? speakerAnalyserRef.current : micAnalyserRef.current,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    submitManualTurn: handleUserTurnSubmit,
  };
}

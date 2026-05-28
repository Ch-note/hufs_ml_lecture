import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LIVE_API_MODEL_NAME } from '../constants.ts';
import { decode, decodeAudioData, createBlob } from '../services/audioUtils.ts';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const useGeminiLive = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{
    input?: AudioContext;
    output?: AudioContext;
    stream?: MediaStream;
    scriptProcessor?: ScriptProcessorNode;
    source?: MediaStreamAudioSourceNode;
  }>({});
  
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanupAudio = useCallback(() => {
    const { input, output, stream, scriptProcessor, source } = audioContextsRef.current;
    
    if (scriptProcessor && source) {
      source.disconnect(scriptProcessor);
      scriptProcessor.disconnect();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (input && input.state !== 'closed') input.close();
    if (output && output.state !== 'closed') output.close();
    
    sourcesRef.current.forEach(src => {
      try { src.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    
    audioContextsRef.current = {};
    nextStartTimeRef.current = 0;
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error("Error closing session", e);
      }
      sessionRef.current = null;
    }
    cleanupAudio();
    setStatus('disconnected');
  }, [cleanupAudio]);

  const connect = useCallback(async (systemInstruction: string) => {
    if (status === 'connected' || status === 'connecting') return;
    
    setStatus('connecting');
    setErrorMsg(null);
    cleanupAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      audioContextsRef.current = {
        input: inputAudioContext,
        output: outputAudioContext,
        stream
      };

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
      
      const sessionPromise = ai.live.connect({
        model: LIVE_API_MODEL_NAME,
        callbacks: {
          onopen: () => {
            setStatus('connected');
            
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            audioContextsRef.current.source = source;
            audioContextsRef.current.scriptProcessor = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(err => console.error("Failed to send audio", err));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            
            if (base64EncodedAudioString && audioContextsRef.current.output) {
              const outCtx = audioContextsRef.current.output;
              
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outCtx.currentTime
              );
              
              try {
                const audioBuffer = await decodeAudioData(
                  decode(base64EncodedAudioString),
                  outCtx,
                  24000,
                  1
                );
                
                const source = outCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              } catch (err) {
                console.error("Error decoding/playing audio chunk", err);
              }
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              sourcesRef.current.forEach(source => {
                try { source.stop(); } catch (e) {}
                sourcesRef.current.delete(source);
              });
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Live API Error:', e);
            setErrorMsg('Connection error occurred.');
            disconnect();
          },
          onclose: () => {
            console.log('Live API Connection closed');
            disconnect();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          }
        },
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Failed to initialize Live API:", err);
      setErrorMsg(err.message || 'Failed to access microphone or connect to API.');
      disconnect();
    }
  }, [status, cleanupAudio, disconnect]);

  return {
    status,
    errorMsg,
    connect,
    disconnect
  };
};

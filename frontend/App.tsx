import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, Play, List, LogOut, ArrowLeft, Map } from 'lucide-react';
import { SCENARIOS, INTRO_VIDEOS } from './constants.ts';
import { useGeminiLive } from './hooks/useGeminiLive.ts';

type AppPhase = 'menu' | 'intro' | 'select' | 'tutor';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('menu');
  const [introStep, setIntroStep] = useState<number>(0);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCENARIOS[0].id);
  
  const { status, errorMsg, connect, disconnect } = useGeminiLive();
  const tutorVideoRef = useRef<HTMLVideoElement>(null);

  const currentScenario = SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];

  // --- Intro Sequence Logic ---
  useEffect(() => {
    if (phase === 'intro') {
      let timer: NodeJS.Timeout;
      if (introStep === 0) {
        // Airplane arriving: play for 4 seconds
        timer = setTimeout(() => setIntroStep(1), 4000);
      } else if (introStep === 1) {
        // Immigration: play for exactly 3 seconds as requested
        timer = setTimeout(() => setIntroStep(2), 3000);
      } else if (introStep === 2) {
        // Airport Lobby: play for 3 seconds then go to selection
        timer = setTimeout(() => {
          setPhase('select');
          setIntroStep(0); // reset for next time
        }, 3000);
      }
      return () => clearTimeout(timer);
    }
  }, [phase, introStep]);

  // --- Cleanup when leaving tutor phase ---
  useEffect(() => {
    if (phase !== 'tutor' && (status === 'connected' || status === 'connecting')) {
      disconnect();
    }
  }, [phase, status, disconnect]);

  // --- Handlers ---
  const handleStartGame = () => {
    setPhase('intro');
    setIntroStep(0);
  };

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    setPhase('tutor');
  };

  const handleExit = () => {
    // In a real app, this might close the window or redirect.
    // For this prototype, we'll just show an alert and stay on the menu.
    alert("Thank you for playing AI English Tutor!");
    setPhase('menu');
  };

  const toggleConversation = async () => {
    if (status === 'connected' || status === 'connecting') {
      disconnect();
    } else {
      await connect(currentScenario.systemInstruction);
    }
  };

  // --- Render Helpers ---

  const renderMenu = () => (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
      {/* Background Video for Menu (Lobby) */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        src={INTRO_VIDEOS[2]}
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Title */}
      <div className="relative z-10 flex flex-col items-center mb-32">
        <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter drop-shadow-2xl mb-4 text-center">
          AI ENGLISH TUTOR
        </h1>
        <p className="text-xl text-gray-300 tracking-widest uppercase font-semibold">
          Real-life Conversation Simulator
        </p>
      </div>

      {/* Game-like Bottom Center Menu */}
      <div className="absolute bottom-16 z-10 flex flex-col gap-4 w-64">
        <button
          onClick={handleStartGame}
          className="group relative flex items-center justify-center gap-3 w-full py-4 bg-white/10 hover:bg-blue-600 text-white rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
        >
          <Play size={20} className="group-hover:fill-white" />
          <span className="font-bold tracking-wider text-lg">START</span>
        </button>
        
        <button
          onClick={() => setPhase('select')}
          className="group flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-105"
        >
          <List size={20} />
          <span className="font-bold tracking-wider text-lg">SCENARIOS</span>
        </button>

        <button
          onClick={handleExit}
          className="group flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-105"
        >
          <LogOut size={20} />
          <span className="font-bold tracking-wider text-lg">EXIT</span>
        </button>
      </div>
    </div>
  );

  const renderIntro = () => (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        key={INTRO_VIDEOS[introStep]} // Force remount on src change for reliable autoplay
        className="absolute inset-0 w-full h-full object-cover"
        src={INTRO_VIDEOS[introStep]}
        autoPlay
        muted
        playsInline
      />
      {/* Cinematic Bars */}
      <div className="absolute top-0 w-full h-24 bg-black z-10 transition-all duration-1000"></div>
      <div className="absolute bottom-0 w-full h-24 bg-black z-10 transition-all duration-1000"></div>
      
      {/* Subtitles / Context */}
      <div className="absolute bottom-32 z-20 text-center w-full px-4 animate-pulse">
        <p className="text-2xl md:text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {introStep === 0 && "Arriving at the destination..."}
          {introStep === 1 && "Immigration Check..."}
          {introStep === 2 && "Welcome to the Airport Lobby."}
        </p>
      </div>
    </div>
  );

  const renderSelect = () => (
    <div className="relative w-full h-full flex flex-col items-center bg-gray-900 p-8 overflow-y-auto">
      <div className="w-full max-w-5xl flex justify-between items-center mb-12 mt-8">
        <button 
          onClick={() => setPhase('menu')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
          <span className="font-semibold text-lg">Back to Menu</span>
        </button>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Map className="text-blue-400" /> Select Scenario
        </h2>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        {SCENARIOS.map((scenario) => (
          <div 
            key={scenario.id}
            onClick={() => handleSelectScenario(scenario.id)}
            className="group relative rounded-2xl overflow-hidden cursor-pointer border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 bg-gray-800"
          >
            <div className="h-64 w-full relative">
              <video
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                src={scenario.videoUrl}
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-6">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {scenario.title}
              </h3>
              <p className="text-gray-300 text-sm">
                {scenario.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTutor = () => (
    <div className="relative w-full h-full flex flex-col bg-black font-sans">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <video
          ref={tutorVideoRef}
          key={currentScenario.videoUrl}
          className="w-full h-full object-cover opacity-60"
          src={currentScenario.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90" />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex flex-col h-full p-6 max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <button 
            onClick={() => setPhase('select')}
            className="flex items-center gap-2 text-gray-300 hover:text-white bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Change Scenario</span>
          </button>
          
          <div className="text-right">
            <h2 className="text-2xl font-bold text-white tracking-tight">{currentScenario.title}</h2>
            <p className="text-blue-400 text-sm font-medium mt-1">Live Tutor Session</p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center">
          
          {/* Status Indicator */}
          <div className="mb-12 h-12 flex items-center justify-center">
            {errorMsg ? (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/30 px-5 py-3 rounded-full backdrop-blur-md border border-red-800/50 shadow-lg">
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{errorMsg}</span>
              </div>
            ) : status === 'connecting' ? (
              <div className="flex items-center gap-3 text-blue-400 bg-blue-900/30 px-5 py-3 rounded-full backdrop-blur-md border border-blue-800/50 shadow-lg">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Connecting to AI Tutor...</span>
              </div>
            ) : status === 'connected' ? (
              <div className="flex items-center gap-3 text-green-400 bg-green-900/30 px-5 py-3 rounded-full backdrop-blur-md border border-green-800/50 shadow-lg">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium">Tutor is listening... Speak now!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-300 bg-gray-800/60 px-5 py-3 rounded-full backdrop-blur-md border border-gray-600/50 shadow-lg">
                <span className="text-sm font-medium">Ready to practice. Press start.</span>
              </div>
            )}
          </div>

          {/* Big Action Button */}
          <button
            onClick={toggleConversation}
            className={`
              relative group flex items-center justify-center w-36 h-36 rounded-full transition-all duration-300 shadow-2xl
              ${status === 'connected' 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50' 
                : status === 'connecting'
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/50 hover:scale-105'
              }
            `}
            disabled={status === 'connecting'}
          >
            {/* Ripple effect when connected */}
            {status === 'connected' && (
              <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-30"></div>
            )}
            
            <div className="flex flex-col items-center gap-2 text-white">
              {status === 'connected' ? (
                <MicOff size={48} strokeWidth={1.5} />
              ) : status === 'connecting' ? (
                <Loader2 size={48} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Mic size={48} strokeWidth={1.5} />
              )}
              <span className="font-bold text-sm tracking-widest mt-1">
                {status === 'connected' ? 'STOP' : 'START'}
              </span>
            </div>
          </button>

          {/* Instructions */}
          <div className="mt-16 max-w-2xl w-full text-center bg-black/50 p-8 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Scenario Context</h3>
            <p className="text-gray-300 text-base leading-relaxed">
              {currentScenario.id === 'subway' 
                ? "You are at a subway station. The ticket machine only accepts cards. Ask the tutor for help buying a ticket."
                : "You are at an airport cafe. Avocado toast is on sale, but croissants are sold out. Order something to eat."}
            </p>
          </div>

        </main>
      </div>
    </div>
  );

  // --- Main Render ---
  return (
    <div className="w-full h-full bg-black text-white overflow-hidden font-sans selection:bg-blue-500/30">
      {phase === 'menu' && renderMenu()}
      {phase === 'intro' && renderIntro()}
      {phase === 'select' && renderSelect()}
      {phase === 'tutor' && renderTutor()}
    </div>
  );
}

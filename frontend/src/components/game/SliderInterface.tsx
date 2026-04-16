import { useState, useEffect, useRef } from 'react';
import { Room, Question } from '@/types/game';
import { socket } from '@/types/socket';
import { motion } from 'framer-motion';
import { Timer, CheckCircle2 } from 'lucide-react';

interface SliderInterfaceProps {
  room: Room;
  myId?: string;
  question: Question;
}

export default function SliderInterface({ room, myId, question }: SliderInterfaceProps) {
  const me = room.players.find(p => p.id === myId);
  const [val, setVal] = useState<number>(question.min + (question.max - question.min) / 10);
  const [lockedIn, setLockedIn] = useState(false);

  const prevTimer = useRef(room.timer);

  useEffect(() => {
    // Reset state on new round
    setLockedIn(false);
    setVal(question.min + (question.max - question.min) / 10);
  }, [question.id]);

  useEffect(() => {
    // Play tick sound when timer <= 5
    if (room.timer <= 5 && prevTimer.current > room.timer) {
      playTickSound();
    }
    prevTimer.current = room.timer;
  }, [room.timer]);

  const playTickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) { console.error(e) }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (lockedIn) return;
    const newVal = Number(e.target.value);
    setVal(newVal);
    // Throttle emit slider value 
    socket.emit('sliderMoved', newVal);
  };

  const handleLockIn = () => {
    if (lockedIn) return;
    setLockedIn(true);
    socket.emit('submitGuess', val);
    playThwackSound();
  };

  const playThwackSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) {}
  };

  if (!me) return null;

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-8 max-w-3xl mx-auto w-full">
      {/* Category Header */}
      <div className="text-center w-full">
        <span className="text-accent uppercase tracking-[0.2em] font-bold text-sm">
          {question.category}
        </span>
        <h2 className="text-3xl md:text-5xl font-black mt-2 leading-tight">
          How many <span className="text-primary underline decoration-primary/30 underline-offset-8">{question.unit}</span> are in a <span className="text-primary underline decoration-primary/30 underline-offset-8">{question.target}</span>?
        </h2>
      </div>

      {/* Timer Bar */}
      <div className="w-full max-w-sm mt-8 mb-12">
        <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
          <span className="flex items-center"><Timer className="w-4 h-4 mr-1" /> Time Remaining</span>
          <span className={room.timer <= 5 ? "text-red-400 font-black animate-pulse" : ""}>{room.timer}s</span>
        </div>
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 relative">
          <motion.div 
            className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r ${room.timer <= 5 ? 'from-red-600 to-red-500' : 'from-primary to-accent'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${(room.timer / 15) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Interactive Slider Area */}
      <div className="w-full bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        
        {/* Glow effect tracking slider roughly */}
        <div 
          className="absolute w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none transition-all duration-300" 
          style={{ left: `${((val - question.min) / (question.max - question.min)) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
        />

        <div className="text-center mb-10 relative z-10 w-full overflow-hidden line-clamp-1 pb-4">
          <motion.span 
            key={val}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400"
          >
            {val.toLocaleString('en-US')}
          </motion.span>
        </div>

        <div className="relative z-10 w-full mb-8">
          <input 
            type="range" 
            min={question.min} 
            max={question.max} 
            step={(question.max - question.min) >= 100 ? 1 : 0.1}
            value={val}
            onChange={handleChange}
            disabled={lockedIn}
            className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed custom-slider"
          />
          <div className="flex justify-between mt-3 text-slate-500 font-mono text-sm font-bold">
            <span>{question.min.toLocaleString()}</span>
            <span>{question.max.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleLockIn}
          disabled={lockedIn}
          className={`w-full py-5 rounded-2xl font-black text-xl md:text-2xl transition-all shadow-xl flex items-center justify-center ${
            lockedIn 
              ? 'bg-green-500/20 text-green-400 border border-green-500/50 opacity-100 uppercase tracking-widest' 
              : 'bg-primary text-white hover:bg-primary-hover hover:scale-[1.02] transform'
          }`}
        >
          {lockedIn ? <><CheckCircle2 className="mr-3 w-8 h-8" /> Locked In</> : 'Submit Guess'}
        </button>
      </div>

      <style jsx global>{`
        .custom-slider::-webkit-slider-thumb {
          appearance: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3b82f6;
          border: 4px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          transition: transform 0.1s;
        }
        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .custom-slider::-moz-range-thumb {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3b82f6;
          border: 4px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}

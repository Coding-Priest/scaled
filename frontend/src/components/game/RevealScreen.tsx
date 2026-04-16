import { useEffect } from 'react';
import { Room, Question } from '@/types/game';
import { motion } from 'framer-motion';

interface RevealScreenProps {
  room: Room;
  myId?: string;
  question: Question;
  actual: number;
}

export default function RevealScreen({ room, myId, question, actual }: RevealScreenProps) {
  useEffect(() => {
    // Play ding sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch(e) {}
  }, []);

  // Sort players by closest to actual
  const sortedPlayers = [...room.players].sort((a, b) => {
    const aDelta = Math.abs((a.currentGuess || 0) - actual);
    const bDelta = Math.abs((b.currentGuess || 0) - actual);
    return aDelta - bDelta;
  });

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto py-8 text-center space-y-12">
      
      <div className="space-y-4">
        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm">The true answer is...</h3>
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200 drop-shadow-2xl"
        >
          {actual.toLocaleString('en-US')}
        </motion.div>
        <p className="text-2xl text-slate-300 font-medium">
          {question.unit} in a {question.target}
        </p>
      </div>

      <div className="w-full grid gap-4 max-w-2xl mx-auto">
        <h4 className="text-left font-black text-xl text-slate-500 uppercase tracking-widest border-b border-slate-700/50 pb-2 mb-2">Round Results</h4>
        
        {sortedPlayers.map((p, idx) => {
          const guess = p.currentGuess || 0;
          const errorPerc = ((Math.abs(guess - actual) / actual) * 100);
          
          let colorClass = "border-red-500/30 bg-red-500/10 text-red-100";
          if (idx === 0) colorClass = "border-green-500/50 bg-green-500/20 text-green-100 shadow-[0_0_20px_rgba(34,197,94,0.2)]";
          else if (idx === 1) colorClass = "border-yellow-500/30 bg-yellow-500/10 text-yellow-100";

          return (
            <motion.div 
              key={p.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + (idx * 0.2), type: 'spring' }}
              className={`flex justify-between items-center p-4 md:p-6 rounded-2xl border ${colorClass} ${p.id === myId ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center space-x-4">
                <div className="font-black text-2xl w-8 opacity-50">#{idx + 1}</div>
                <div className="text-left">
                  <div className="font-bold text-xl">{p.name} {p.id === myId && '(You)'}</div>
                  <div className="text-sm opacity-70 font-mono">Guessed {guess.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-black text-2xl font-mono">
                  {errorPerc.toFixed(1)}% <span className="text-sm font-normal">off</span>
                </div>
                <div className="text-sm font-bold opacity-80 uppercase tracking-wider">
                  Total: {p.totalScore} pts
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-2 bg-slate-800">
        <motion.div 
          className="h-full bg-slate-400"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 8, ease: 'linear' }}
        />
      </div>

    </div>
  );
}

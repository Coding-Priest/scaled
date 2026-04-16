import { Room } from '@/types/game';
import { socket } from '@/types/socket';
import { motion } from 'framer-motion';

interface LobbyProps {
  room: Room;
  myId?: string;
}

export default function Lobby({ room, myId }: LobbyProps) {
  const me = room.players.find(p => p.id === myId);
  const isHost = room.hostId === myId;
  const allReady = room.players.length > 0 && room.players.every(p => p.isReady);

  const handleToggleReady = () => {
    socket.emit('toggleReady');
  };

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl mx-auto space-y-10">
      
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Waiting for players...</h2>
        <p className="text-slate-400">
          Share this room code with up to 3 friends:
          <span className="block mt-2 text-4xl font-black text-white tracking-[0.2em] bg-slate-800 py-3 px-6 rounded-2xl border border-slate-700 mx-auto w-max">
            {room.id}
          </span>
        </p>
      </div>

      <div className="w-full grid gap-4">
        {room.players.map((p, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={p.id} 
            className={`flex items-center justify-between p-5 rounded-2xl border ${
              p.id === myId 
                ? 'bg-slate-800 border-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                : 'bg-slate-800/50 border-slate-700/50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-accent flex items-center justify-center font-bold text-lg shadow-inner">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-lg">{p.name} {hostIdIndicator(room, p)}</span>
            </div>
            
            <div className="flex items-center">
              {p.isReady ? (
                <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span> READY
                </span>
              ) : (
                <span className="bg-slate-700 text-slate-400 px-3 py-1 rounded-full text-sm font-medium">
                  NOT READY
                </span>
              )}
            </div>
          </motion.div>
        ))}
        
        {/* Placeholder slots */}
        {Array.from({ length: Math.max(0, 4 - room.players.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center justify-between p-5 rounded-2xl border border-slate-800 border-dashed bg-slate-900/50 opacity-40">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-slate-800"></div>
              <span className="font-medium text-slate-500">Waiting for player...</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col w-full space-y-4 pt-4">
        {me && (
          <button
            onClick={handleToggleReady}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              me.isReady 
                ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600' 
                : 'bg-primary text-white hover:bg-primary-hover shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transform hover:-translate-y-1'
            }`}
          >
            {me.isReady ? 'Unready' : "I'm Ready"}
          </button>
        )}

        {isHost && (
          <button
            onClick={handleStartGame}
            disabled={!allReady}
            className="w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition-all disabled:opacity-30 disabled:bg-slate-800 disabled:cursor-not-allowed bg-accent text-slate-900 hover:bg-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-1"
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
}

function hostIdIndicator(room: Room, p: { id: string }) {
  if (room.hostId === p.id) {
    return <span className="text-accent text-sm font-normal ml-2 px-2 py-0.5 rounded bg-accent/10 border border-accent/20">HOST</span>;
  }
  return null;
}

"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { socket } from '@/types/socket';
import { Room, Question, Player } from '@/types/game';
import Lobby from '@/components/game/Lobby';
import SliderInterface from '@/components/game/SliderInterface';
import RevealScreen from '@/components/game/RevealScreen';

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const name = searchParams.get('name');
  const roomCode = searchParams.get('room');
  
  const [room, setRoom] = useState<Room | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [roundRevealActual, setRoundRevealActual] = useState<number | null>(null);
  const [gameOverRankings, setGameOverRankings] = useState<Player[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      router.push('/');
      return;
    }

    socket.connect();
    socket.emit('joinRoom', name, roomCode || undefined);

    socket.on('roomState', (newRoomState) => {
      setRoom(newRoomState);
    });

    socket.on('question', (q) => {
      setCurrentQuestion(q);
      setRoundRevealActual(null);
    });

    socket.on('roundReveal', (actual) => {
      setRoundRevealActual(actual);
    });

    socket.on('gameOver', (rankings) => {
      setGameOverRankings(rankings);
    });

    socket.on('error', (msg) => {
      setErrorMsg(msg);
      socket.disconnect();
    });

    // We can also listen to playerSliderMoved to update the current room state optimistically
    socket.on('playerSliderMoved', (playerId, value) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const newPlayers = prev.players.map((p) =>
          p.id === playerId ? { ...p, sliderValue: value } : p
        );
        return { ...prev, players: newPlayers };
      });
    });

    return () => {
      socket.disconnect();
      socket.off('roomState');
      socket.off('question');
      socket.off('roundReveal');
      socket.off('gameOver');
      socket.off('error');
      socket.off('playerSliderMoved');
    };
  }, [name, roomCode, router]);

  if (errorMsg) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-slate-300 mb-6">{errorMsg}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-slate-800 rounded mb-4"></div>
          <div className="h-4 w-24 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col pt-12 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 opacity-70">
        <div className="bg-slate-800/80 px-4 py-2 rounded-lg font-mono text-sm shadow-sm backdrop-blur-md border border-slate-700/50">
          Room: <span className="font-bold text-primary tracking-widest">{room.id}</span>
        </div>
        
        {room.state !== 'Lobby' && room.state !== 'GameOver' && (
          <div className="bg-slate-800/80 px-4 py-2 rounded-lg text-sm shadow-sm backdrop-blur-md border border-slate-700/50 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Round {room.currentRoundIndex + 1} / 5</span>
          </div>
        )}
      </div>

      {room.state === 'Lobby' && (
        <Lobby room={room} myId={socket.id} />
      )}

      {room.state === 'RoundActive' && currentQuestion && (
        <SliderInterface 
          room={room} 
          myId={socket.id} 
          question={currentQuestion} 
        />
      )}

      {room.state === 'RoundReveal' && currentQuestion && roundRevealActual !== null && (
        <RevealScreen 
          room={room} 
          myId={socket.id} 
          question={currentQuestion} 
          actual={roundRevealActual} 
        />
      )}

      {room.state === 'GameOver' && gameOverRankings && (
        <div className="flex flex-col items-center justify-center flex-1 space-y-8 animate-in fade-in zoom-in duration-500">
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary mb-4">
            Game Over!
          </h2>
          <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl overflow-hidden">
            {gameOverRankings.map((p, idx) => (
              <div key={p.id} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
                <div className="flex items-center space-x-4">
                  <span className={`font-black text-2xl w-6 flex justify-center ${idx === 0 ? 'text-accent' : 'text-slate-500'}`}>
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-xl">{p.name}</span>
                </div>
                <span className="text-xl font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-700/50">
                  {p.totalScore} <span className="text-slate-500 text-sm">pts</span>
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => router.push('/')}
            className="mt-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-pulse h-8 w-32 bg-slate-800 rounded"></div></div>}>
      <GameContent />
    </Suspense>
  );
}

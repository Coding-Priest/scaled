"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Ruler } from 'lucide-react';

export default function Home() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    // We pass name and room code via query params so the game page can init the socket
    const query = new URLSearchParams({ name });
    if (roomCode) query.append('room', roomCode.toUpperCase());
    
    router.push(`/game?${query.toString()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-primary/20 p-4 rounded-full">
            <Ruler className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-4xl font-extrabold text-center mb-2 tracking-tight">Scaled</h1>
        <p className="text-slate-400 text-center mb-8">Test your intuition for scale.</p>
        
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="e.g. Architect"
              maxLength={15}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Room Code (Optional)</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all uppercase"
              placeholder="Leave blank to create"
              maxLength={4}
            />
          </div>
          
          <button 
            type="submit"
            disabled={!name}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {roomCode ? 'Join Game' : 'Create Game'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}

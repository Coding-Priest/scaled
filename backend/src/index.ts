import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Room, ClientToServerEvents, ServerToClientEvents, Player, Question } from './types';
import { QUESTIONS } from './data/questions';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = new Map<string, Room>();

const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

const calculateScore = (guess: number, actual: number) => {
  const error = Math.abs(guess - actual) / actual;
  // Let's say max score is 1000. 100% error = 0 points.
  let points = 1000 - (error * 1000);
  if (points < 0) points = 0;
  return Math.round(points);
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  let currentRoomId: string | null = null;

  const getPlayer = (roomId: string, socketId: string) => {
    return rooms.get(roomId)?.players.find(p => p.id === socketId);
  };

  socket.on('joinRoom', (playerName, roomCode) => {
    let roomId = roomCode?.toUpperCase();
    if (!roomId) {
      roomId = generateRoomCode();
      while (rooms.has(roomId)) roomId = generateRoomCode();
      rooms.set(roomId, {
        id: roomId,
        hostId: socket.id,
        state: 'Lobby',
        players: [],
        currentRoundIndex: 0,
        timer: 0
      });
    }

    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.players.length >= 4) {
      socket.emit('error', 'Room is full');
      return;
    }

    if (room.state !== 'Lobby') {
      socket.emit('error', 'Game already started');
      return;
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      isReady: false,
      currentGuess: null,
      totalScore: 0,
      sliderValue: null
    };

    room.players.push(player);
    currentRoomId = roomId;
    socket.join(roomId);
    
    io.to(roomId).emit('roomState', room);
  });

  socket.on('toggleReady', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const player = getPlayer(currentRoomId, socket.id);
    if (player) {
      player.isReady = !player.isReady;
      io.to(currentRoomId).emit('roomState', room);
    }
  });

  socket.on('startGame', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    // Only host can start and everyone must be ready
    if (!room || room.hostId !== socket.id) return;
    if (room.players.some(p => !p.isReady)) {
      socket.emit('error', 'Not all players are ready');
      return;
    }

    startRound(room);
  });

  socket.on('sliderMoved', (val) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room && room.state === 'RoundActive') {
      const player = getPlayer(currentRoomId, socket.id);
      if (player) {
        player.sliderValue = val;
        // Optionally broadcast slider movement so clients can see other players' slider moving
        socket.to(currentRoomId).emit('playerSliderMoved', player.id, val);
      }
    }
  });

  socket.on('submitGuess', (guess) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room && room.state === 'RoundActive') {
      const player = getPlayer(currentRoomId, socket.id);
      if (player) {
        player.currentGuess = guess;
        player.sliderValue = guess;
        io.to(currentRoomId).emit('roomState', room);
        
        // Check if everyone has submitted
        if (room.players.every(p => p.currentGuess !== null)) {
          revealRound(room);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(currentRoomId);
        } else {
          // reassing host if host left
          if (room.hostId === socket.id) room.hostId = room.players[0].id;
          io.to(currentRoomId).emit('roomState', room);
        }
      }
    }
  });
});

const startRound = (room: Room) => {
  room.state = 'RoundActive';
  room.timer = 15; // 15 seconds
  room.players.forEach(p => {
    p.currentGuess = null;
    p.sliderValue = null;
    p.isReady = false; // Reset ready for next round waiting, if needed
  });
  
  io.to(room.id).emit('question', QUESTIONS[room.currentRoundIndex]);
  io.to(room.id).emit('roomState', room);
};

const revealRound = (room: Room) => {
  if (room.state !== 'RoundActive') return; // Prevent double reveal
  room.state = 'RoundReveal';
  room.timer = 8; // Screen stays for 8 sec
  
  const actual = QUESTIONS[room.currentRoundIndex].actual;
  
  // Calculate score for everyone
  room.players.forEach(p => {
    // If someone didn't submit, take their last slider position or min bound
    if (p.currentGuess === null) {
      p.currentGuess = p.sliderValue !== null ? p.sliderValue : QUESTIONS[room.currentRoundIndex].min;
    }
    const pts = calculateScore(p.currentGuess!, actual);
    p.totalScore += pts;
  });

  io.to(room.id).emit('roomState', room);
  io.to(room.id).emit('roundReveal', actual);
};

// Global Server Tick
setInterval(() => {
  rooms.forEach(room => {
    if (room.state === 'RoundActive') {
      room.timer -= 1;
      io.to(room.id).emit('roomState', room);
      if (room.timer <= 0) {
        revealRound(room);
      }
    } else if (room.state === 'RoundReveal') {
      room.timer -= 1;
      io.to(room.id).emit('roomState', room);
      if (room.timer <= 0) {
        room.currentRoundIndex += 1;
        if (room.currentRoundIndex >= QUESTIONS.length) {
          room.state = 'GameOver';
          io.to(room.id).emit('roomState', room);
          // Send Rankings
          const rankings = [...room.players].sort((a,b) => b.totalScore - a.totalScore);
          io.to(room.id).emit('gameOver', rankings);
        } else {
          startRound(room);
        }
      }
    }
  });
}, 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

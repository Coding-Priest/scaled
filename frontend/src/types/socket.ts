import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from './game';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket']
});

export type GameState = 'Lobby' | 'RoundActive' | 'RoundReveal' | 'GameOver';

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  currentGuess: number | null;
  totalScore: number;
  sliderValue: number | null;
}

export interface Question {
  id: string;
  category: string;
  target: string;
  unit: string;
  actual: number;
  min: number;
  max: number;
}

export interface Room {
  id: string;
  hostId: string;
  state: GameState;
  players: Player[];
  currentRoundIndex: number;
  timer: number;
}

export interface ServerToClientEvents {
  roomState: (room: Room) => void;
  error: (msg: string) => void;
  question: (q: Question) => void;
  roundReveal: (actual: number) => void;
  gameOver: (rankings: Player[]) => void;
  playerSliderMoved: (playerId: string, value: number) => void;
}

export interface ClientToServerEvents {
  joinRoom: (playerName: string, roomCode?: string) => void;
  toggleReady: () => void;
  startGame: () => void;
  submitGuess: (guess: number) => void;
  sliderMoved: (guess: number) => void;
}

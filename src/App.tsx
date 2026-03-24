/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Music, Trophy, Gamepad2, Keyboard } from 'lucide-react';

// --- Custom Hooks ---
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// --- Music Player Data ---
const TRACKS = [
  {
    id: 1,
    title: "Neon Dreams (AI Generated)",
    artist: "CyberSynth AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/400/400"
  },
  {
    id: 2,
    title: "Digital Horizon (AI Generated)",
    artist: "Neural Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/400/400"
  },
  {
    id: 3,
    title: "Quantum Groove (AI Generated)",
    artist: "Algorhythm",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/400/400"
  }
];

// --- Snake Game Constants ---
type Point = { x: number, y: number };
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleEnded = () => {
    nextTrack();
  };

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const directionQueue = useRef<Point[]>([]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        setIsPaused(p => !p);
        return;
      }

      if (gameOver || isPaused) return;

      const lastDir = directionQueue.current.length > 0 
        ? directionQueue.current[directionQueue.current.length - 1] 
        : direction;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (lastDir.y === 0) directionQueue.current.push({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (lastDir.y === 0) directionQueue.current.push({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (lastDir.x === 0) directionQueue.current.push({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (lastDir.x === 0) directionQueue.current.push({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameOver, isPaused]);

  // Game Loop
  useInterval(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      let currentDir = direction;
      if (directionQueue.current.length > 0) {
        currentDir = directionQueue.current.shift()!;
        setDirection(currentDir);
      }

      const head = prevSnake[0];
      const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop(); // Remove tail if no food eaten
      }

      return newSnake;
    });
  }, gameOver || isPaused ? null : GAME_SPEED);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionQueue.current = [];
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-purple-500/30">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <header className="mb-8 text-center z-10 mt-4">
        <h1 className="text-6xl md:text-8xl font-glitch tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-green-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] flex items-center justify-center gap-4 animate-pulse">
          <Gamepad2 className="w-12 h-12 md:w-16 md:h-16 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
          NEON SNAKE
        </h1>
        <p className="text-green-400 mt-2 font-digital text-xl tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">Synthwave Edition</p>
      </header>

      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
        
        {/* Left: Music Player (col-span-4) */}
        <div className="col-span-1 lg:col-span-4 bg-gray-900/60 backdrop-blur-xl border border-purple-500/20 p-6 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.1)] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Music className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold tracking-wide text-purple-100">NOW PLAYING</h2>
          </div>

          <div className="relative aspect-square w-full max-w-[240px] mx-auto mb-6 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.2)] group">
            <img 
              src={currentTrack.cover} 
              alt="Album Cover" 
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />
            {isPlaying && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                <span className="w-1.5 h-4 bg-purple-500 rounded-full animate-[bounce_1s_infinite_0ms]" />
                <span className="w-1.5 h-6 bg-purple-500 rounded-full animate-[bounce_1s_infinite_200ms]" />
                <span className="w-1.5 h-3 bg-purple-500 rounded-full animate-[bounce_1s_infinite_400ms]" />
                <span className="w-1.5 h-5 bg-purple-500 rounded-full animate-[bounce_1s_infinite_100ms]" />
              </div>
            )}
          </div>

          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white truncate px-2">{currentTrack.title}</h3>
            <p className="text-purple-400/80 text-sm font-medium mt-1">{currentTrack.artist}</p>
          </div>

          <div className="flex items-center justify-center gap-6 mb-8">
            <button onClick={prevTrack} className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-14 h-14 flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all transform hover:scale-105"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3 px-4">
            <button onClick={() => setVolume(v => v === 0 ? 0.5 : 0)} className="text-gray-400 hover:text-white transition-colors">
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* Right: Snake Game (col-span-8) */}
        <div className="col-span-1 lg:col-span-8 bg-gray-900/60 backdrop-blur-xl border border-green-500/20 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(34,197,94,0.1)] flex flex-col items-center relative">
          
          <div className="w-full max-w-[500px] flex justify-between items-end mb-6 px-2">
            <div>
              <p className="text-green-500/80 font-mono text-sm font-bold mb-1 tracking-wider">SCORE</p>
              <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] font-mono">
                {score.toString().padStart(4, '0')}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" title="Controls: WASD / Arrows">
                <Keyboard className="w-7 h-7" />
              </div>
              <button 
                onClick={resetGame}
                className="text-purple-400 hover:text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] hover:drop-shadow-[0_0_15px_rgba(168,85,247,1)] transition-all transform hover:scale-110 hover:rotate-180 duration-500"
                title="Reset Game"
              >
                <RefreshCw className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* Game Board Container */}
          <div className="relative w-full max-w-[500px] aspect-square">
            <div 
              className="absolute inset-0 grid bg-gray-950/80 border-2 border-green-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.15)]"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isSnake = snake.some(segment => segment.x === x && segment.y === y);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isFood = food.x === x && food.y === y;

                return (
                  <div 
                    key={i} 
                    className={`
                      w-full h-full border-[0.5px] border-green-900/10
                      ${isHead ? 'bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)] rounded-sm z-10 relative' : ''}
                      ${isSnake && !isHead ? 'bg-green-500/70 shadow-[0_0_8px_rgba(34,197,94,0.4)] rounded-sm' : ''}
                      ${isFood ? 'bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.9)] rounded-full animate-pulse scale-[0.6]' : ''}
                    `}
                  >
                    {isHead && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-1 bg-gray-900 rounded-full opacity-50"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-20">
                <Trophy className="w-16 h-16 text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                <h3 className="text-3xl font-black text-white mb-2 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">GAME OVER</h3>
                <p className="text-green-400 font-mono text-lg mb-6">FINAL SCORE: {score}</p>
                <button 
                  onClick={resetGame}
                  className="px-8 py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-black rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all transform hover:scale-105 tracking-widest"
                >
                  PLAY AGAIN
                </button>
              </div>
            )}

            {/* Paused Overlay */}
            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-20">
                <h3 className="text-3xl font-black text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">PAUSED</h3>
                <p className="text-gray-400 font-mono text-sm mt-2">Press SPACE to resume</p>
              </div>
            )}
          </div>

        </div>
      </div>

      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleEnded}
      />
    </div>
  );
}

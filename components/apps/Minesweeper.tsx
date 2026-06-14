"use client";

import React, { useState, useEffect, useRef } from "react";
import { Smile, Frown, Award, Timer as TimerIcon, Play, RefreshCw, Volume2, VolumeX, Bomb } from "lucide-react";
import { cn } from "@/lib/utils";

// Web Audio API retro sound synthesizer helper
class SoundEffects {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  constructor() {}

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  public playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playFlag() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  public playWin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.ctx.resume();
    // Happy retro arpeggio notes
    const now = this.ctx.currentTime;
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    playNote(523.25, now, 0.1); // C5
    playNote(659.25, now + 0.1, 0.1); // E5
    playNote(783.99, now + 0.2, 0.1); // G5
    playNote(1046.50, now + 0.3, 0.25); // C6
  }
}

type Difficulty = "easy" | "medium";

type Cell = {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

export const Minesweeper: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(9);
  const [mineCount, setMineCount] = useState(10);

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [timer, setTimer] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [bestTimes, setBestTimes] = useState<Record<Difficulty, number>>({ easy: 999, medium: 999 });
  const [isFaceSurprised, setIsFaceSurprised] = useState(false);
  const [muted, setMuted] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SoundEffects | null>(null);

  // Initialize synth
  useEffect(() => {
    synthRef.current = new SoundEffects();
    // Retrieve best times from local storage
    const stored = localStorage.getItem("minesweeper_best_times");
    if (stored) {
      try {
        setBestTimes(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse best times", e);
      }
    }
  }, []);

  // Update mute state
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.muted = muted;
    }
  }, [muted]);

  // Adjust board sizing on difficulty changes
  useEffect(() => {
    if (difficulty === "easy") {
      setRows(9);
      setCols(9);
      setMineCount(10);
    } else {
      setRows(16);
      setCols(16);
      setMineCount(40);
    }
  }, [difficulty]);

  // Re-generate grid when rows/cols/mineCount are set
  useEffect(() => {
    resetGame();
  }, [rows, cols, mineCount]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const resetGame = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimer(0);
    setGameState("idle");
    setFlagCount(0);

    // Build empty board
    const newGrid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowCells: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        rowCells.push({
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(rowCells);
    }
    setGrid(newGrid);
  };

  // Generate mine placements AFTER first click for first-click safety!
  const generateMines = (startR: number, startC: number, currentGrid: Cell[][]) => {
    let minesPlaced = 0;
    const size = rows * cols;
    
    // Safety buffer: keep the start cell and its neighbors mine-free if possible
    const safetySet = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = startR + dr;
        const nc = startC + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          safetySet.add(`${nr},${nc}`);
        }
      }
    }

    while (minesPlaced < mineCount) {
      const randR = Math.floor(Math.random() * rows);
      const randC = Math.floor(Math.random() * cols);
      
      const key = `${randR},${randC}`;
      // Ensure we don't place mine on safety cells or duplicates
      if (!currentGrid[randR][randC].isMine && (safetySet.size >= size - mineCount || !safetySet.has(key))) {
        currentGrid[randR][randC].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mine numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currentGrid[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (currentGrid[nr][nc].isMine) count++;
            }
          }
        }
        currentGrid[r][c].neighborMines = count;
      }
    }
  };

  // Start timer loop
  const startTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer((t) => Math.min(999, t + 1));
    }, 1000);
  };

  // Reveal Cell Logic
  const revealCell = (r: number, c: number) => {
    if (gameState === "lost" || gameState === "won") return;
    
    let currentGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    let currentGameState = gameState;

    synthRef.current?.playClick();

    // First Click Safety Trigger
    if (gameState === "idle") {
      currentGameState = "playing";
      setGameState("playing");
      generateMines(r, c, currentGrid);
      startTimer();
    }

    const cell = currentGrid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;

    // Check hit mine -> Game Over
    if (cell.isMine) {
      triggerGameOver(r, c, currentGrid);
      return;
    }

    // Cascade reveal if neighbors has 0 mines
    if (cell.neighborMines === 0) {
      const queue: { r: number; c: number }[] = [{ r, c }];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = curr.r + dr;
            const nc = curr.c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const neighbor = currentGrid[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                neighbor.isRevealed = true;
                if (neighbor.neighborMines === 0) {
                  queue.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      }
    }

    // Check Win State
    checkWinCondition(currentGrid, currentGameState);
  };

  // Flag Cell Logic
  const flagCell = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState === "lost" || gameState === "won" || gameState === "idle") {
      if (gameState === "idle") {
        // Start timer and game on first flag too
        setGameState("playing");
        startTimer();
        const currentGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
        generateMines(r, c, currentGrid);
        currentGrid[r][c].isFlagged = true;
        setFlagCount(1);
        setGrid(currentGrid);
        synthRef.current?.playFlag();
      }
      return;
    }

    const currentGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = currentGrid[r][c];
    if (cell.isRevealed) return;

    synthRef.current?.playFlag();

    cell.isFlagged = !cell.isFlagged;
    setFlagCount((prev) => prev + (cell.isFlagged ? 1 : -1));
    setGrid(currentGrid);
  };

  // Trigger Loss
  const triggerGameOver = (hitR: number, hitC: number, currentGrid: Cell[][]) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameState("lost");
    synthRef.current?.playExplosion();

    // Reveal all mines, highlight incorrect flags
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = currentGrid[r][c];
        if (cell.isMine) {
          if (!cell.isFlagged) {
            cell.isRevealed = true;
          }
        } else if (cell.isFlagged) {
          // False flag indicator
          cell.neighborMines = -1; // special marker for false flags
        }
      }
    }
    // Highlight the detonated mine
    currentGrid[hitR][hitC].neighborMines = -2; // detonated mine marker
    setGrid(currentGrid);
  };

  // Check Win Condition
  const checkWinCondition = (currentGrid: Cell[][], currentGameState: "idle" | "playing" | "won" | "lost") => {
    let unrevealedSafeCells = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = currentGrid[r][c];
        if (!cell.isMine && !cell.isRevealed) {
          unrevealedSafeCells++;
        }
      }
    }

    if (unrevealedSafeCells === 0) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setGameState("won");
      synthRef.current?.playWin();

      // Flag all remaining mines
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = currentGrid[r][c];
          if (cell.isMine) {
            cell.isFlagged = true;
          }
        }
      }
      setFlagCount(mineCount);

      // Check for New Best Time
      setBestTimes((prev) => {
        if (timer < prev[difficulty]) {
          const updated = { ...prev, [difficulty]: timer };
          localStorage.setItem("minesweeper_best_times", JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
    setGrid(currentGrid);
  };

  // Chord click - auto reveal neighbors if flag count matches target
  const handleChordClick = (r: number, c: number) => {
    if (gameState !== "playing") return;

    const currentGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = currentGrid[r][c];
    if (!cell.isRevealed || cell.neighborMines === 0) return;

    let flagCountNearby = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (currentGrid[nr][nc].isFlagged) flagCountNearby++;
        }
      }
    }

    // If flagged neighbors match, reveal all unflagged neighbors
    if (flagCountNearby === cell.neighborMines) {
      let hitMine = false;
      let mineR = 0;
      let mineC = 0;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const neighbor = currentGrid[nr][nc];
            if (!neighbor.isRevealed && !neighbor.isFlagged) {
              neighbor.isRevealed = true;
              if (neighbor.isMine) {
                hitMine = true;
                mineR = nr;
                mineC = nc;
              } else if (neighbor.neighborMines === 0) {
                // Cascade reveal 0s
                const cascadeQueue = [{ r: nr, c: nc }];
                while (cascadeQueue.length > 0) {
                  const curr = cascadeQueue.shift()!;
                  for (let ddr = -1; ddr <= 1; ddr++) {
                    for (let ddc = -1; ddc <= 1; ddc++) {
                      const nnr = curr.r + ddr;
                      const nnc = curr.c + ddc;
                      if (nnr >= 0 && nnr < rows && nnc >= 0 && nnc < cols) {
                        const n = currentGrid[nnr][nnc];
                        if (!n.isRevealed && !n.isFlagged && !n.isMine) {
                          n.isRevealed = true;
                          if (n.neighborMines === 0) {
                            cascadeQueue.push({ r: nnr, c: nnc });
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (hitMine) {
        triggerGameOver(mineR, mineC, currentGrid);
      } else {
        checkWinCondition(currentGrid, "playing");
      }
    }
  };

  const getCellClassName = (cell: Cell) => {
    if (!cell.isRevealed) {
      return cn(
        "border-[3px] border-t-white border-l-white border-b-zinc-400 border-r-zinc-400 bg-zinc-200 hover:bg-zinc-150 active:border-[1px] active:border-zinc-300",
        cell.isFlagged && "bg-zinc-200"
      );
    }
    
    // Revealed states
    if (cell.isMine) {
      if (cell.neighborMines === -2) return "bg-red-500 border border-zinc-400"; // detonated
      return "bg-zinc-300 border border-zinc-400"; // standard revealed mine
    }

    return "bg-zinc-200 border border-zinc-300";
  };

  const getNumberColorClass = (n: number) => {
    switch (n) {
      case 1: return "text-blue-600 font-extrabold";
      case 2: return "text-emerald-600 font-extrabold";
      case 3: return "text-rose-600 font-extrabold";
      case 4: return "text-indigo-800 font-extrabold";
      case 5: return "text-red-800 font-extrabold";
      case 6: return "text-cyan-800 font-extrabold";
      case 7: return "text-zinc-800 font-extrabold";
      case 8: return "text-zinc-500 font-extrabold";
      default: return "";
    }
  };

  const formatStatsDigits = (n: number) => {
    if (n < 0) return "000";
    if (n > 999) return "999";
    return n.toString().padStart(3, "0");
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f3f3] text-black font-mono select-none p-3.5 items-center justify-between border border-zinc-300 shadow-[inset_1px_1px_0_#fff]">
      
      {/* Menu / Options bar */}
      <div className="w-full flex items-center justify-between border-b border-zinc-300 pb-2 mb-2 select-none">
        {/* Difficulty Controls */}
        <div className="flex bg-zinc-200 border border-zinc-400 p-0.5 rounded gap-0.5">
          {(["easy", "medium"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={cn(
                "px-2.5 py-0.5 text-[10px] font-bold rounded uppercase cursor-default transition-all duration-100",
                difficulty === diff
                  ? "bg-zinc-700 text-white font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Audio Mute & Best Times status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(!muted)}
            className="p-1 rounded border border-zinc-400 bg-zinc-200 hover:bg-zinc-300 transition-colors cursor-default"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-700" />}
          </button>
          <div 
            className="text-[9px] border border-zinc-400 bg-zinc-200 rounded px-2 py-0.5 text-zinc-500 flex items-center gap-1 font-bold"
            title={`Best score for ${difficulty}`}
          >
            <Award className="w-3 h-3 text-amber-500" />
            <span>BEST: {bestTimes[difficulty] === 999 ? "---" : `${bestTimes[difficulty]}s`}</span>
          </div>
        </div>
      </div>

      {/* Classic Windows Retro Style Game Frame Wrapper */}
      <div className="border-[3px] border-b-white border-r-white border-t-zinc-400 border-l-zinc-400 bg-zinc-300 p-2.5 flex flex-col gap-3.5 shadow-sm">
        
        {/* Status indicator bar (Mines left, Smiley, Timer) */}
        <div className="border-[2px] border-t-zinc-400 border-l-zinc-400 border-b-white border-r-white bg-zinc-300 p-1 px-2.5 flex items-center justify-between">
          
          {/* Flag Counter */}
          <div className="bg-black text-[#ff0000] font-bold text-xl px-1.5 py-0.5 rounded font-mono w-14 text-right border border-zinc-400 tracking-wider">
            {formatStatsDigits(mineCount - flagCount)}
          </div>

          {/* Smiley Reset Control */}
          <button
            onMouseDown={() => setIsFaceSurprised(true)}
            onMouseUp={() => setIsFaceSurprised(false)}
            onClick={resetGame}
            className="w-10 h-10 border-[3px] border-t-white border-l-white border-b-zinc-400 border-r-zinc-400 bg-zinc-200 hover:bg-zinc-150 active:border-[1px] active:border-zinc-300 flex items-center justify-center cursor-default outline-none shadow-sm"
          >
            {gameState === "won" && <span className="text-xl">😎</span>}
            {gameState === "lost" && <span className="text-xl">😵</span>}
            {gameState !== "won" && gameState !== "lost" && (
              isFaceSurprised ? <span className="text-xl">😮</span> : <span className="text-xl">🙂</span>
            )}
          </button>

          {/* Timer Clock */}
          <div className="bg-black text-[#ff0000] font-bold text-xl px-1.5 py-0.5 rounded font-mono w-14 text-right border border-zinc-400 tracking-wider">
            {formatStatsDigits(timer)}
          </div>
        </div>

        {/* Minesweeper Grid Board */}
        <div 
          className="border-[3px] border-t-zinc-400 border-l-zinc-400 border-b-white border-r-white bg-zinc-400 overflow-auto max-w-[380px] max-h-[380px]"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div 
            className="grid"
            style={{ 
              gridTemplateColumns: `repeat(${cols}, 24px)`,
              gridTemplateRows: `repeat(${rows}, 24px)`
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r},${c}`}
                  className={cn(
                    "w-6 h-6 flex items-center justify-center text-xs cursor-default select-none relative font-sans",
                    getCellClassName(cell)
                  )}
                  onClick={() => revealCell(r, c)}
                  onDoubleClick={() => handleChordClick(r, c)}
                  onContextMenu={(e) => flagCell(e, r, c)}
                  onMouseDown={() => { if (gameState === "playing") setIsFaceSurprised(true); }}
                  onMouseUp={() => setIsFaceSurprised(false)}
                >
                  {/* Cell states drawing */}
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <Bomb className="w-3.5 h-3.5 text-black" />
                    ) : cell.neighborMines > 0 ? (
                      <span className={getNumberColorClass(cell.neighborMines)}>
                        {cell.neighborMines}
                      </span>
                    ) : null
                  ) : cell.isFlagged ? (
                    <span className="text-[10px] text-red-600 font-extrabold animate-pulse">🚩</span>
                  ) : null}

                  {/* False flag display (Game Over) */}
                  {cell.isRevealed && cell.neighborMines === -1 && (
                    <div className="absolute inset-0 flex items-center justify-center text-rose-500 font-bold bg-zinc-200/50">
                      ❌
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rules / Hint bar */}
      <div className="w-full text-center text-[9px] text-zinc-500 dark:text-zinc-600 font-sans mt-2 leading-tight">
        Left-click cell to reveal. Right-click to place flag (🚩).<br />
        Double-click open numbered cell to auto-chord reveal neighbors.
      </div>
    </div>
  );
};

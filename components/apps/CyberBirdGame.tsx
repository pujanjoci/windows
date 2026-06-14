"use client";

import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, RotateCcw, HelpCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Web Audio API retro synthesizer helper
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

  public playJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.ctx.resume();
    // Retro square wave jump sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playScore() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.ctx.resume();
    // Retro dual-tone score sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(330, this.ctx.currentTime); // E4
    osc.frequency.setValueAtTime(440, this.ctx.currentTime + 0.08); // A4

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playCrash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.ctx.resume();
    // Retro noise crash rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
  width: number;
}

export const CyberBirdGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showControlsInfo, setShowControlsInfo] = useState(true);

  // Sound Synth instance
  const synthRef = useRef<SoundEffects | null>(null);

  // Ref tracking values for game loop to avoid stale React closures
  const stateRef = useRef({
    gameState: "idle" as "idle" | "playing" | "gameover",
    bird: {
      x: 80,
      y: 200,
      radius: 10,
      velocity: 0,
      gravity: 0.23,
      lift: -5.2,
      rotation: 0,
    },
    pipes: [] as Pipe[],
    particles: [] as Particle[],
    bgOffset: 0,
    frame: 0,
    score: 0,
    pipeSpeed: 2.0,
    pipeSpawnInterval: 120, // frames
    pipeGap: 135,
    shakeDuration: 0,
    canvasWidth: 500,
    canvasHeight: 400,
  });

  // Fetch High Score from Local Storage on mount
  useEffect(() => {
    synthRef.current = new SoundEffects();
    const stored = localStorage.getItem("cyberbird_highscore");
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        setHighScore(parsed);
      }
    }
  }, []);

  // Update sound synth mute state
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.muted = muted;
    }
  }, [muted]);

  // Sync state ref
  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  // Jump Action
  const jump = () => {
    const s = stateRef.current;
    if (s.gameState === "gameover") return;

    if (s.gameState === "idle") {
      // Start Game
      setGameState("playing");
      s.gameState = "playing";
      s.bird.y = s.canvasHeight / 2;
      s.bird.velocity = s.bird.lift;
      s.pipes = [];
      s.particles = [];
      s.score = 0;
      setScore(0);
      s.pipeSpeed = 2.0;
      s.pipeGap = 135;
      s.frame = 0;
      synthRef.current?.playJump();
      return;
    }

    s.bird.velocity = s.bird.lift;
    s.bird.rotation = -0.4; // rotate upward slightly
    synthRef.current?.playJump();

    // Retro blocky particles on flap
    const isDark = document.documentElement.classList.contains("dark");
    const pColor = isDark ? "#a1a1aa" : "#888888";
    for (let i = 0; i < 3; i++) {
      s.particles.push({
        x: s.bird.x - 10,
        y: s.bird.y + (Math.random() - 0.5) * 6,
        vx: -1.0 - Math.random() * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 3,
        color: pColor,
        alpha: 0.8,
        decay: 0.05,
      });
    }
  };

  // Setup Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Setup canvas sizes & primary loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth || 500;
      const height = parent.clientHeight || 400;

      canvas.width = width;
      canvas.height = height;
      stateRef.current.canvasWidth = width;
      stateRef.current.canvasHeight = height;

      if (stateRef.current.gameState === "idle") {
        stateRef.current.bird.y = height / 2;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initial positioning
    stateRef.current.bird.y = canvas.height / 2;

    const gameLoop = () => {
      const s = stateRef.current;
      s.frame++;

      const isDark = document.documentElement.classList.contains("dark");
      const primaryColor = isDark ? "#e4e4e7" : "#535353"; // zinc-200 or grey-700
      const groundBgColor = isDark ? "#27272a" : "#e4e4e7"; // ground fill

      // Canvas Screen Shake Effect on crash
      ctx.save();
      if (s.shakeDuration > 0) {
        const dx = (Math.random() - 0.5) * 6;
        const dy = (Math.random() - 0.5) * 6;
        ctx.translate(dx, dy);
        s.shakeDuration--;
      }

      // Draw Background (Classic flat gray/dark gray)
      ctx.fillStyle = isDark ? "#18181b" : "#f4f4f5";
      ctx.fillRect(0, 0, s.canvasWidth, s.canvasHeight);

      // Scrolling clouds (flat pixel retro style)
      ctx.fillStyle = isDark ? "rgba(228, 228, 231, 0.08)" : "rgba(83, 83, 83, 0.08)";
      const cloudSpeed = s.gameState === "playing" ? s.pipeSpeed * 0.15 : 0.1;
      s.bgOffset = (s.bgOffset + cloudSpeed) % s.canvasWidth;

      const drawCloud = (cx: number, cy: number) => {
        // Flat 8-bit cloud shapes
        ctx.fillRect(cx, cy, 38, 8);
        ctx.fillRect(cx + 6, cy - 5, 26, 5);
        ctx.fillRect(cx + 12, cy - 8, 12, 3);
      };
      drawCloud((80 - s.bgOffset + s.canvasWidth) % s.canvasWidth, 50);
      drawCloud((320 - s.bgOffset + s.canvasWidth) % s.canvasWidth, 80);

      // Flat Ground line
      const groundY = s.canvasHeight - 20;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(s.canvasWidth, groundY);
      ctx.stroke();

      // Scrolling ground details (dots/hashes)
      ctx.fillStyle = isDark ? "rgba(228, 228, 231, 0.3)" : "rgba(83, 83, 83, 0.3)";
      const scrollOffset = (s.frame * (s.gameState === "playing" ? s.pipeSpeed : 0.5)) % 60;
      for (let i = -scrollOffset; i < s.canvasWidth; i += 60) {
        ctx.fillRect(i, groundY + 4, 3, 2);
        ctx.fillRect(i + 25, groundY + 10, 2, 2);
        ctx.fillRect(i + 45, groundY + 6, 4, 1);
      }

      // Render Flat blocky Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size); // square pixels
        ctx.restore();
      }

      // PHYSICS & LOGIC WHEN PLAYING
      if (s.gameState === "playing") {
        // Apply Gravity
        s.bird.velocity += s.bird.gravity;
        s.bird.y += s.bird.velocity;
        s.bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 8, s.bird.velocity * 0.08));

        // Constrain to Ground & Sky
        if (s.bird.y - s.bird.radius < 0) {
          s.bird.y = s.bird.radius;
          s.bird.velocity = 0;
        }

        if (s.bird.y + s.bird.radius >= groundY) {
          triggerGameOver();
        }

        // Spawn Pipes
        if (s.frame % s.pipeSpawnInterval === 0) {
          const pipeWidth = 75;
          const minHeight = 40;
          const maxHeight = groundY - s.pipeGap - minHeight;
          const topHeight = minHeight + Math.random() * (maxHeight - minHeight);
          const bottomHeight = groundY - s.pipeGap - topHeight;

          s.pipes.push({
            x: s.canvasWidth,
            topHeight,
            bottomHeight,
            passed: false,
            width: pipeWidth,
          });
        }

        // Speed ramp up slightly as score increases
        const currentSpeed = s.pipeSpeed + Math.min(2.0, s.score * 0.08);

        // Move and Check Collision on Pipes
        for (let i = s.pipes.length - 1; i >= 0; i--) {
          const pipe = s.pipes[i];
          pipe.x -= currentSpeed;

          // Remove out of bound pipes
          if (pipe.x + pipe.width < 0) {
            s.pipes.splice(i, 1);
            continue;
          }

          // Collision check
          const b = s.bird;
          const topCollides = 
            b.x + b.radius > pipe.x &&
            b.x - b.radius < pipe.x + pipe.width &&
            b.y - b.radius < pipe.topHeight;

          const bottomCollides = 
            b.x + b.radius > pipe.x &&
            b.x - b.radius < pipe.x + pipe.width &&
            b.y + b.radius > groundY - pipe.bottomHeight;

          if (topCollides || bottomCollides) {
            triggerGameOver();
          }

          // Score Increment
          if (!pipe.passed && pipe.x + pipe.width / 2 < b.x) {
            pipe.passed = true;
            s.score++;
            setScore(s.score);
            synthRef.current?.playScore();

            // Narrow gap slightly to increase difficulty
            s.pipeGap = Math.max(110, 135 - s.score * 0.8);
          }
        }
      }

      // Draw Retro Pipes (Classic outline with block shadow lines - NES/GameBoy style)
      s.pipes.forEach((pipe) => {
        ctx.save();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.5;

        // Top Pipe
        ctx.fillStyle = groundBgColor;
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
        ctx.strokeRect(pipe.x, -5, pipe.width, pipe.topHeight + 5);

        // Top Pipe Lip (Cap)
        const capHeight = 14;
        const capOffset = 4;
        ctx.fillRect(pipe.x - capOffset, pipe.topHeight - capHeight, pipe.width + capOffset * 2, capHeight);
        ctx.strokeRect(pipe.x - capOffset, pipe.topHeight - capHeight, pipe.width + capOffset * 2, capHeight);

        // Retro vertical hatching detail on cap/lip
        ctx.fillStyle = isDark ? "rgba(228, 228, 231, 0.15)" : "rgba(83, 83, 83, 0.15)";
        ctx.fillRect(pipe.x - capOffset + 4, pipe.topHeight - capHeight + 3, 5, capHeight - 6);
        ctx.fillRect(pipe.x + pipe.width + capOffset - 9, pipe.topHeight - capHeight + 3, 5, capHeight - 6);

        // Bottom Pipe
        ctx.fillStyle = groundBgColor;
        ctx.fillRect(pipe.x, groundY - pipe.bottomHeight, pipe.width, pipe.bottomHeight);
        ctx.strokeRect(pipe.x, groundY - pipe.bottomHeight, pipe.width, pipe.bottomHeight + 5);

        // Bottom Pipe Lip
        ctx.fillRect(pipe.x - capOffset, groundY - pipe.bottomHeight, pipe.width + capOffset * 2, capHeight);
        ctx.strokeRect(pipe.x - capOffset, groundY - pipe.bottomHeight, pipe.width + capOffset * 2, capHeight);

        // Shading detail on bottom cap
        ctx.fillStyle = isDark ? "rgba(228, 228, 231, 0.15)" : "rgba(83, 83, 83, 0.15)";
        ctx.fillRect(pipe.x - capOffset + 4, groundY - pipe.bottomHeight + 3, 5, capHeight - 6);
        ctx.fillRect(pipe.x + pipe.width + capOffset - 9, groundY - pipe.bottomHeight + 3, 5, capHeight - 6);

        ctx.restore();
      });

      // Draw Retro Flappy Bird Sprite (Pixel Art 12x10)
      ctx.save();
      ctx.translate(s.bird.x, s.bird.y);
      ctx.rotate(s.bird.rotation);

      // Sprite details
      const fillColor = isDark ? "#a1a1aa" : "#d4d4d8"; // inner fill
      const retroBird = [
        [0,0,0,0,1,1,1,1,1,1,0,0],
        [0,0,0,1,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,3,2,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,1,1,1,2,2,2,1,0],
        [1,2,2,1,2,2,2,1,2,1,4,1],
        [1,2,2,1,2,2,2,1,2,1,4,1],
        [0,1,2,2,1,1,1,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,1,1,1,1,1,0,0,0]
      ];

      const pixelSize = 2.0;
      const startX = - (retroBird[0].length * pixelSize) / 2;
      const startY = - (retroBird.length * pixelSize) / 2;

      for (let r = 0; r < retroBird.length; r++) {
        for (let c = 0; c < retroBird[r].length; c++) {
          const type = retroBird[r][c];
          if (type === 1) {
            ctx.fillStyle = primaryColor; // outline
            ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
          } else if (type === 2) {
            ctx.fillStyle = fillColor; // body fill
            ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
          } else if (type === 3) {
            ctx.fillStyle = isDark ? "#18181b" : "#ffffff"; // eye
            ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
          } else if (type === 4) {
            ctx.fillStyle = isDark ? "#f43f5e" : "#ea580c"; // beak (classic outline contrast)
            ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
          }
        }
      }

      ctx.restore();

      ctx.restore(); // screen shake restore

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const triggerGameOver = () => {
      const s = stateRef.current;
      if (s.gameState === "gameover") return;

      s.gameState = "gameover";
      setGameState("gameover");
      s.shakeDuration = 20;
      synthRef.current?.playCrash();

      // Blocky crash debris
      const isDark = document.documentElement.classList.contains("dark");
      const pColor = isDark ? "#e4e4e7" : "#535353";
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 3.5;
        s.particles.push({
          x: s.bird.x,
          y: s.bird.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 2,
          color: i % 2 === 0 ? pColor : (isDark ? "#71717a" : "#a1a1aa"),
          alpha: 1,
          decay: 0.03,
        });
      }

      setHighScore((prev) => {
        if (s.score > prev) {
          localStorage.setItem("cyberbird_highscore", s.score.toString());
          return s.score;
        }
        return prev;
      });
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    const s = stateRef.current;
    s.gameState = "idle";
    setGameState("idle");
    s.bird.y = s.canvasHeight / 2;
    s.bird.velocity = 0;
    s.bird.rotation = 0;
    s.pipes = [];
    s.particles = [];
    s.score = 0;
    setScore(0);
  };

  return (
    <div
      ref={containerRef}
      onClick={jump}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 select-none cursor-pointer group"
    >
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Retro HUD Bar */}
      <div className="absolute top-3 right-4 flex items-center pointer-events-none z-10 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
        {/* High Score Badge */}
        <div className="flex items-center gap-3 bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-300 dark:border-zinc-700 px-3 py-1 rounded shadow-sm">
          <div>
            SCORE: <span className="text-zinc-800 dark:text-zinc-100 font-extrabold">{score}</span>
          </div>
          <div className="w-[1px] h-3 bg-zinc-300 dark:bg-zinc-700" />
          <div>
            BEST: <span className="text-zinc-800 dark:text-zinc-100 font-extrabold">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Floating Control Icons */}
      <div className="absolute bottom-3 right-4 flex items-center gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMuted(!muted);
          }}
          className="p-1.5 rounded bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-95"
          title={muted ? "Unmute sound" : "Mute sound"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowControlsInfo(!showControlsInfo);
          }}
          className={cn(
            "p-1.5 rounded border transition-all shadow-sm active:scale-95",
            showControlsInfo 
              ? "bg-zinc-200 dark:bg-zinc-700 border-zinc-400 dark:border-zinc-600 text-zinc-800 dark:text-zinc-100" 
              : "bg-zinc-100/90 dark:bg-zinc-800/90 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          )}
          title="Toggle Instructions"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Controls Info overlay */}
      {showControlsInfo && gameState === "idle" && (
        <div className="absolute bottom-16 left-4 right-4 max-w-sm pointer-events-none z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-zinc-100/95 dark:bg-zinc-800/95 border border-zinc-300 dark:border-zinc-700 p-3 rounded shadow-lg text-zinc-800 dark:text-zinc-200">
            <div className="font-mono text-[10px] leading-normal">
              <p className="font-bold mb-1 uppercase tracking-wider">How to Play:</p>
              <p>Press <span className="font-bold border px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-900 dark:text-white">Spacebar</span>, <span className="font-bold border px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-900 dark:text-white">W</span>, or <span className="font-bold border px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-900 dark:text-white">Click/Tap</span> to flap wings and gain altitude. Avoid blocky pillars!</p>
            </div>
          </div>
        </div>
      )}

      {/* Idle / Play overlay */}
      {gameState === "idle" && (
        <div className="z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded bg-zinc-200/90 dark:bg-zinc-800/90 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mb-4 shadow-sm">
            <Play className="w-6 h-6 ml-1" />
          </div>
          <h2 className="text-sm font-bold tracking-widest text-zinc-700 dark:text-zinc-300 font-mono uppercase mb-1">
            Click to Start
          </h2>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono leading-relaxed">
            or press Spacebar to reboot system flapper
          </p>
        </div>
      )}

      {/* GameOver overlay */}
      {gameState === "gameover" && (
        <div 
          className="z-10 flex flex-col items-center justify-center text-center px-5 bg-zinc-100/95 dark:bg-zinc-800/95 border border-zinc-300 dark:border-zinc-700 p-5 rounded shadow-lg max-w-[240px] animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-10 rounded bg-zinc-200/90 dark:bg-zinc-800/90 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 flex items-center justify-center mb-3">
            <RotateCcw className="w-4 h-4 animate-spin" style={{ animationDuration: "16s" }} />
          </div>

          <h2 className="text-sm font-extrabold tracking-wider text-zinc-800 dark:text-zinc-100 font-mono uppercase mb-1">
            Game Over
          </h2>
          <p className="text-[9px] text-zinc-500 dark:text-zinc-500 font-mono uppercase tracking-wider mb-3.5">
            System Collision Detected
          </p>

          <div className="w-full bg-zinc-200/50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-750 rounded p-2.5 mb-4 flex justify-around text-center font-mono text-xs">
            <div>
              <p className="text-[8px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Score</p>
              <p className="font-extrabold text-zinc-800 dark:text-zinc-100">{score}</p>
            </div>
            <div className="w-[1px] bg-zinc-300 dark:bg-zinc-700" />
            <div>
              <p className="text-[8px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Best</p>
              <p className="font-extrabold text-zinc-800 dark:text-zinc-100">{highScore}</p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2 rounded bg-zinc-800 hover:bg-zinc-750 dark:bg-zinc-200 dark:hover:bg-zinc-300 text-white dark:text-black font-mono text-xs font-bold active:translate-y-[1px] cursor-default transition-all shadow-sm border border-zinc-700 dark:border-zinc-300"
          >
            Reboot Game
          </button>
        </div>
      )}
    </div>
  );
};

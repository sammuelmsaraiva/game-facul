"use client";

import { useRef, useEffect, useCallback } from "react";
import type { GameState, InputState } from "@/lib/game/types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/game/constants";
import { gameUpdate, gameRender } from "@/lib/game/engine";
import { createInputState, setupInput, consumePressed } from "@/lib/game/input";
import { loadSettings } from "@/lib/game/settings";

interface GameCanvasProps {
  gameState: React.MutableRefObject<GameState>;
  inputState: React.MutableRefObject<InputState>;
  onScreenChange: (screen: GameState["screen"]) => void;
}

export default function GameCanvas({
  gameState,
  inputState,
  onScreenChange,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastScreenRef = useRef<GameState["screen"]>("menu");
  const dprRef = useRef<number>(1);
  // FPS counter — média móvel dos últimos 30 frames
  const fpsRef = useRef<{ samples: number[]; lastT: number; current: number }>({
    samples: [],
    lastT: 0,
    current: 60,
  });

  // HiDPI: renderiza em alta resolução interna (devicePixelRatio) e exibe
  // em tamanho lógico via CSS — texto fica nítido em telas Retina/4K
  const setupHiDPI = useCallback((canvas: HTMLCanvasElement) => {
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    dprRef.current = dpr;
    canvas.width = Math.round(CANVAS_WIDTH * dpr);
    canvas.height = Math.round(CANVAS_HEIGHT * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Smoothing desligado por padrão — preserva o estilo pixelado
      ctx.imageSmoothingEnabled = false;
    }
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameState.current;
    const input = inputState.current;

    // Update
    gameUpdate(state, input);

    // Detect screen changes
    if (state.screen !== lastScreenRef.current) {
      lastScreenRef.current = state.screen;
      onScreenChange(state.screen);
    }

    // Render — clearRect usa coordenadas lógicas (transform já aplicado)
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gameRender(ctx, state);

    // FPS counter (opcional, controlado por settings.showFps)
    const settings = loadSettings();
    if (settings.showFps) {
      const now = performance.now();
      const fps = fpsRef.current;
      if (fps.lastT > 0) {
        const dt = now - fps.lastT;
        fps.samples.push(1000 / dt);
        if (fps.samples.length > 30) fps.samples.shift();
        fps.current = fps.samples.reduce((a, b) => a + b, 0) / fps.samples.length;
      }
      fps.lastT = now;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(8, CANVAS_HEIGHT - 28, 90, 22);
      ctx.fillStyle = "#00FF41";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${Math.round(fps.current)} FPS`, 14, CANVAS_HEIGHT - 12);
      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, inputState, onScreenChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) setupHiDPI(canvas);

    const handleResize = () => {
      if (canvas) setupHiDPI(canvas);
    };
    window.addEventListener("resize", handleResize);

    // Pause automático quando a janela perde foco — UX padrão de jogos desktop
    const handleBlur = () => {
      const state = gameState.current;
      if (state.screen === "playing") {
        state.screen = "paused";
      }
    };
    window.addEventListener("blur", handleBlur);

    const cleanup = setupInput(inputState.current);
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("blur", handleBlur);
      cleanup();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop, inputState, setupHiDPI, gameState]);

  return (
    <canvas
      ref={canvasRef}
      // width/height definidos no setupHiDPI conforme devicePixelRatio
      className="block"
      style={{
        imageRendering: "pixelated",
        width: "100%",
        maxWidth: `${CANVAS_WIDTH}px`,
        height: "auto",
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
      }}
      tabIndex={0}
    />
  );
}

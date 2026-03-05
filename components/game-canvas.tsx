"use client";

import { useRef, useEffect, useCallback } from "react";
import type { GameState, InputState } from "@/lib/game/types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/game/constants";
import { gameUpdate, gameRender } from "@/lib/game/engine";
import { createInputState, setupInput, consumePressed } from "@/lib/game/input";

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

    // Render
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gameRender(ctx, state);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, inputState, onScreenChange]);

  useEffect(() => {
    const cleanup = setupInput(inputState.current);
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cleanup();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop, inputState]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
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

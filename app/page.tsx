"use client";

import { useRef, useState, useCallback } from "react";
import type { GameState, InputState, GameScreen } from "@/lib/game/types";
import { createGameState, resetGame } from "@/lib/game/engine";
import { createInputState, resetInput } from "@/lib/game/input";
import GameCanvas from "@/components/game-canvas";
import MenuScreen from "@/components/menu-screen";
import GameOverScreen from "@/components/game-over-screen";
import VictoryScreen from "@/components/victory-screen";
import SettingsScreen from "@/components/settings-screen";
import CreditsScreen from "@/components/credits-screen";
import Link from "next/link";

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>("menu");
  const [score, setScore] = useState(0);

  const gameStateRef = useRef<GameState>(createGameState());
  const inputStateRef = useRef<InputState>(createInputState());

  const handlePlay = useCallback(() => {
    resetInput(inputStateRef.current);
    gameStateRef.current = resetGame(gameStateRef.current);
    setScreen("playing");
  }, []);

  const handleScreenChange = useCallback((newScreen: GameScreen) => {
    setScreen(newScreen);
    if (newScreen === "gameover" || newScreen === "victory") {
      setScore(gameStateRef.current.player.score);
    }
  }, []);

  const handleRetry = useCallback(() => {
    resetInput(inputStateRef.current);
    gameStateRef.current = resetGame(gameStateRef.current);
    setScreen("playing");
  }, []);

  const handleMenu = useCallback(() => {
    gameStateRef.current = createGameState();
    setScreen("menu");
  }, []);

  const handleSettings = useCallback(() => {
    setScreen("settings");
  }, []);

  const handleCredits = useCallback(() => {
    setScreen("credits");
  }, []);

  const handleBack = useCallback(() => {
    setScreen("menu");
  }, []);

  const handleExit = useCallback(() => {
    window.close();
    // Fallback: se window.close() não funcionar (maioria dos navegadores bloqueia)
    // mostra uma mensagem ou volta ao menu
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center"
      style={{ backgroundColor: "#0a0a12" }}
    >
      <div className="relative w-full max-w-[1280px]">
        {/* Game screens */}
        {screen === "menu" && (
          <MenuScreen
            onPlay={handlePlay}
            onSettings={handleSettings}
            onCredits={handleCredits}
            onExit={handleExit}
          />
        )}

        {(screen === "ready" || screen === "playing" || screen === "paused") && (
          <GameCanvas
            gameState={gameStateRef}
            inputState={inputStateRef}
            onScreenChange={handleScreenChange}
          />
        )}

        {screen === "gameover" && (
          <GameOverScreen
            score={score}
            onRetry={handleRetry}
            onMenu={handleMenu}
          />
        )}

        {screen === "victory" && (
          <VictoryScreen score={score} onMenu={handleMenu} />
        )}

        {screen === "settings" && (
          <SettingsScreen onBack={handleBack} />
        )}

        {screen === "credits" && (
          <CreditsScreen onBack={handleBack} />
        )}
      </div>

      {/* GDD Link */}
      <div className="mt-4 pb-4">
        <Link
          href="/gdd"
          className="text-xs font-mono opacity-40 hover:opacity-80 transition-opacity"
          style={{ color: "#00FFFF" }}
        >
          {"[ VER DOCUMENTO GDD ]"}
        </Link>
      </div>
    </main>
  );
}

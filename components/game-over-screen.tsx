"use client";

import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";

interface GameOverScreenProps {
  score: number;
  onRetry: () => void;
  onMenu: () => void;
}

export default function GameOverScreen({ score, onRetry, onMenu }: GameOverScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      timeRef.current++;
      const t = timeRef.current;

      // Dark bg with red tint
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, "#0a0005");
      grad.addColorStop(1, "#1a0010");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Glitch lines
      if (Math.random() > 0.95) {
        const gy = Math.random() * CANVAS_HEIGHT;
        ctx.fillStyle = COLORS.red + "20";
        ctx.fillRect(0, gy, CANVAS_WIDTH, 2 + Math.random() * 5);
      }

      // Static noise
      for (let i = 0; i < 50; i++) {
        const nx = Math.random() * CANVAS_WIDTH;
        const ny = Math.random() * CANVAS_HEIGHT;
        ctx.fillStyle = `rgba(255,0,64,${Math.random() * 0.1})`;
        ctx.fillRect(nx, ny, Math.random() * 4, 1);
      }

      // GAME OVER text
      const glitchX = Math.random() > 0.9 ? (Math.random() - 0.5) * 6 : 0;
      ctx.save();
      ctx.shadowColor = COLORS.red;
      ctx.shadowBlur = 25;
      ctx.fillStyle = COLORS.red;
      ctx.font = "bold 48px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", CANVAS_WIDTH / 2 + glitchX, 180);
      ctx.restore();

      // Connection lost text
      ctx.fillStyle = COLORS.white + "60";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("// CONEXAO PERDIDA COM O OPERADOR", CANVAS_WIDTH / 2, 220);

      // Score
      ctx.fillStyle = COLORS.hudScore;
      ctx.shadowColor = COLORS.hudScore;
      ctx.shadowBlur = 5;
      ctx.font = "bold 22px monospace";
      ctx.fillText(`PONTUACAO: ${score}`, CANVAS_WIDTH / 2, 280);
      ctx.shadowBlur = 0;

      // Buttons
      const btnY1 = 340;
      const btnY2 = 395;
      const btnW = 260;
      const btnH = 40;

      // Retry button
      ctx.strokeStyle = COLORS.cyan;
      ctx.shadowColor = COLORS.cyan;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(CANVAS_WIDTH / 2 - btnW / 2, btnY1, btnW, btnH);
      ctx.fillStyle = COLORS.cyan + "15";
      ctx.fillRect(CANVAS_WIDTH / 2 - btnW / 2, btnY1, btnW, btnH);
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.cyan;
      ctx.font = "bold 16px monospace";
      ctx.fillText("TENTAR NOVAMENTE [ENTER]", CANVAS_WIDTH / 2, btnY1 + 26);

      // Menu button
      ctx.strokeStyle = COLORS.white + "50";
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      ctx.strokeRect(CANVAS_WIDTH / 2 - btnW / 2, btnY2, btnW, btnH);
      ctx.fillStyle = COLORS.white + "60";
      ctx.font = "14px monospace";
      ctx.fillText("VOLTAR AO MENU [ESC]", CANVAS_WIDTH / 2, btnY2 + 26);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [score]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        playMenuSelectSound();
        onRetry();
      }
      if (e.code === "Escape") {
        e.preventDefault();
        playMenuSelectSound();
        onMenu();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onRetry, onMenu]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block"
      style={{
        width: "100%",
        maxWidth: `${CANVAS_WIDTH}px`,
        height: "auto",
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
      }}
      tabIndex={0}
    />
  );
}

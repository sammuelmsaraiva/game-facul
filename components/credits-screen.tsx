"use client";

import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";

interface CreditsScreenProps {
  onBack: () => void;
}

export default function CreditsScreen({ onBack }: CreditsScreenProps) {
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

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, "#050510");
      grad.addColorStop(1, "#1a0033");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Scrolling stars
      for (let i = 0; i < 20; i++) {
        const sx = (i * 131 + t * 0.2) % CANVAS_WIDTH;
        const sy = (i * 73) % CANVAS_HEIGHT;
        ctx.fillStyle = COLORS.white + "30";
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Title
      ctx.save();
      ctx.shadowColor = COLORS.magenta;
      ctx.shadowBlur = 15;
      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CREDITOS", CANVAS_WIDTH / 2, 70);
      ctx.restore();

      // Divider
      ctx.strokeStyle = COLORS.magenta + "40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2 - 200, 90);
      ctx.lineTo(CANVAS_WIDTH / 2 + 200, 90);
      ctx.stroke();

      // Credits content
      const credits = [
        { role: "JOGO", name: "Neon Escape: Revolta da IA" },
        { role: "GENERO", name: "Plataforma 2D - Cyberpunk" },
        { role: "ENGINE", name: "HTML5 Canvas + Next.js" },
        { role: "DESENVOLVIMENTO", name: "Projeto Academico" },
        { role: "AUDIO", name: "Web Audio API (Sintetizado)" },
        { role: "ANO", name: "2026" },
      ];

      const startY = 130;
      const spacing = 50;

      credits.forEach((credit, i) => {
        const y = startY + i * spacing;

        // Role
        ctx.fillStyle = COLORS.cyan + "80";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(credit.role, CANVAS_WIDTH / 2, y);

        // Name
        ctx.fillStyle = COLORS.white + "dd";
        ctx.font = "bold 16px monospace";
        ctx.fillText(credit.name, CANVAS_WIDTH / 2, y + 20);
      });

      // Thank you
      const tyY = startY + credits.length * spacing + 20;
      const pulse = 0.7 + Math.sin(t * 0.04) * 0.3;
      ctx.fillStyle = COLORS.neonGreen;
      ctx.globalAlpha = pulse;
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Obrigado por jogar!", CANVAS_WIDTH / 2, tyY);
      ctx.globalAlpha = 1;

      // Back
      ctx.fillStyle = COLORS.white + "40";
      ctx.font = "12px monospace";
      ctx.fillText("Pressione ESC ou ENTER para voltar", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        playMenuSelectSound();
        onBack();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onBack]);

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

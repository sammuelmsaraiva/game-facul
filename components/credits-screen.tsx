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

      // Titulo do jogo
      ctx.fillStyle = COLORS.white + "dd";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Neon Escape: Revolta da IA", CANVAS_WIDTH / 2, 120);

      ctx.fillStyle = COLORS.cyan + "60";
      ctx.font = "11px monospace";
      ctx.fillText("Plataforma 2D Cyberpunk | Next.js + Canvas", CANVAS_WIDTH / 2, 140);

      // Equipe
      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 13px monospace";
      ctx.fillText("EQUIPE DE DESENVOLVIMENTO", CANVAS_WIDTH / 2, 175);

      const team = [
        { name: "Sammuel Moura Saraiva", role: "Arquitetura, Motor Canvas, Deploy" },
        { name: "Joao Vinicius P. C. B. Carvalho", role: "IA dos Inimigos, Boss Fight" },
        { name: "Lucas Benevinuto Pereira", role: "HUD, Menus, Pontuacao" },
        { name: "Vinicius Henrique Albino Andrade", role: "Assets, Pixel Art, Audio, Level Design" },
      ];

      const teamStartY = 200;
      team.forEach((member, i) => {
        const y = teamStartY + i * 42;
        ctx.fillStyle = COLORS.cyan;
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(member.name, CANVAS_WIDTH / 2, y);
        ctx.fillStyle = COLORS.white + "80";
        ctx.font = "11px monospace";
        ctx.fillText(member.role, CANVAS_WIDTH / 2, y + 16);
      });

      // Disciplina
      ctx.fillStyle = COLORS.cyan + "60";
      ctx.font = "11px monospace";
      const infoY = teamStartY + team.length * 42 + 15;
      ctx.fillText("Intro. ao Desenvolvimento de Jogos - iCEV 2026.1", CANVAS_WIDTH / 2, infoY);
      ctx.fillText("Prof. Samuel Vinicius Pereira de Oliveira", CANVAS_WIDTH / 2, infoY + 18);

      // Thank you
      const tyY = infoY + 50;
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

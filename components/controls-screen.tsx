"use client";

import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";

interface ControlsScreenProps {
  onBack: () => void;
}

export default function ControlsScreen({ onBack }: ControlsScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, "#050510");
    grad.addColorStop(1, "#1a0033");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title
    ctx.save();
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.cyan;
    ctx.font = "bold 32px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CONTROLES", CANVAS_WIDTH / 2, 70);
    ctx.restore();

    // Divider
    ctx.strokeStyle = COLORS.cyan + "40";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - 200, 90);
    ctx.lineTo(CANVAS_WIDTH / 2 + 200, 90);
    ctx.stroke();

    // Controls list
    const controls = [
      { key: "A / D  ou  SETAS", action: "Mover esquerda / direita" },
      { key: "W / SETA CIMA / ESPACO", action: "Pular" },
      { key: "S / SETA BAIXO", action: "Descer de plataformas" },
      { key: "J  ou  CLIQUE ESQUERDO", action: "Atirar" },
      { key: "ESC  ou  P", action: "Pausar" },
    ];

    const startY = 120;
    const spacing = 50;

    controls.forEach((ctrl, i) => {
      const y = startY + i * spacing;

      // Key box
      ctx.fillStyle = COLORS.cyan + "15";
      ctx.fillRect(CANVAS_WIDTH / 2 - 280, y, 260, 35);
      ctx.strokeStyle = COLORS.cyan + "60";
      ctx.lineWidth = 1;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 280, y, 260, 35);

      ctx.fillStyle = COLORS.cyan;
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(ctrl.key, CANVAS_WIDTH / 2 - 150, y + 22);

      // Action
      ctx.fillStyle = COLORS.white + "cc";
      ctx.font = "14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(ctrl.action, CANVAS_WIDTH / 2 + 10, y + 22);
    });

    // Objective
    const objY = startY + controls.length * spacing + 30;
    ctx.fillStyle = COLORS.magenta;
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("OBJETIVO", CANVAS_WIDTH / 2, objY);

    ctx.fillStyle = COLORS.white + "90";
    ctx.font = "13px monospace";
    ctx.fillText(
      "Atravesse as ruas e os dutos da megacidade.",
      CANVAS_WIDTH / 2,
      objY + 25
    );
    ctx.fillText(
      "Derrote a IA OmniCore no nucleo para libertar a cidade.",
      CANVAS_WIDTH / 2,
      objY + 45
    );
    ctx.fillText(
      "Colete chips de dados para aumentar sua pontuacao.",
      CANVAS_WIDTH / 2,
      objY + 65
    );

    // Back
    ctx.fillStyle = COLORS.white + "40";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Pressione ESC ou ENTER para voltar", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
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

"use client";

import { useEffect, useRef, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";

interface MenuScreenProps {
  onPlay: () => void;
  onControls: () => void;
  onCredits: () => void;
  onExit: () => void;
}

export default function MenuScreen({ onPlay, onControls, onCredits, onExit }: MenuScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    { label: "JOGAR", action: onPlay },
    { label: "CONTROLES", action: onControls },
    { label: "CREDITOS", action: onCredits },
    { label: "SAIR", action: onExit },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const drawMenu = () => {
      timeRef.current++;
      const t = timeRef.current;

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, "#050510");
      grad.addColorStop(0.5, "#0a0a20");
      grad.addColorStop(1, "#1a0033");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Animated grid lines
      ctx.strokeStyle = COLORS.cyan + "10";
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let j = 0; j < CANVAS_HEIGHT; j += 40) {
        const offset = Math.sin(t * 0.02 + j * 0.01) * 2;
        ctx.beginPath();
        ctx.moveTo(0, j + offset);
        ctx.lineTo(CANVAS_WIDTH, j + offset);
        ctx.stroke();
      }

      // Floating particles
      for (let i = 0; i < 30; i++) {
        const px = ((t * 0.3 + i * 137) % (CANVAS_WIDTH + 20)) - 10;
        const py = ((i * 89 + Math.sin(t * 0.01 + i) * 50) % CANVAS_HEIGHT);
        const alpha = 0.2 + Math.sin(t * 0.02 + i) * 0.15;
        ctx.fillStyle = i % 3 === 0 ? `rgba(0,255,255,${alpha})` : i % 3 === 1 ? `rgba(255,0,255,${alpha})` : `rgba(0,255,65,${alpha})`;
        ctx.fillRect(px, py, 2, 2);
      }

      // Title
      const titleY = 180 + Math.sin(t * 0.03) * 5;

      // Title glow
      ctx.save();
      ctx.shadowColor = COLORS.cyan;
      ctx.shadowBlur = 30;
      ctx.fillStyle = COLORS.cyan;
      ctx.font = "bold 52px monospace";
      ctx.textAlign = "center";
      ctx.fillText("NEON ESCAPE", CANVAS_WIDTH / 2, titleY);
      ctx.restore();

      // Subtitle
      ctx.fillStyle = COLORS.magenta + "cc";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("// REVOLTA DA IA", CANVAS_WIDTH / 2, titleY + 35);

      // Decorative line
      ctx.strokeStyle = COLORS.cyan + "60";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2 - 200, titleY + 55);
      ctx.lineTo(CANVAS_WIDTH / 2 + 200, titleY + 55);
      ctx.stroke();

      // Menu items (4 itens centrados verticalmente)
      const startY = 340;
      const itemSpacing = 55;

      for (let i = 0; i < menuItems.length; i++) {
        const itemY = startY + i * itemSpacing;
        const isSelected = i === selectedIndex;

        if (isSelected) {
          // Selection highlight
          ctx.fillStyle = COLORS.cyan + "15";
          ctx.fillRect(CANVAS_WIDTH / 2 - 140, itemY - 18, 280, 36);
          ctx.strokeStyle = COLORS.cyan;
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1;
          ctx.strokeRect(CANVAS_WIDTH / 2 - 140, itemY - 18, 280, 36);

          // Selector arrows
          ctx.fillStyle = COLORS.cyan;
          ctx.font = "16px monospace";
          ctx.textAlign = "center";
          const arrowOffset = Math.sin(t * 0.1) * 3;
          ctx.fillText(">", CANVAS_WIDTH / 2 - 120 + arrowOffset, itemY + 5);
          ctx.fillText("<", CANVAS_WIDTH / 2 + 120 - arrowOffset, itemY + 5);
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = isSelected ? COLORS.cyan : COLORS.white + "80";
        ctx.font = `bold 20px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(menuItems[i].label, CANVAS_WIDTH / 2, itemY + 6);
      }

      // Footer
      ctx.fillStyle = COLORS.white + "30";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Use W/S ou Setas para navegar | ENTER para selecionar", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

      animId = requestAnimationFrame(drawMenu);
    };

    animId = requestAnimationFrame(drawMenu);
    return () => cancelAnimationFrame(animId);
  }, [selectedIndex, menuItems]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev - 1 + menuItems.length) % menuItems.length;
          playMenuSelectSound();
          return next;
        });
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev + 1) % menuItems.length;
          playMenuSelectSound();
          return next;
        });
      }
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        menuItems[selectedIndex].action();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, menuItems]);

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

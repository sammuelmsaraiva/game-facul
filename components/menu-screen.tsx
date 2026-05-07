"use client";

import { useEffect, useRef, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";
import { loadHighScores, formatTime } from "@/lib/game/highscores";

interface MenuScreenProps {
  onPlay: () => void;
  onSettings: () => void;
  onCredits: () => void;
  onExit: () => void;
}

export default function MenuScreen({ onPlay, onSettings, onCredits, onExit }: MenuScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    { label: "JOGAR", action: onPlay },
    { label: "CONFIGURACOES", action: onSettings },
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

      // === Painel de Top Scores (canto superior direito) ===
      const scores = loadHighScores();
      if (scores.length > 0) {
        const panelX = CANVAS_WIDTH - 280;
        const panelY = 60;
        const panelW = 260;
        const panelH = 220;
        ctx.fillStyle = "rgba(10, 10, 26, 0.7)";
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = COLORS.yellow + "60";
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.fillStyle = COLORS.yellow;
        ctx.shadowColor = COLORS.yellow;
        ctx.shadowBlur = 8;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("MELHORES PONTUACOES", panelX + panelW / 2, panelY + 22);
        ctx.shadowBlur = 0;

        ctx.font = "11px monospace";
        for (let i = 0; i < scores.length; i++) {
          const s = scores[i];
          const lineY = panelY + 50 + i * 32;
          const isFirst = i === 0;
          ctx.fillStyle = isFirst ? COLORS.yellow : COLORS.white + "cc";
          ctx.textAlign = "left";
          ctx.fillText(`#${i + 1}`, panelX + 12, lineY);
          ctx.textAlign = "right";
          ctx.fillText(`${s.score}`, panelX + panelW - 12, lineY);
          ctx.fillStyle = COLORS.white + "70";
          ctx.font = "10px monospace";
          ctx.textAlign = "left";
          const phaseLabel = s.phaseReached === 4 ? "vitoria" : `fase ${s.phaseReached}`;
          ctx.fillText(`${phaseLabel} · ${formatTime(s.timeSeconds)}`, panelX + 12, lineY + 13);
          ctx.font = "11px monospace";
        }
      }

      // Footer
      ctx.fillStyle = COLORS.white + "30";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("W/S ou setas para navegar | ENTER ou clique para selecionar", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

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

  // Mouse → coordenadas internas do canvas (independente do CSS scale)
  const canvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    return { x, y };
  };

  // Detecta se a coordenada está sobre um item do menu (mesmas posições do render)
  const itemAt = (y: number): number | null => {
    const startY = 340;
    const itemSpacing = 55;
    const itemH = 36;
    for (let i = 0; i < menuItems.length; i++) {
      const itemY = startY + i * itemSpacing;
      if (y >= itemY - itemH / 2 && y <= itemY + itemH / 2) return i;
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = canvasMousePos(e);
    if (!pos) return;
    const idx = itemAt(pos.y);
    if (idx !== null && idx !== selectedIndex) {
      setSelectedIndex(idx);
      playMenuSelectSound();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = canvasMousePos(e);
    if (!pos) return;
    const idx = itemAt(pos.y);
    if (idx !== null) {
      menuItems[idx].action();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block cursor-pointer"
      style={{
        imageRendering: "pixelated",
        width: "100%",
        maxWidth: `${CANVAS_WIDTH}px`,
        height: "auto",
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
      }}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    />
  );
}

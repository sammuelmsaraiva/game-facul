"use client";

import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";

interface VictoryScreenProps {
  score: number;
  rank: number | null; // posição no high-score (1-5)
  onMenu: () => void;
}

export default function VictoryScreen({ score, rank: hsRank, onMenu }: VictoryScreenProps) {
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

      // Background with neon green tint
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, "#000a05");
      grad.addColorStop(1, "#001a10");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Celebration particles
      for (let i = 0; i < 40; i++) {
        const px = ((t * 0.5 + i * 97) % (CANVAS_WIDTH + 20)) - 10;
        const py = ((t * 0.3 + i * 61) % (CANVAS_HEIGHT + 20)) - 10;
        const colors = [COLORS.cyan, COLORS.magenta, COLORS.neonGreen, COLORS.yellow];
        const color = colors[i % colors.length];
        const alpha = 0.3 + Math.sin(t * 0.03 + i) * 0.2;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(px, py, 3, 3);
      }
      ctx.globalAlpha = 1;

      // Victory text
      const bounceY = Math.sin(t * 0.04) * 5;
      ctx.save();
      ctx.shadowColor = COLORS.neonGreen;
      ctx.shadowBlur = 30;
      ctx.fillStyle = COLORS.neonGreen;
      ctx.font = "bold 44px monospace";
      ctx.textAlign = "center";
      ctx.fillText("VITORIA!", CANVAS_WIDTH / 2, 160 + bounceY);
      ctx.restore();

      // Subtitle
      ctx.fillStyle = COLORS.cyan + "cc";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("// A OMNICORE FOI DESTRUIDA", CANVAS_WIDTH / 2, 200);
      ctx.fillText("// A CIDADE ESTA LIVRE", CANVAS_WIDTH / 2, 222);

      // Decorative line
      ctx.strokeStyle = COLORS.neonGreen + "40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2 - 180, 245);
      ctx.lineTo(CANVAS_WIDTH / 2 + 180, 245);
      ctx.stroke();

      // Score
      ctx.fillStyle = COLORS.hudScore;
      ctx.shadowColor = COLORS.hudScore;
      ctx.shadowBlur = 6;
      ctx.font = "bold 24px monospace";
      ctx.fillText(`PONTUACAO FINAL: ${score}`, CANVAS_WIDTH / 2, 290);
      ctx.shadowBlur = 0;

      // Rank
      let rank = "D";
      if (score >= 2000) rank = "S";
      else if (score >= 1500) rank = "A";
      else if (score >= 1000) rank = "B";
      else if (score >= 500) rank = "C";

      ctx.fillStyle = rank === "S" ? COLORS.yellow : rank === "A" ? COLORS.neonGreen : COLORS.white;
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.shadowBlur = 10;
      ctx.font = "bold 36px monospace";
      ctx.fillText(`RANK: ${rank}`, CANVAS_WIDTH / 2, 340);
      ctx.shadowBlur = 0;

      // Posição no high-score (se entrou)
      if (hsRank !== null) {
        const blink = Math.sin(t * 0.1) > 0;
        ctx.fillStyle = hsRank === 1 ? COLORS.yellow : COLORS.cyan;
        ctx.shadowColor = ctx.fillStyle as string;
        ctx.shadowBlur = blink ? 16 : 8;
        ctx.font = "bold 18px monospace";
        const text = hsRank === 1 ? "★ NOVO RECORDE ★" : `RANKING: #${hsRank} de 5`;
        ctx.fillText(text, CANVAS_WIDTH / 2, 372);
        ctx.shadowBlur = 0;
      }

      // Back to menu
      const btnY = 400;
      const btnW = 260;
      const btnH = 40;
      ctx.strokeStyle = COLORS.cyan;
      ctx.shadowColor = COLORS.cyan;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(CANVAS_WIDTH / 2 - btnW / 2, btnY, btnW, btnH);
      ctx.fillStyle = COLORS.cyan + "15";
      ctx.fillRect(CANVAS_WIDTH / 2 - btnW / 2, btnY, btnW, btnH);
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.cyan;
      ctx.font = "bold 16px monospace";
      ctx.fillText("VOLTAR AO MENU [ENTER]", CANVAS_WIDTH / 2, btnY + 26);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [score]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space" || e.code === "Escape") {
        e.preventDefault();
        playMenuSelectSound();
        onMenu();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onMenu]);

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
      onClick={() => {
        playMenuSelectSound();
        onMenu();
      }}
    />
  );
}

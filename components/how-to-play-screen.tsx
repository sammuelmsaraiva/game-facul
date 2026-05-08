"use client";

import { useEffect, useRef, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";
import {
  loadSettings,
  getKeyDisplayName,
  ACTION_LABELS,
  type GameAction,
} from "@/lib/game/settings";

interface HowToPlayScreenProps {
  onBack: () => void;
}

type Tab = "controles" | "mecanicas" | "inimigos" | "itens";

const TABS: { id: Tab; label: string }[] = [
  { id: "controles", label: "CONTROLES" },
  { id: "mecanicas", label: "MECANICAS" },
  { id: "inimigos", label: "INIMIGOS" },
  { id: "itens", label: "COLETAVEIS" },
];

export default function HowToPlayScreen({ onBack }: HowToPlayScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const [tab, setTab] = useState<Tab>("controles");

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

      // Grid sutil
      ctx.strokeStyle = COLORS.cyan + "08";
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Botão VOLTAR (canto superior esquerdo)
      const backX = 20;
      const backY = 20;
      const backW = 120;
      const backH = 40;
      ctx.fillStyle = "#0c0c1e";
      ctx.fillRect(backX, backY, backW, backH);
      ctx.strokeStyle = COLORS.magenta;
      ctx.shadowColor = COLORS.magenta;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(backX, backY, backW, backH);
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("< VOLTAR", backX + backW / 2, backY + 26);

      // Título
      ctx.fillStyle = COLORS.cyan;
      ctx.shadowColor = COLORS.cyan;
      ctx.shadowBlur = 24;
      ctx.font = "bold 38px monospace";
      ctx.textAlign = "center";
      ctx.fillText("COMO JOGAR", CANVAS_WIDTH / 2, 55);
      ctx.shadowBlur = 0;

      // Linha decorativa
      ctx.strokeStyle = COLORS.cyan + "40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2 - 320, 75);
      ctx.lineTo(CANVAS_WIDTH / 2 + 320, 75);
      ctx.stroke();

      // === Abas ===
      const tabsY = 95;
      const tabW = 200;
      const tabH = 44;
      const totalTabsW = TABS.length * tabW + (TABS.length - 1) * 12;
      const tabsStartX = CANVAS_WIDTH / 2 - totalTabsW / 2;

      TABS.forEach((tabDef, i) => {
        const tabX = tabsStartX + i * (tabW + 12);
        const isActive = tab === tabDef.id;
        ctx.fillStyle = isActive ? COLORS.cyan + "20" : "#0a0a1c";
        ctx.fillRect(tabX, tabsY, tabW, tabH);
        ctx.strokeStyle = isActive ? COLORS.cyan : COLORS.white + "30";
        if (isActive) {
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur = 10;
        }
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.strokeRect(tabX, tabsY, tabW, tabH);
        ctx.shadowBlur = 0;
        ctx.fillStyle = isActive ? COLORS.cyan : COLORS.white + "80";
        ctx.font = `bold ${isActive ? 15 : 14}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(tabDef.label, tabX + tabW / 2, tabsY + 28);
      });

      // === Conteúdo ===
      const contentY = 170;

      if (tab === "controles") drawControles(ctx, contentY);
      else if (tab === "mecanicas") drawMecanicas(ctx, contentY, t);
      else if (tab === "inimigos") drawInimigos(ctx, contentY);
      else if (tab === "itens") drawItens(ctx, contentY);

      // Footer
      ctx.fillStyle = COLORS.white + "60";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Use ← → ou clique nas abas para navegar  |  ESC ou clique em VOLTAR",
        CANVAS_WIDTH / 2, CANVAS_HEIGHT - 22
      );

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [tab]);

  // Keyboard nav
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "Backspace") {
        e.preventDefault();
        playMenuSelectSound();
        onBack();
        return;
      }
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        const idx = TABS.findIndex((t) => t.id === tab);
        const next = TABS[(idx - 1 + TABS.length) % TABS.length];
        setTab(next.id);
        playMenuSelectSound();
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        const idx = TABS.findIndex((t) => t.id === tab);
        const next = TABS[(idx + 1) % TABS.length];
        setTab(next.id);
        playMenuSelectSound();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [tab, onBack]);

  // Mouse
  const canvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * CANVAS_WIDTH,
      y: ((e.clientY - r.top) / r.height) * CANVAS_HEIGHT,
    };
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = canvasMousePos(e);
    if (!pos) return;

    // Botão voltar
    if (pos.x >= 20 && pos.x <= 140 && pos.y >= 20 && pos.y <= 60) {
      playMenuSelectSound();
      onBack();
      return;
    }

    // Abas
    const tabW = 200;
    const tabH = 44;
    const totalTabsW = TABS.length * tabW + (TABS.length - 1) * 12;
    const tabsStartX = CANVAS_WIDTH / 2 - totalTabsW / 2;
    const tabsY = 95;
    for (let i = 0; i < TABS.length; i++) {
      const tabX = tabsStartX + i * (tabW + 12);
      if (pos.x >= tabX && pos.x <= tabX + tabW && pos.y >= tabsY && pos.y <= tabsY + tabH) {
        setTab(TABS[i].id);
        playMenuSelectSound();
        return;
      }
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
      onClick={handleClick}
    />
  );
}

// ===== Conteúdo das abas =====

function drawControles(ctx: CanvasRenderingContext2D, y0: number) {
  const settings = loadSettings();
  const bindings = settings.keyBindings;

  function fmt(action: GameAction): string {
    const keys = bindings[action];
    return [keys[0], keys[1]].filter(Boolean).map((k) => getKeyDisplayName(k!)).join(" / ");
  }

  const rows: [string, string][] = [
    ["MOVER ESQUERDA", fmt("left")],
    ["MOVER DIREITA", fmt("right")],
    [ACTION_LABELS.jump, fmt("jump")],
    [ACTION_LABELS.down, fmt("down")],
    [ACTION_LABELS.shoot + "  (ou clique esquerdo)", fmt("shoot")],
    [ACTION_LABELS.pause, fmt("pause")],
    ["CONTINUAR  (quando pausado)", "P"],
    ["CONFIRMAR EM TELAS", "ENTER  ou  CLIQUE"],
  ];

  ctx.font = "16px monospace";
  rows.forEach((r, i) => {
    const y = y0 + 30 + i * 38;
    ctx.fillStyle = COLORS.white + "cc";
    ctx.textAlign = "right";
    ctx.fillText(r[0], CANVAS_WIDTH / 2 - 30, y);
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 6;
    ctx.textAlign = "left";
    ctx.font = "bold 16px monospace";
    ctx.fillText(r[1], CANVAS_WIDTH / 2 + 30, y);
    ctx.shadowBlur = 0;
    ctx.font = "16px monospace";
  });

  // Dica
  ctx.fillStyle = COLORS.magenta + "cc";
  ctx.font = "italic 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    "Os controles podem ser remapeados em CONFIGURACOES",
    CANVAS_WIDTH / 2, y0 + 30 + rows.length * 38 + 16
  );
}

function drawMecanicas(ctx: CanvasRenderingContext2D, y0: number, time: number) {
  const items = [
    {
      title: "PULO RESPONSIVO",
      desc: "Coyote time + jump buffer + altura variavel.\nSegure para pular alto, solte cedo para pulo curto.",
      color: COLORS.neonGreen,
    },
    {
      title: "TIRO COM CRITICO",
      desc: "10% de chance de tiro critico (dano dobrado, cor amarela).\nCada tiro consome 1 municao.",
      color: COLORS.yellow,
    },
    {
      title: "PROGRESSAO POR FASE",
      desc: "Fase 1: so anda e pula | Fase 2: ganha arma\nFase 3: escolhe entre Espingarda ou Tiro Rapido",
      color: COLORS.cyan,
    },
    {
      title: "REGENERACAO LENTA",
      desc: "Recupera +1 vida a cada 30s sem tomar dano.\nPegue itens de vida para acelerar.",
      color: COLORS.healthPickup,
    },
  ];

  const cardW = 540;
  const cardH = 95;
  const gap = 12;

  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = CANVAS_WIDTH / 2 - cardW + col * (cardW + gap);
    const y = y0 + 20 + row * (cardH + gap);

    ctx.fillStyle = "#0c0c1e";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = it.color;
    ctx.shadowColor = it.color;
    ctx.shadowBlur = 8 + Math.sin(time * 0.05 + i) * 3;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, cardW, cardH);
    ctx.shadowBlur = 0;

    ctx.fillStyle = it.color;
    ctx.shadowColor = it.color;
    ctx.shadowBlur = 6;
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(it.title, x + 18, y + 28);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.white + "cc";
    ctx.font = "13px monospace";
    const lines = it.desc.split("\n");
    lines.forEach((line, li) => {
      ctx.fillText(line, x + 18, y + 52 + li * 18);
    });
  });
}

function drawInimigos(ctx: CanvasRenderingContext2D, y0: number) {
  const items = [
    {
      name: "DRONE", hp: "1 HP", score: "+10",
      color: COLORS.droneBody, glow: COLORS.droneGlow,
      tip: "Patrulheiro autonomo. Nao atira na Fase 1, atira reto na Fase 2.",
    },
    {
      name: "ATIRADOR", hp: "3 HP", score: "+40",
      color: COLORS.turretBody, glow: COLORS.turretGlow,
      tip: "Sentinela fixa. Dispara horizontal a cada 2.5s. Drop: +5 municao.",
    },
    {
      name: "RASTREADOR", hp: "2 HP", score: "+25",
      color: COLORS.trackerBody, glow: COLORS.trackerGlow,
      tip: "Invocado pelo boss. Detecta o player e persegue por 3s.",
    },
    {
      name: "OMNICORE", hp: "15 HP", score: "+500",
      color: COLORS.bossBody, glow: COLORS.bossGlow,
      tip: "Boss final em movimento de lemniscata. Contato causa 2 HP. 3 sub-fases.",
    },
  ];

  const cardW = 540;
  const cardH = 95;
  const gap = 12;

  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = CANVAS_WIDTH / 2 - cardW + col * (cardW + gap);
    const y = y0 + 20 + row * (cardH + gap);

    ctx.fillStyle = "#0c0c1e";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = it.color;
    ctx.shadowColor = it.glow;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, cardW, cardH);
    ctx.shadowBlur = 0;

    ctx.fillStyle = it.color;
    ctx.shadowColor = it.glow;
    ctx.shadowBlur = 6;
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "left";
    ctx.fillText(it.name, x + 18, y + 28);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.white + "aa";
    ctx.font = "12px monospace";
    ctx.fillText(`${it.hp}  |  Score: ${it.score}`, x + 18, y + 48);

    ctx.fillStyle = COLORS.white + "cc";
    ctx.font = "12px monospace";
    // Quebrar linhas longas
    const maxLen = 60;
    const words = it.tip.split(" ");
    let line = "";
    let lineY = y + 70;
    for (const w of words) {
      if ((line + w).length > maxLen) {
        ctx.fillText(line, x + 18, lineY);
        line = w + " ";
        lineY += 16;
      } else {
        line += w + " ";
      }
    }
    if (line) ctx.fillText(line, x + 18, lineY);
  });
}

function drawItens(ctx: CanvasRenderingContext2D, y0: number) {
  const items = [
    {
      name: "VIDA", color: COLORS.healthPickup, glow: COLORS.healthPickupGlow,
      effect: "+1 HP",
      desc: "Bolinha rosa-coral pulsante.\nApareceponto principal da Fase 1.2 e Fase 2.",
    },
    {
      name: "MUNICAO", color: COLORS.ammoPickup, glow: COLORS.ammoPickupGlow,
      effect: "+10 municoes",
      desc: "Bolinha turquesa.\nSo aparece a partir da Fase 2 (com a arma).",
    },
    {
      name: "CHIP DE DADOS", color: COLORS.dataChip, glow: COLORS.dataChipGlow,
      effect: "+100 score",
      desc: "Bolinha dourada.\nPure pontuacao para o ranking. Pegue todos!",
    },
  ];

  const cardW = 360;
  const cardH = 200;
  const gap = 12;
  const totalW = items.length * cardW + (items.length - 1) * gap;
  const startX = CANVAS_WIDTH / 2 - totalW / 2;

  items.forEach((it, i) => {
    const x = startX + i * (cardW + gap);
    const y = y0 + 20;

    ctx.fillStyle = "#0c0c1e";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = it.color;
    ctx.shadowColor = it.glow;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, cardW, cardH);
    ctx.shadowBlur = 0;

    // Diamante grande
    const cx = x + cardW / 2;
    const cy = y + 50;
    const s = 24;
    ctx.fillStyle = it.color;
    ctx.shadowColor = it.glow;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s, cy);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx - s, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.white;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = it.color;
    ctx.shadowColor = it.glow;
    ctx.shadowBlur = 6;
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(it.name, cx, y + 110);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.yellow;
    ctx.font = "bold 14px monospace";
    ctx.fillText(it.effect, cx, y + 132);

    ctx.fillStyle = COLORS.white + "bb";
    ctx.font = "12px monospace";
    const lines = it.desc.split("\n");
    lines.forEach((line, li) => {
      ctx.fillText(line, cx, y + 160 + li * 16);
    });
  });
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound, setMusicVolume, setSfxVolume, getMusicVolume, getSfxVolumeValue } from "@/lib/game/audio";
import {
  loadSettings,
  saveSettings,
  resetSettings,
  getKeyDisplayName,
  ACTION_LABELS,
  type GameAction,
  type GameSettings,
  type KeyBindings,
  isKeyConflict,
} from "@/lib/game/settings";
import { refreshKeyMap } from "@/lib/game/input";

interface SettingsScreenProps {
  onBack: () => void;
}

// Itens do menu: 6 ações (cada com 2 slots) + 2 sliders de volume + restaurar padrão
type MenuSection = "controls" | "volume" | "actions";

interface MenuItem {
  section: MenuSection;
  action?: GameAction;
  slotIndex?: number; // 0 = primária, 1 = secundária
  volumeType?: "music" | "sfx";
  id: string;
}

function buildMenuItems(): MenuItem[] {
  const items: MenuItem[] = [];
  const actions: GameAction[] = ["left", "right", "jump", "down", "shoot", "pause"];

  for (const action of actions) {
    items.push({ section: "controls", action, slotIndex: 0, id: `${action}-0` });
    items.push({ section: "controls", action, slotIndex: 1, id: `${action}-1` });
  }

  items.push({ section: "volume", volumeType: "music", id: "vol-music" });
  items.push({ section: "volume", volumeType: "sfx", id: "vol-sfx" });
  items.push({ section: "actions", id: "reset" });

  return items;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [remapping, setRemapping] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const menuItems = buildMenuItems();

  const updateAndSave = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    refreshKeyMap();
  }, []);

  // Render loop
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

      // Título
      ctx.save();
      ctx.shadowColor = COLORS.cyan;
      ctx.shadowBlur = 20;
      ctx.fillStyle = COLORS.cyan;
      ctx.font = "bold 28px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CONFIGURACOES", CANVAS_WIDTH / 2, 45);
      ctx.restore();

      // Divider
      ctx.strokeStyle = COLORS.cyan + "40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2 - 250, 60);
      ctx.lineTo(CANVAS_WIDTH / 2 + 250, 60);
      ctx.stroke();

      // === SEÇÃO CONTROLES ===
      const controlsY = 80;
      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText("◆ CONTROLES", 120, controlsY);

      ctx.fillStyle = COLORS.white + "40";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText("ENTER para remapear | DEL para limpar", CANVAS_WIDTH - 120, controlsY);

      const actions: GameAction[] = ["left", "right", "jump", "down", "shoot", "pause"];
      const rowH = 32;
      const startY = controlsY + 18;

      for (let ai = 0; ai < actions.length; ai++) {
        const action = actions[ai];
        const y = startY + ai * rowH;
        const keys = settings.keyBindings[action];

        // Label da ação
        ctx.fillStyle = COLORS.white + "bb";
        ctx.font = "13px monospace";
        ctx.textAlign = "right";
        ctx.fillText(ACTION_LABELS[action], CANVAS_WIDTH / 2 - 80, y + 20);

        // Slot primário e secundário
        for (let slot = 0; slot < 2; slot++) {
          const itemIdx = ai * 2 + slot;
          const isSelected = itemIdx === selectedIndex;
          const isRemapping = isSelected && remapping;

          const slotX = CANVAS_WIDTH / 2 - 60 + slot * 170;
          const slotW = 140;
          const slotH = 24;
          const slotY = y + 6;

          // Background do slot
          if (isRemapping) {
            ctx.fillStyle = COLORS.yellow + "25";
            ctx.strokeStyle = COLORS.yellow;
            ctx.shadowColor = COLORS.yellow;
            ctx.shadowBlur = 8;
          } else if (isSelected) {
            ctx.fillStyle = COLORS.cyan + "18";
            ctx.strokeStyle = COLORS.cyan;
            ctx.shadowColor = COLORS.cyan;
            ctx.shadowBlur = 6;
          } else {
            ctx.fillStyle = "#0a0a1a";
            ctx.strokeStyle = COLORS.white + "20";
            ctx.shadowBlur = 0;
          }

          ctx.fillRect(slotX, slotY, slotW, slotH);
          ctx.lineWidth = 1;
          ctx.strokeRect(slotX, slotY, slotW, slotH);
          ctx.shadowBlur = 0;

          // Texto da tecla
          if (isRemapping) {
            const blink = Math.sin(t * 0.15) > 0;
            ctx.fillStyle = blink ? COLORS.yellow : COLORS.yellow + "60";
            ctx.font = "bold 11px monospace";
            ctx.textAlign = "center";
            ctx.fillText("PRESSIONE...", slotX + slotW / 2, slotY + 16);
          } else {
            const keyCode = keys[slot];
            ctx.fillStyle = keyCode ? COLORS.cyan : COLORS.white + "25";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.fillText(
              keyCode ? getKeyDisplayName(keyCode) : slot === 1 ? "---" : "VAZIO",
              slotX + slotW / 2,
              slotY + 16
            );
          }
        }
      }

      // Conflito message
      if (conflictMsg) {
        ctx.fillStyle = COLORS.red;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(conflictMsg, CANVAS_WIDTH / 2, startY + actions.length * rowH + 16);
      }

      // === SEÇÃO VOLUME ===
      const volSectionY = startY + actions.length * rowH + 35;
      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText("◆ VOLUME", 120, volSectionY);

      ctx.fillStyle = COLORS.white + "40";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText("← → para ajustar", CANVAS_WIDTH - 120, volSectionY);

      const volTypes: Array<{ type: "music" | "sfx"; label: string; value: number }> = [
        { type: "music", label: "Musica", value: settings.musicVolume },
        { type: "sfx", label: "Efeitos", value: settings.sfxVolume },
      ];

      const volStartY = volSectionY + 18;
      const controlItemCount = actions.length * 2; // 12 itens de controles

      for (let vi = 0; vi < volTypes.length; vi++) {
        const vol = volTypes[vi];
        const y = volStartY + vi * 40;
        const itemIdx = controlItemCount + vi;
        const isSelected = itemIdx === selectedIndex;

        // Label
        ctx.fillStyle = COLORS.white + "bb";
        ctx.font = "13px monospace";
        ctx.textAlign = "right";
        ctx.fillText(vol.label, CANVAS_WIDTH / 2 - 80, y + 18);

        // Barra de volume
        const barX = CANVAS_WIDTH / 2 - 60;
        const barW = 300;
        const barH = 16;
        const barY = y + 6;

        // Background
        ctx.fillStyle = isSelected ? "#1a1a30" : "#0a0a1a";
        ctx.fillRect(barX, barY, barW, barH);

        // Borda
        ctx.strokeStyle = isSelected ? COLORS.cyan : COLORS.white + "20";
        if (isSelected) {
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur = 6;
        }
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.shadowBlur = 0;

        // Fill
        const fillW = (vol.value / 100) * barW;
        const volColor = vol.type === "music" ? COLORS.magenta : COLORS.cyan;
        ctx.fillStyle = isSelected ? volColor : volColor + "80";
        ctx.fillRect(barX, barY, fillW, barH);

        // Percentage
        ctx.fillStyle = COLORS.white;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`${vol.value}%`, barX + barW + 12, barY + 13);
      }

      // === RESTAURAR PADRÃO ===
      const resetY = volStartY + volTypes.length * 40 + 20;
      const resetIdx = controlItemCount + volTypes.length;
      const isResetSelected = selectedIndex === resetIdx;

      ctx.fillStyle = isResetSelected ? COLORS.red + "20" : "transparent";
      ctx.fillRect(CANVAS_WIDTH / 2 - 120, resetY, 240, 32);
      ctx.strokeStyle = isResetSelected ? COLORS.red : COLORS.white + "30";
      if (isResetSelected) {
        ctx.shadowColor = COLORS.red;
        ctx.shadowBlur = 6;
      }
      ctx.lineWidth = 1;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 120, resetY, 240, 32);
      ctx.shadowBlur = 0;

      ctx.fillStyle = isResetSelected ? COLORS.red : COLORS.white + "60";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("RESTAURAR PADRAO", CANVAS_WIDTH / 2, resetY + 21);

      // Footer
      ctx.fillStyle = COLORS.white + "30";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("W/S para navegar | ESC ou BACKSPACE para voltar", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [selectedIndex, remapping, settings, conflictMsg, menuItems]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Se está remapeando, capturar a tecla pressionada
      if (remapping) {
        e.preventDefault();

        // ESC cancela o remapeamento
        if (e.code === "Escape") {
          setRemapping(false);
          setConflictMsg(null);
          return;
        }

        const item = menuItems[selectedIndex];
        if (!item.action || item.slotIndex === undefined) return;

        // Verificar conflitos
        const conflict = isKeyConflict(settings.keyBindings, item.action, e.code);
        if (conflict) {
          setConflictMsg(`"${getKeyDisplayName(e.code)}" ja esta em uso por "${ACTION_LABELS[conflict]}"`);
          setTimeout(() => setConflictMsg(null), 2000);
          return;
        }

        // Aplicar nova tecla
        const newBindings: KeyBindings = { ...settings.keyBindings };
        const keys = [...newBindings[item.action]] as [string, string | null];
        keys[item.slotIndex] = e.code;
        newBindings[item.action] = keys as [string, string | null];

        const newSettings = { ...settings, keyBindings: newBindings };
        updateAndSave(newSettings);
        setRemapping(false);
        setConflictMsg(null);
        playMenuSelectSound();
        return;
      }

      // Navegação normal
      if (e.code === "Escape" || e.code === "Backspace") {
        e.preventDefault();
        playMenuSelectSound();
        onBack();
        return;
      }

      if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev - 1 + menuItems.length) % menuItems.length;
          playMenuSelectSound();
          return next;
        });
        return;
      }

      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev + 1) % menuItems.length;
          playMenuSelectSound();
          return next;
        });
        return;
      }

      const item = menuItems[selectedIndex];

      // Enter = ação
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();

        if (item.section === "controls" && item.action) {
          // Iniciar remapeamento
          setRemapping(true);
          setConflictMsg(null);
          playMenuSelectSound();
        } else if (item.section === "actions" && item.id === "reset") {
          // Restaurar padrão
          const defaults = resetSettings();
          setSettings(defaults);
          refreshKeyMap();
          setMusicVolume(defaults.musicVolume);
          setSfxVolume(defaults.sfxVolume);
          playMenuSelectSound();
        }
        return;
      }

      // Delete = limpar slot de tecla
      if (e.code === "Delete" || e.code === "Backspace") {
        if (item.section === "controls" && item.action && item.slotIndex !== undefined) {
          e.preventDefault();
          const newBindings: KeyBindings = { ...settings.keyBindings };
          const keys = [...newBindings[item.action]] as [string, string | null];

          // Não permitir limpar se é a única tecla restante
          if (item.slotIndex === 0 && !keys[1]) {
            setConflictMsg("Acao precisa ter pelo menos 1 tecla");
            setTimeout(() => setConflictMsg(null), 2000);
            return;
          }
          if (item.slotIndex === 1 && !keys[0]) {
            setConflictMsg("Acao precisa ter pelo menos 1 tecla");
            setTimeout(() => setConflictMsg(null), 2000);
            return;
          }

          keys[item.slotIndex] = null;
          // Se limpou o primário, mover secundário para primário
          if (item.slotIndex === 0 && keys[1]) {
            keys[0] = keys[1];
            keys[1] = null;
          }
          newBindings[item.action] = keys as [string, string | null];

          const newSettings = { ...settings, keyBindings: newBindings };
          updateAndSave(newSettings);
          playMenuSelectSound();
        }
        return;
      }

      // ← → = ajustar volume
      if (item.section === "volume" && item.volumeType) {
        const step = 5;
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          const current = item.volumeType === "music" ? settings.musicVolume : settings.sfxVolume;
          const newVal = Math.max(0, current - step);
          if (item.volumeType === "music") {
            setMusicVolume(newVal);
            setSettings({ ...settings, musicVolume: newVal });
          } else {
            setSfxVolume(newVal);
            setSettings({ ...settings, sfxVolume: newVal });
          }
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          const current = item.volumeType === "music" ? settings.musicVolume : settings.sfxVolume;
          const newVal = Math.min(100, current + step);
          if (item.volumeType === "music") {
            setMusicVolume(newVal);
            setSettings({ ...settings, musicVolume: newVal });
          } else {
            setSfxVolume(newVal);
            setSettings({ ...settings, sfxVolume: newVal });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, remapping, settings, menuItems, onBack, updateAndSave]);

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

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
import { resetTutorialState } from "@/lib/game/tutorial";
import { clearHighScores } from "@/lib/game/highscores";

interface SettingsScreenProps {
  onBack: () => void;
}

// Cada LINHA do menu tem 1 ou 2 colunas. Navegação ↑/↓ percorre linhas, ←/→ percorre
// colunas dentro da linha (controles) ou ajusta o valor (sliders).
type MenuSection = "controls" | "gameplay" | "volume" | "actions";

interface MenuRow {
  section: MenuSection;
  action?: GameAction;
  volumeType?: "music" | "sfx";
  gameplayType?: "speed";
  toggleType?: "crt" | "shake" | "fps";
  cols: number; // 2 para controles (primária/secundária), 1 para sliders/reset
  id: string;
}

function buildMenuRows(): MenuRow[] {
  const rows: MenuRow[] = [];
  const actions: GameAction[] = ["left", "right", "jump", "down", "shoot", "pause"];

  for (const action of actions) {
    rows.push({ section: "controls", action, cols: 2, id: `ctrl-${action}` });
  }

  rows.push({ section: "gameplay", gameplayType: "speed", cols: 1, id: "gp-speed" });
  rows.push({ section: "gameplay", toggleType: "crt", cols: 1, id: "tg-crt" });
  rows.push({ section: "gameplay", toggleType: "shake", cols: 1, id: "tg-shake" });
  rows.push({ section: "gameplay", toggleType: "fps", cols: 1, id: "tg-fps" });
  rows.push({ section: "volume", volumeType: "music", cols: 1, id: "vol-music" });
  rows.push({ section: "volume", volumeType: "sfx", cols: 1, id: "vol-sfx" });
  rows.push({ section: "actions", cols: 1, id: "reset-tutorial" });
  rows.push({ section: "actions", cols: 1, id: "reset-scores" });
  rows.push({ section: "actions", cols: 1, id: "reset" });

  return rows;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [remapping, setRemapping] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const menuRows = buildMenuRows();

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
          const isSelected = ai === selectedRow && slot === selectedCol;
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

      // As linhas seguintes começam após as 6 linhas de controles
      const speedRow = actions.length;             // 6
      const crtRow = actions.length + 1;           // 7
      const shakeRow = actions.length + 2;         // 8
      const fpsRow = actions.length + 3;           // 9
      const musicRow = actions.length + 4;         // 10
      const sfxRow = actions.length + 5;           // 11
      const resetTutorialRow = actions.length + 6; // 12
      const resetScoresRow = actions.length + 7;   // 13
      const resetRow = actions.length + 8;         // 14

      // === SEÇÃO GAMEPLAY (Velocidade do personagem) ===
      const gpSectionY = startY + actions.length * rowH + 30;
      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText("◆ GAMEPLAY", 120, gpSectionY);

      ctx.fillStyle = COLORS.white + "40";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText("← → para ajustar", CANVAS_WIDTH - 120, gpSectionY);

      const isSpeedSelected = selectedRow === speedRow;
      const speedY = gpSectionY + 18;

      // Label
      ctx.fillStyle = COLORS.white + "bb";
      ctx.font = "13px monospace";
      ctx.textAlign = "right";
      ctx.fillText("Velocidade Personagem", CANVAS_WIDTH / 2 - 80, speedY + 18);

      // Barra
      const speedBarX = CANVAS_WIDTH / 2 - 60;
      const speedBarW = 300;
      const speedBarH = 16;
      const speedBarY = speedY + 6;

      ctx.fillStyle = isSpeedSelected ? "#1a1a30" : "#0a0a1a";
      ctx.fillRect(speedBarX, speedBarY, speedBarW, speedBarH);

      ctx.strokeStyle = isSpeedSelected ? COLORS.cyan : COLORS.white + "20";
      if (isSpeedSelected) {
        ctx.shadowColor = COLORS.cyan;
        ctx.shadowBlur = 6;
      }
      ctx.lineWidth = 1;
      ctx.strokeRect(speedBarX, speedBarY, speedBarW, speedBarH);
      ctx.shadowBlur = 0;

      // Range 50-200, então normalizar para 0-1
      const speedNorm = (settings.playerSpeedMultiplier - 50) / 150;
      const speedFillW = Math.max(0, Math.min(1, speedNorm)) * speedBarW;
      ctx.fillStyle = isSpeedSelected ? COLORS.neonGreen : COLORS.neonGreen + "80";
      ctx.fillRect(speedBarX, speedBarY, speedFillW, speedBarH);

      // Marca dos 100% (referência)
      const refX = speedBarX + ((100 - 50) / 150) * speedBarW;
      ctx.strokeStyle = COLORS.white + "40";
      ctx.beginPath();
      ctx.moveTo(refX, speedBarY);
      ctx.lineTo(refX, speedBarY + speedBarH);
      ctx.stroke();

      // Percent label
      ctx.fillStyle = COLORS.white;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${settings.playerSpeedMultiplier}%`, speedBarX + speedBarW + 12, speedBarY + 13);

      // === Toggles (CRT, Shake, FPS) — 3 linhas em sequência ===
      const toggleStartY = speedY + 36;
      const toggles: Array<[number, "crt" | "shake" | "fps", string, boolean]> = [
        [crtRow, "crt", "Efeito CRT (scanlines)", settings.crtEffect],
        [shakeRow, "shake", "Camera shake", settings.screenShakeEnabled],
        [fpsRow, "fps", "Mostrar FPS", settings.showFps],
      ];
      toggles.forEach((t, i) => {
        const rowIdx = t[0];
        const enabled = t[3];
        const isSel = selectedRow === rowIdx;
        const y = toggleStartY + i * 26;
        ctx.fillStyle = COLORS.white + "bb";
        ctx.font = "13px monospace";
        ctx.textAlign = "right";
        ctx.fillText(t[2], CANVAS_WIDTH / 2 - 80, y + 16);

        // Botão toggle: caixa com ON/OFF
        const tx = CANVAS_WIDTH / 2 - 60;
        const tw = 100, th = 22;
        ctx.fillStyle = isSel ? "#1a1a30" : "#0a0a1a";
        ctx.fillRect(tx, y + 2, tw, th);
        ctx.strokeStyle = isSel ? COLORS.cyan : COLORS.white + "30";
        if (isSel) {
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur = 6;
        }
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, y + 2, tw, th);
        ctx.shadowBlur = 0;
        ctx.fillStyle = enabled ? COLORS.neonGreen : COLORS.red + "aa";
        ctx.shadowColor = enabled ? COLORS.neonGreen : COLORS.red;
        ctx.shadowBlur = enabled ? 6 : 4;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(enabled ? "ATIVADO" : "DESLIGADO", tx + tw / 2, y + 18);
        ctx.shadowBlur = 0;
      });

      // === SEÇÃO VOLUME ===
      const volSectionY = speedY + 50 + toggles.length * 26 + 20;
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

      for (let vi = 0; vi < volTypes.length; vi++) {
        const vol = volTypes[vi];
        const y = volStartY + vi * 40;
        const rowIdx = vi === 0 ? musicRow : sfxRow;
        const isSelected = selectedRow === rowIdx;

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

      // === RESETAR TUTORIAL ===
      const resetTutY = volStartY + volTypes.length * 40 + 14;
      const isResetTutSelected = selectedRow === resetTutorialRow;

      ctx.fillStyle = isResetTutSelected ? COLORS.yellow + "20" : "transparent";
      ctx.fillRect(CANVAS_WIDTH / 2 - 140, resetTutY, 280, 30);
      ctx.strokeStyle = isResetTutSelected ? COLORS.yellow : COLORS.white + "30";
      if (isResetTutSelected) {
        ctx.shadowColor = COLORS.yellow;
        ctx.shadowBlur = 6;
      }
      ctx.lineWidth = 1;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 140, resetTutY, 280, 30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = isResetTutSelected ? COLORS.yellow : COLORS.white + "60";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("RESETAR INTRODUCOES (TUTORIAL)", CANVAS_WIDTH / 2, resetTutY + 20);

      // === LIMPAR RECORDES ===
      const resetScY = resetTutY + 38;
      const isResetScSelected = selectedRow === resetScoresRow;
      ctx.fillStyle = isResetScSelected ? COLORS.magenta + "20" : "transparent";
      ctx.fillRect(CANVAS_WIDTH / 2 - 140, resetScY, 280, 30);
      ctx.strokeStyle = isResetScSelected ? COLORS.magenta : COLORS.white + "30";
      if (isResetScSelected) {
        ctx.shadowColor = COLORS.magenta;
        ctx.shadowBlur = 6;
      }
      ctx.lineWidth = 1;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 140, resetScY, 280, 30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = isResetScSelected ? COLORS.magenta : COLORS.white + "60";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("LIMPAR QUADRO DE RECORDES", CANVAS_WIDTH / 2, resetScY + 20);

      // === RESTAURAR PADRÃO ===
      const resetY = resetScY + 40;
      const isResetSelected = selectedRow === resetRow;

      ctx.fillStyle = isResetSelected ? COLORS.red + "20" : "transparent";
      ctx.fillRect(CANVAS_WIDTH / 2 - 120, resetY, 240, 30);
      ctx.strokeStyle = isResetSelected ? COLORS.red : COLORS.white + "30";
      if (isResetSelected) {
        ctx.shadowColor = COLORS.red;
        ctx.shadowBlur = 6;
      }
      ctx.lineWidth = 1;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 120, resetY, 240, 30);
      ctx.shadowBlur = 0;

      ctx.fillStyle = isResetSelected ? COLORS.red : COLORS.white + "60";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("RESTAURAR PADRAO", CANVAS_WIDTH / 2, resetY + 20);

      // Footer
      ctx.fillStyle = COLORS.white + "30";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("↑/↓ navegar linhas  |  ←/→ alternar slot ou ajustar  |  ESC voltar", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [selectedRow, selectedCol, remapping, settings, conflictMsg, menuRows]);

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

        const row = menuRows[selectedRow];
        if (row.section !== "controls" || !row.action) return;

        // Verificar conflitos
        const conflict = isKeyConflict(settings.keyBindings, row.action, e.code);
        if (conflict) {
          setConflictMsg(`"${getKeyDisplayName(e.code)}" ja esta em uso por "${ACTION_LABELS[conflict]}"`);
          setTimeout(() => setConflictMsg(null), 2000);
          return;
        }

        // Aplicar nova tecla
        const newBindings: KeyBindings = { ...settings.keyBindings };
        const keys = [...newBindings[row.action]] as [string, string | null];
        keys[selectedCol] = e.code;
        newBindings[row.action] = keys as [string, string | null];

        const newSettings = { ...settings, keyBindings: newBindings };
        updateAndSave(newSettings);
        setRemapping(false);
        setConflictMsg(null);
        playMenuSelectSound();
        return;
      }

      // Voltar ao menu
      if (e.code === "Escape") {
        e.preventDefault();
        playMenuSelectSound();
        onBack();
        return;
      }

      // Navegação vertical: ↑/↓ ou W/S sempre muda a LINHA
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        setSelectedRow((prev) => {
          const next = (prev - 1 + menuRows.length) % menuRows.length;
          // Ajusta a coluna ao caso da nova linha (ex: vindo de slider para controle)
          const newCols = menuRows[next].cols;
          if (selectedCol >= newCols) setSelectedCol(0);
          playMenuSelectSound();
          return next;
        });
        return;
      }

      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        setSelectedRow((prev) => {
          const next = (prev + 1) % menuRows.length;
          const newCols = menuRows[next].cols;
          if (selectedCol >= newCols) setSelectedCol(0);
          playMenuSelectSound();
          return next;
        });
        return;
      }

      const currentRow = menuRows[selectedRow];

      // ←/→: em controles troca slot primário/secundário; em sliders ajusta valor
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        if (currentRow.section === "controls") {
          e.preventDefault();
          setSelectedCol(0);
          playMenuSelectSound();
          return;
        }
        if (currentRow.section === "volume" && currentRow.volumeType) {
          e.preventDefault();
          const step = 5;
          const current = currentRow.volumeType === "music" ? settings.musicVolume : settings.sfxVolume;
          const newVal = Math.max(0, current - step);
          if (currentRow.volumeType === "music") {
            setMusicVolume(newVal);
            updateAndSave({ ...settings, musicVolume: newVal });
          } else {
            setSfxVolume(newVal);
            updateAndSave({ ...settings, sfxVolume: newVal });
          }
          return;
        }
        if (currentRow.section === "gameplay" && currentRow.gameplayType === "speed") {
          e.preventDefault();
          const newVal = Math.max(50, settings.playerSpeedMultiplier - 10);
          updateAndSave({ ...settings, playerSpeedMultiplier: newVal });
          return;
        }
      }

      if (e.code === "ArrowRight" || e.code === "KeyD") {
        if (currentRow.section === "controls") {
          e.preventDefault();
          setSelectedCol(1);
          playMenuSelectSound();
          return;
        }
        if (currentRow.section === "volume" && currentRow.volumeType) {
          e.preventDefault();
          const step = 5;
          const current = currentRow.volumeType === "music" ? settings.musicVolume : settings.sfxVolume;
          const newVal = Math.min(100, current + step);
          if (currentRow.volumeType === "music") {
            setMusicVolume(newVal);
            updateAndSave({ ...settings, musicVolume: newVal });
          } else {
            setSfxVolume(newVal);
            updateAndSave({ ...settings, sfxVolume: newVal });
          }
          return;
        }
        if (currentRow.section === "gameplay" && currentRow.gameplayType === "speed") {
          e.preventDefault();
          const newVal = Math.min(200, settings.playerSpeedMultiplier + 10);
          updateAndSave({ ...settings, playerSpeedMultiplier: newVal });
          return;
        }
      }

      // Enter = ação
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();

        if (currentRow.section === "controls" && currentRow.action) {
          // Iniciar remapeamento (afeta o slot atualmente selecionado)
          setRemapping(true);
          setConflictMsg(null);
          playMenuSelectSound();
        } else if (currentRow.section === "gameplay" && currentRow.toggleType) {
          // Alterna toggle correspondente
          const t = currentRow.toggleType;
          const next: GameSettings = { ...settings };
          if (t === "crt") next.crtEffect = !settings.crtEffect;
          else if (t === "shake") next.screenShakeEnabled = !settings.screenShakeEnabled;
          else if (t === "fps") next.showFps = !settings.showFps;
          updateAndSave(next);
          playMenuSelectSound();
        } else if (currentRow.section === "actions" && currentRow.id === "reset-tutorial") {
          // Resetar introduções (vai mostrar novamente da próxima vez)
          resetTutorialState();
          setConflictMsg("Tutorial resetado — sera exibido novamente");
          setTimeout(() => setConflictMsg(null), 2500);
          playMenuSelectSound();
        } else if (currentRow.section === "actions" && currentRow.id === "reset-scores") {
          // Limpar quadro de recordes
          clearHighScores();
          setConflictMsg("Quadro de recordes limpo");
          setTimeout(() => setConflictMsg(null), 2500);
          playMenuSelectSound();
        } else if (currentRow.section === "actions" && currentRow.id === "reset") {
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

      // Delete / Backspace = limpar slot de tecla
      if (e.code === "Delete" || e.code === "Backspace") {
        if (currentRow.section === "controls" && currentRow.action) {
          e.preventDefault();
          const newBindings: KeyBindings = { ...settings.keyBindings };
          const keys = [...newBindings[currentRow.action]] as [string, string | null];

          // Não permitir limpar se é a única tecla restante
          if (selectedCol === 0 && !keys[1]) {
            setConflictMsg("Acao precisa ter pelo menos 1 tecla");
            setTimeout(() => setConflictMsg(null), 2000);
            return;
          }
          if (selectedCol === 1 && !keys[0]) {
            setConflictMsg("Acao precisa ter pelo menos 1 tecla");
            setTimeout(() => setConflictMsg(null), 2000);
            return;
          }

          keys[selectedCol] = null;
          // Se limpou o primário, mover secundário para primário
          if (selectedCol === 0 && keys[1]) {
            keys[0] = keys[1];
            keys[1] = null;
          }
          newBindings[currentRow.action] = keys as [string, string | null];

          const newSettings = { ...settings, keyBindings: newBindings };
          updateAndSave(newSettings);
          playMenuSelectSound();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedRow, selectedCol, remapping, settings, menuRows, onBack, updateAndSave]);

  // ===== Mouse support =====
  // Posições calculadas — devem espelhar o desenho do canvas
  const layout = (() => {
    const actions: GameAction[] = ["left", "right", "jump", "down", "shoot", "pause"];
    const controlsY = 80;
    const startY = controlsY + 18;
    const rowH = 32;
    const gpSectionY = startY + actions.length * rowH + 30;
    const speedY = gpSectionY + 18;
    const speedBarX = CANVAS_WIDTH / 2 - 60;
    const speedBarW = 300;
    const speedBarY = speedY + 6;
    const speedBarH = 16;
    // 3 toggles após o speed bar
    const togglesStartY = speedY + 36;
    const toggleH = 26;
    // Volume section após os 3 toggles
    const volSectionY = speedY + 50 + 3 * 26 + 20;
    const volStartY = volSectionY + 18;
    const resetTutY = volStartY + 80 + 14;
    const resetScY = resetTutY + 38;
    const resetY = resetScY + 40;
    return {
      startY, rowH, speedBarX, speedBarW, speedBarY, speedBarH,
      togglesStartY, toggleH, volStartY, resetTutY, resetScY, resetY,
    };
  })();

  const canvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  type HitResult =
    | { kind: "back" }
    | { kind: "slot"; row: number; col: 0 | 1 }
    | { kind: "speed" }
    | { kind: "toggle"; type: "crt" | "shake" | "fps" }
    | { kind: "music" }
    | { kind: "sfx" }
    | { kind: "reset-tutorial" }
    | { kind: "reset-scores" }
    | { kind: "reset" }
    | null;

  const hitTest = (x: number, y: number): HitResult => {
    // Botão VOLTAR (canto superior esquerdo)
    if (x >= 20 && x <= 20 + 120 && y >= 20 && y <= 20 + 40) {
      return { kind: "back" };
    }
    // Slots de controles
    for (let ai = 0; ai < 6; ai++) {
      const slotY = layout.startY + ai * layout.rowH + 6;
      if (y >= slotY && y <= slotY + 24) {
        for (let s = 0; s < 2; s++) {
          const slotX = CANVAS_WIDTH / 2 - 60 + s * 170;
          if (x >= slotX && x <= slotX + 140) {
            return { kind: "slot", row: ai, col: s as 0 | 1 };
          }
        }
      }
    }
    // Speed bar
    if (
      y >= layout.speedBarY && y <= layout.speedBarY + layout.speedBarH &&
      x >= layout.speedBarX && x <= layout.speedBarX + layout.speedBarW
    ) {
      return { kind: "speed" };
    }
    // Toggles (3 linhas: crt, shake, fps)
    const tx = CANVAS_WIDTH / 2 - 60;
    const tw = 100;
    const types: Array<"crt" | "shake" | "fps"> = ["crt", "shake", "fps"];
    for (let i = 0; i < types.length; i++) {
      const ty = layout.togglesStartY + i * layout.toggleH;
      if (y >= ty && y <= ty + 22 && x >= tx && x <= tx + tw) {
        return { kind: "toggle", type: types[i] };
      }
    }
    // Volume bars
    for (let v = 0; v < 2; v++) {
      const barY = layout.volStartY + v * 40 + 6;
      if (y >= barY && y <= barY + 16 && x >= layout.speedBarX && x <= layout.speedBarX + layout.speedBarW) {
        return v === 0 ? { kind: "music" } : { kind: "sfx" };
      }
    }
    // Reset tutorial
    if (
      y >= layout.resetTutY && y <= layout.resetTutY + 30 &&
      x >= CANVAS_WIDTH / 2 - 140 && x <= CANVAS_WIDTH / 2 + 140
    ) {
      return { kind: "reset-tutorial" };
    }
    // Limpar recordes
    if (
      y >= layout.resetScY && y <= layout.resetScY + 30 &&
      x >= CANVAS_WIDTH / 2 - 140 && x <= CANVAS_WIDTH / 2 + 140
    ) {
      return { kind: "reset-scores" };
    }
    // Reset (padrão)
    if (
      y >= layout.resetY && y <= layout.resetY + 30 &&
      x >= CANVAS_WIDTH / 2 - 120 && x <= CANVAS_WIDTH / 2 + 120
    ) {
      return { kind: "reset" };
    }
    return null;
  };

  const rowIdxFromHit = (h: HitResult): number => {
    if (!h) return -1;
    if (h.kind === "slot") return h.row;
    if (h.kind === "speed") return 6;
    if (h.kind === "toggle") {
      if (h.type === "crt") return 7;
      if (h.type === "shake") return 8;
      return 9; // fps
    }
    if (h.kind === "music") return 10;
    if (h.kind === "sfx") return 11;
    if (h.kind === "reset-tutorial") return 12;
    if (h.kind === "reset-scores") return 13;
    return 14; // reset
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (remapping) return;
    const pos = canvasMousePos(e);
    if (!pos) return;
    const hit = hitTest(pos.x, pos.y);
    if (!hit) return;
    const rowIdx = rowIdxFromHit(hit);
    if (rowIdx >= 0 && rowIdx !== selectedRow) {
      setSelectedRow(rowIdx);
      if (hit.kind === "slot") setSelectedCol(hit.col);
      playMenuSelectSound();
    } else if (hit.kind === "slot" && hit.col !== selectedCol) {
      setSelectedCol(hit.col);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (remapping) return;
    const pos = canvasMousePos(e);
    if (!pos) return;
    const hit = hitTest(pos.x, pos.y);
    if (!hit) return;

    if (hit.kind === "back") {
      playMenuSelectSound();
      onBack();
      return;
    } else if (hit.kind === "toggle") {
      const next: GameSettings = { ...settings };
      if (hit.type === "crt") next.crtEffect = !settings.crtEffect;
      else if (hit.type === "shake") next.screenShakeEnabled = !settings.screenShakeEnabled;
      else if (hit.type === "fps") next.showFps = !settings.showFps;
      updateAndSave(next);
      playMenuSelectSound();
      return;
    } else if (hit.kind === "slot") {
      setSelectedRow(hit.row);
      setSelectedCol(hit.col);
      setRemapping(true);
      setConflictMsg(null);
      playMenuSelectSound();
    } else if (hit.kind === "speed") {
      const ratio = (pos.x - layout.speedBarX) / layout.speedBarW;
      const newVal = Math.round(50 + ratio * 150 / 10) * 10; // step 10, clamp 50-200
      const clamped = Math.max(50, Math.min(200, newVal));
      updateAndSave({ ...settings, playerSpeedMultiplier: clamped });
      playMenuSelectSound();
    } else if (hit.kind === "music" || hit.kind === "sfx") {
      const ratio = (pos.x - layout.speedBarX) / layout.speedBarW;
      const newVal = Math.round((Math.max(0, Math.min(1, ratio)) * 100) / 5) * 5;
      if (hit.kind === "music") {
        setMusicVolume(newVal);
        updateAndSave({ ...settings, musicVolume: newVal });
      } else {
        setSfxVolume(newVal);
        updateAndSave({ ...settings, sfxVolume: newVal });
      }
      playMenuSelectSound();
    } else if (hit.kind === "reset-tutorial") {
      resetTutorialState();
      setConflictMsg("Tutorial resetado — sera exibido novamente");
      setTimeout(() => setConflictMsg(null), 2500);
      playMenuSelectSound();
    } else if (hit.kind === "reset-scores") {
      clearHighScores();
      setConflictMsg("Quadro de recordes limpo");
      setTimeout(() => setConflictMsg(null), 2500);
      playMenuSelectSound();
    } else if (hit.kind === "reset") {
      const defaults = resetSettings();
      setSettings(defaults);
      refreshKeyMap();
      setMusicVolume(defaults.musicVolume);
      setSfxVolume(defaults.sfxVolume);
      playMenuSelectSound();
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

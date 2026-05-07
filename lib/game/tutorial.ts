// ============================
// Neon Escape - Tutorial State (persistente via localStorage)
// ============================
// As intros (telas educativas de inimigos/coletáveis/upgrades) só devem aparecer
// uma vez por instalação — não a cada retry. Por isso ficam fora do gameState.

import type { LevelSection } from "./types";

const STORAGE_KEY = "neon-escape-tutorial";

export interface TutorialState {
  enemiesStreets: boolean;
  enemiesDucts: boolean;
  enemiesBoss: boolean;
  collectibles: boolean;
}

function getDefault(): TutorialState {
  return {
    enemiesStreets: false,
    enemiesDucts: false,
    enemiesBoss: false,
    collectibles: false,
  };
}

let cached: TutorialState | null = null;

export function loadTutorialState(): TutorialState {
  if (cached) return cached;
  if (typeof window === "undefined") {
    cached = getDefault();
    return cached;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TutorialState>;
      cached = { ...getDefault(), ...parsed };
      return cached;
    }
  } catch {
    // localStorage indisponível
  }
  cached = getDefault();
  return cached;
}

function save(state: TutorialState): void {
  cached = state;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage cheio
  }
}

export function markEnemyIntroSeen(zone: LevelSection): void {
  const state = loadTutorialState();
  if (zone === "streets") state.enemiesStreets = true;
  else if (zone === "ducts") state.enemiesDucts = true;
  else if (zone === "boss") state.enemiesBoss = true;
  save(state);
}

export function hasSeenEnemyIntro(zone: LevelSection): boolean {
  const state = loadTutorialState();
  if (zone === "streets") return state.enemiesStreets;
  if (zone === "ducts") return state.enemiesDucts;
  return state.enemiesBoss;
}

export function markCollectibleIntroSeen(): void {
  const state = loadTutorialState();
  state.collectibles = true;
  save(state);
}

export function hasSeenCollectibleIntro(): boolean {
  return loadTutorialState().collectibles;
}

export function resetTutorialState(): void {
  save(getDefault());
}

// ============================
// Neon Escape - High Scores (top 5 persistente)
// ============================

const STORAGE_KEY = "neon-escape-highscores";
const MAX_ENTRIES = 5;

export interface ScoreEntry {
  score: number;
  phaseReached: number; // 1, 2, 3 ou 4 (4 = boss derrotado)
  timeSeconds: number;
  date: string; // ISO date
  runId: string; // identificador único da run — usado para deduplicar
}

export function loadHighScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ScoreEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // localStorage indisponível
  }
  return [];
}

function save(entries: ScoreEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage cheio
  }
}

// Adiciona entrada e retorna o RANK (1-5) ou null se não entrou no top.
// Se já existe entrada com mesmo runId, ela é SUBSTITUÍDA (não duplica) —
// garante 1 run = 1 entrada mesmo que submitScore seja chamado mais de uma vez.
export function submitScore(entry: ScoreEntry): number | null {
  const entries = loadHighScores();
  // Remove qualquer entrada anterior da mesma run (deduplicação por runId)
  const filtered = entries.filter((e) => e.runId !== entry.runId);
  filtered.push(entry);
  // Ordena por score desc, com tiebreaker por fase desc, depois tempo asc
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.phaseReached !== a.phaseReached) return b.phaseReached - a.phaseReached;
    return a.timeSeconds - b.timeSeconds;
  });
  const trimmed = filtered.slice(0, MAX_ENTRIES);
  save(trimmed);

  const rank = trimmed.findIndex((e) => e.runId === entry.runId);
  return rank >= 0 ? rank + 1 : null;
}

export function clearHighScores(): void {
  save([]);
}

export function formatTime(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

# Neon Escape — Revolta da IA

Plataforma 2D side-scroller cyberpunk desenvolvida com Canvas API e Next.js. O jogador
assume o papel de um rebelde em uma megacidade dominada pela inteligência artificial
OMNICORE, atravessando 3 fases até o confronto final.

> Inspirado em Hollow Knight, Celeste, Mega Man X, Dead Cells e Hotline Miami no
> que diz respeito a game feel, level design e identidade visual cyberpunk.

---

## Sumário

- [Gameplay](#gameplay)
- [Mecânicas](#mecânicas)
- [Inimigos](#inimigos)
- [Coletáveis](#coletáveis)
- [Controles](#controles)
- [Como Executar](#como-executar)
- [Empacotamento Desktop (.exe / .AppImage / .dmg)](#empacotamento-desktop)
- [Cheats de Desenvolvedor](#cheats-de-desenvolvedor)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitetura](#arquitetura)
- [Equipe](#equipe)

---

## Gameplay

**Objetivo:** Atravessar a megacidade, derrotar o núcleo da IA OMNICORE e libertar a cidade.

A jogada é dividida em **3 fases independentes** com estilo, ritmo e mecânicas crescentes:

| Fase | Nome | Descrição |
|------|------|-----------|
| 1 | **As Ruas** | Plataformas em terreno aberto. Sub-fase 1.1 (vazia, aprende-se a pular), 1.1b (drones aparecem), 1.2 (coletáveis aparecem). Sem arma. |
| 2 | **Estruturas Elevadas** | Plataformas suspensas com gaps. Drones rápidos + atiradores fixos. Player ganha a arma blaster. |
| 3 | **Confronto Final** | Arena fechada. Boss OMNICORE em movimento de lemniscata (∞), com 3 sub-fases progressivas e tentáculos animados. |

Entre cada fase há transição cinematográfica: tela "Fase Concluída" com resumo de stats →
fade out + loading → próxima fase. Score, vida e munição são preservados.

### Progressão de upgrades

- **Início da Fase 2** → tela de upgrade desbloqueia a **arma Blaster** e introduz munição
- **Início da Fase 3** → escolha entre dois upgrades:
  - **Espingarda** (3 projéteis em leque)
  - **Tiro Rápido** (cooldown reduzido pela metade)

---

## Mecânicas

### Movimento (inspirado em Celeste / Hollow Knight)
- **Coyote time** (7 frames) — pula logo após sair da plataforma
- **Jump buffer** (8 frames) — pulo pré-pressionado funciona ao tocar o chão
- **Variable jump height** — soltar a tecla cedo encurta o salto
- **Squash & stretch** no sprite ao pular e pousar
- **Drop-through** em plataformas flutuantes (S/↓)
- **Velocidade ajustável** nas configurações (50-200%)

### Combate
- **Hit-stop** ao matar inimigo (3-12 frames de freeze) — peso de impacto
- **Knockback** ao receber dano (vx empurra para trás)
- **Tiro crítico** (10% chance) — dano dobrado, bala maior, cor amarela
- **Muzzle flash** no cano da arma a cada disparo
- **Damage numbers** flutuantes a cada acerto (estilo Risk of Rain 2)

### Sistemas de qualidade de vida
- **Tutorial persistente** — telas de intro de inimigos/coletáveis aparecem 1 vez por
  instalação (localStorage), não a cada retry
- **Regen lento de vida** — +1 HP a cada 30s sem tomar dano
- **Pause automático** ao perder foco da janela
- **Indicador de objetivo** ("→ SIGA") aparece após 3s parado em fase nova
- **Hit-flash** branco em inimigos ao receber dano
- **Sequência cinematográfica de morte** (1.25s) com fade vermelho → preto + texto "ABATIDO"

### Visual / Game Feel
- **CRT effect** opcional (scanlines + vignette radial)
- **HiDPI rendering** — canvas em alta resolução interna usando `devicePixelRatio`
- **Camera shake** configurável (acessibilidade — motion sickness)
- **Score pulse** animado ao ganhar pontos
- **HUD ampliado** — corações 30px, score 26px com glow

### Replay / Meta
- **High Scores top 5** persistentes em localStorage
- **Ranking exibido** no menu principal e telas de Game Over / Vitória
- **Indicador "NOVO RECORDE!"** quando rank 1
- **Conquistas implícitas** — fase alcançada + tempo + pontos por entrada

---

## Inimigos

| Inimigo | HP | Score | Comportamento |
|---------|----|-----:|---------------|
| **Drone Patrulheiro** (Z1) | 1 | +10 | Patrulha horizontal, sem tiro |
| **Drone Rápido** (Z2) | 1 | +10 | Patrulha em 3.5 u/s, atira em linha reta horizontal |
| **Atirador Fixo** (Z2) | 3 | +40 | Estacionário, dispara tiro horizontal a cada 2.5s. Drop: +5 munição |
| **Rastreador** (Z3, invocado) | 2 | +25 | Detecta o player e persegue por 3s |
| **OMNICORE** (Boss) | 15 | +500 | 3 fases, lemniscata, tentáculos, contato causa 2 HP |

### Boss OMNICORE — fases de combate

| Fase do Boss | HP restante | Tiro | Spawn de minions |
|--------------|------------|------|------------------|
| Fase 1 | 15 → 11 | 1 tiro reto pra baixo (cooldown 1s) | — |
| Fase 2 | 10 → 6 | 2 tiros em "V" invertido (cooldown 0.75s) | Rastreadores em ondas de 3 |
| Fase 3 | 5 → 0 | Leque de 4 tiros (cooldown 0.5s) | Rastreadores em ondas de 3 |

O boss percorre uma **lemniscata de Bernoulli** (∞ deitado) continuamente, com
6/8/10 tentáculos animados ondulando atrás do corpo, escalando por fase.

---

## Coletáveis

| Item | Cor | Efeito | Onde aparece |
|------|------|--------|--------------|
| 🩷 **Vida** | Rosa-coral | +1 HP | Fase 1.2 + Fase 2 |
| 🟡 **Chip de Dados** | Dourado | +100 score | Fase 1.2 + Fase 2 |
| 🌊 **Munição** | Turquesa | +10 munição | Fase 2 + Fase 3 (não aparece na Fase 1) |

---

## Controles

| Ação | Tecla padrão | Mouse |
|------|------|-------|
| Mover | A / D ou Setas | — |
| Pular | W / Espaço | — |
| Descer plataforma | S / ↓ | — |
| Atirar | J | Clique esquerdo |
| Pausar | ESC | — |
| Continuar (quando pausado) | P | — |
| Confirmar telas | Enter | Clique |
| Navegar menus | ↑ ↓ ← → | Mouse hover + clique |

> Todos os controles de movimento, pulo, atirar e pausar são **remapeáveis** em
> CONFIGURAÇÕES → seção CONTROLES.

---

## Como Executar

### Pré-requisitos
- **Node.js 18+** (recomendado 20+)
- npm ou pnpm

### Instalação
```bash
git clone https://github.com/sammuelmsaraiva/game-facul.git
cd game-facul
npm install
```

### Modo Desenvolvimento (web)
```bash
npm run dev
```
Acesse **http://localhost:3000** (ou porta indicada pelo Next.js).

### Build de Produção (web)
```bash
npm run build
npm run start
```

---

## Empacotamento Desktop

O jogo pode ser empacotado como **executável standalone** para Windows, Linux ou Mac
usando Electron + electron-builder.

### Build para sua plataforma atual
```bash
npm run package
```
O instalador é gerado em `./dist-electron/`.

### Build para plataforma específica
```bash
npm run package:win     # Windows: .exe (instalador) + portable
npm run package:linux   # Linux: .AppImage + .deb
npm run package:mac     # macOS: .dmg
```

### Testar Electron localmente sem empacotar
```bash
npm run build:static    # gera ./out/ (export estático)
npm run electron        # roda Electron com o build
```

Para hot-reload em dev usando Electron:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run electron:dev
```

Veja [BUILD.md](./BUILD.md) para detalhes adicionais sobre cross-build, tamanho dos
executáveis e troubleshooting.

---

## Cheats de Desenvolvedor

Apenas para **testes durante desenvolvimento**. Funcionam durante o gameplay normal.

| Tecla | Efeito |
|-------|--------|
| **Insert** | Liga/desliga **GOD MODE** (invencibilidade total) — indicador "◆ GOD MODE ◆" pisca no canto inferior direito |
| **PageUp** | Vida cheia |
| **PageDown** | Pula para o final da fase atual (na fase 3 mata o boss instantaneamente) |
| **Home** | +50 munição (e desbloqueia a arma se estiver bloqueada) |

> **Atenção:** os cheats persistem no build de produção. Se for distribuir o
> executável para avaliação, considere desabilitar via flag de ambiente ou
> remover os listeners em `lib/game/input.ts`.

---

## Stack Tecnológico

- **Engine:** Canvas 2D nativo (sem bibliotecas externas de jogo)
- **Framework:** Next.js 16 + React 19
- **Linguagem:** TypeScript 5
- **Áudio:** Web Audio API (síntese procedural — sem arquivos de áudio externos)
- **Estilização:** Tailwind CSS 4
- **Persistência:** localStorage (settings, tutorial, high scores)
- **Empacotamento:** Electron 33 + electron-builder 25
- **Resolução:** 1280×720 (16:9), com renderização HiDPI

---

## Arquitetura

```
lib/game/
  engine.ts        — Loop principal, game state, update/render por fase
  types.ts         — Interfaces (Player, Enemy, GameState, ScoreEntry, ...)
  constants.ts     — Constantes de gameplay, física, cores, dimensões
  player.ts        — Lógica do jogador (movimento, colisão, tiro, squash/stretch)
  enemies.ts       — IA dos inimigos (drone, tracker, turret, boss em lemniscata)
  levels.ts        — Geração das 3 fases independentes (buildPhase1/2/3)
  projectiles.ts   — Sistema de projéteis (jogador e inimigos)
  collisions.ts    — Detecção AABB
  camera.ts        — Câmera com follow suave e screen shake (configurável)
  renderer.ts      — Renderização (HUD, sprites, overlays, CRT, intros)
  particles.ts     — Partículas + damage numbers flutuantes
  audio.ts         — Síntese sonora (Web Audio) com variação de pitch
  input.ts         — Input (teclado + mouse + cheats)
  settings.ts      — Configurações persistentes em localStorage
  tutorial.ts      — Flags de "primeira aparição" persistentes
  highscores.ts    — Top 5 com dedup por runId

components/
  game-canvas.tsx       — Componente React do canvas (HiDPI + pause auto)
  menu-screen.tsx       — Menu principal + painel de high scores
  settings-screen.tsx   — Configurações (controles + volume + gameplay + toggles)
  credits-screen.tsx    — Créditos com fontes ampliadas
  game-over-screen.tsx  — Game over + ranking
  victory-screen.tsx    — Vitória + ranking + rank S/A/B/C/D
  how-to-play-screen.tsx — Como Jogar (mecânicas, inimigos, dicas)

electron/
  main.js          — Processo principal do Electron (BrowserWindow)
```

---

## Equipe

| Nome | Função |
|------|--------|
| **Sammuel Moura Saraiva** | Arquitetura, motor Canvas, deploy |
| **João Vinicius P. C. B. Carvalho** | IA dos inimigos, boss fight |
| **Lucas Benevinuto Pereira** | HUD, menus, pontuação |
| **Vinicius Henrique Albino Andrade** | Assets, pixel art, áudio, level design |

**Disciplina:** Introdução ao Desenvolvimento de Jogos — iCEV 2026.1
**Professor:** Samuel Vinicius Pereira de Oliveira

---

## GDD

O Game Design Document completo está disponível em `/gdd` na aplicação.

---

## Licença

Projeto acadêmico — uso educacional.

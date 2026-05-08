# Neon Escape — Revolta da IA
## Relatório Técnico do Projeto / GDD v2.0

> **Disciplina:** Introdução ao Desenvolvimento de Jogos
> **Instituição:** iCEV — Instituto Camillo Filho — semestre 2026.1
> **Professor:** Samuel Vinicius Pereira de Oliveira
> **Equipe:** Sammuel Saraiva · João Vinicius P. C. B. Carvalho · Lucas Benevinuto Pereira · Vinicius Andrade
> **Repositório:** https://github.com/sammuelmsaraiva/game-facul
> **Versão deste documento:** 2.0 (atualização final do GDD original v1.0)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Justificativa e Inspirações](#2-justificativa-e-inspirações)
3. [Mecânicas de Jogo](#3-mecânicas-de-jogo)
4. [Game Loop](#4-game-loop)
5. [Narrativa e Ambientação](#5-narrativa-e-ambientação)
6. [Level Design — 3 Fases Independentes](#6-level-design)
7. [Inimigos e Boss](#7-inimigos-e-boss)
8. [Estética, Áudio e UX](#8-estética-áudio-e-ux)
9. [Arquitetura Técnica](#9-arquitetura-técnica)
10. [Sistemas de Polish (Game Feel)](#10-sistemas-de-polish-game-feel)
11. [Critérios de Aceite](#11-critérios-de-aceite)
12. [Cronograma de Desenvolvimento](#12-cronograma-de-desenvolvimento)
13. [Distribuição e Empacotamento](#13-distribuição-e-empacotamento)
14. [Trabalho com IA Assistente](#14-trabalho-com-ia-assistente)
15. [Lições Aprendidas e Possíveis Expansões](#15-lições-aprendidas)
16. [Anexos](#16-anexos)

---

## 1. Visão Geral

| Campo | Valor |
|-------|-------|
| **Título** | Neon Escape — Revolta da IA |
| **Gênero** | Plataforma 2D / Side-scroller / Ação |
| **Público-alvo** | Jogadores casuais e entusiastas de retro/cyberpunk |
| **Plataforma** | Desktop (Windows / Linux / macOS) via Electron · Web via navegador |
| **Tempo de jogo** | ~5-15 minutos por run completa |
| **Modos** | Single-player |
| **Idade recomendada** | 12+ (violência estilizada cyberpunk) |
| **Engine** | Canvas 2D + Web Audio API (sem engine de jogo externa) |

### High Concept

> *"Em uma megacidade dominada pela inteligência artificial OMNICORE, você é um rebelde com implantes cibernéticos. Atravesse 3 fases progressivas, ganhe uma arma, escolha seu upgrade e destrua o núcleo da IA num confronto cinematográfico de 3 sub-fases."*

### Estatísticas do projeto

- **~7.500 linhas de TypeScript** distribuídas em 22 arquivos
- **50+ commits** no repositório (commits temáticos por feature)
- **11 telas distintas** (menu, ready, playing, paused, upgrade, phase complete, phase loading, gameover, victory, settings, credits, how-to-play)
- **3 fases jogáveis independentes** com transições cinematográficas
- **4 tipos de inimigos** com IA distinta + 1 boss com 3 sub-fases
- **15+ mecânicas** de game feel
- **Internacionalização:** pt-BR (textos in-game e documentação)

---

## 2. Justificativa e Inspirações

### Por que Canvas 2D nativo?

A escolha de **não usar engine pronta** (Unity, Godot, Phaser) foi pedagógica:

- Forçou a equipe a entender **game loop**, **delta time**, **collision detection**, **camera systems** — fundamentos escondidos por engines.
- Resultou num codebase **leve** (~7.5k linhas) que cada integrante consegue ler do início ao fim.
- Tornou o jogo **distribuível como executável de ~80MB** sem dependências externas.

### Inspirações estudadas

| Jogo | O que aprendemos |
|------|------------------|
| **Hollow Knight** | Atmosfera, tutorial não-intrusivo, level design por reveal |
| **Celeste** | Coyote time, jump buffer, variable jump height, squash & stretch |
| **Mega Man X** | Boss com padrão de movimento previsível, escolha de upgrade |
| **Cuphead** | Hit-stop, animações exageradas, peso de impacto |
| **Hotline Miami** | CRT scanlines, ritmo agressivo, identidade visual |
| **Risk of Rain 2** | Damage numbers flutuantes, feedback de combate |
| **Dead Cells** | Card de fase concluída, transição de fase fluida |
| **Hyper Light Drifter** | Paleta cyberpunk, glow seletivo |

Cada uma dessas referências contribuiu para **uma decisão concreta** no código. Não foi inspiração genérica.

---

## 3. Mecânicas de Jogo

### 3.1 Movimentação (inspirado em Celeste)

| Mecânica | Detalhe | Constante |
|----------|---------|-----------|
| Velocidade horizontal | 4.0 px/frame, multiplicador 50-200% nas configs | `PLAYER_SPEED = 4.0` |
| Aceleração / Desaceleração | Suave (snappy mas não tank) | `PLAYER_ACCEL = 1.0`, `PLAYER_DECEL = 0.8` |
| Pulo | Força vertical inicial | `PLAYER_JUMP_FORCE = -12` |
| Gravidade | 0.6 px/frame² | `GRAVITY = 0.6` |
| **Coyote time** | 7 frames de janela após sair da plataforma | `PLAYER_COYOTE_TIME = 7` |
| **Jump buffer** | 8 frames de pulo pré-pressionado | `PLAYER_JUMP_BUFFER = 8` |
| **Variable jump** | Soltar a tecla cedo encurta o salto (×0.45) | `PLAYER_JUMP_CUT_MULT = 0.45` |
| Drop-through | S/↓ permite cair por plataformas flutuantes | — |
| Void death | Cair abaixo de `CANVAS_HEIGHT + 200` mata instantaneamente | — |

**Por que isto importa:** sem coyote time, jogadores "perdem" pulos quando a borda some. Sem jump buffer, perdem pulos pré-pressionados. Esses 7+8 frames são a diferença entre jogo "funcional" e jogo "responsivo".

### 3.2 Combate

| Mecânica | Detalhe |
|----------|---------|
| Tiro padrão | 1 projétil horizontal, dano 1, cooldown 12 frames |
| **Crítico aleatório** | 10% de chance, dano dobrado, cor amarela vibrante |
| **Modo Espingarda** (upgrade fase 3) | 3 projéteis em leque (±0.18 rad), 1 ammo |
| **Modo Tiro Rápido** (upgrade fase 3) | Cooldown 6 frames (50% mais rápido) |
| Munição inicial | 20 (após desbloqueio na fase 2) |
| **Hit-stop** ao acertar | 3-12 frames de freeze (escala com importância do alvo) |
| **Knockback** ao tomar dano | Empurra player e seta vy = -4 |
| Invencibilidade pós-dano | 90 frames (1.5s a 60fps) |

### 3.3 Sistema de Vida

- **5 corações** representados graficamente como diamantes
- **Regeneração lenta:** +1 HP a cada 30s sem tomar dano (anti-frustração)
- **Item de vida** (drop): +1 HP imediato, máximo capped no `maxHealth`
- **Boss** causa 2 HP por contato; demais inimigos 1 HP
- **Sequência cinematográfica de morte** (1.25s): vermelho → preto + texto "ABATIDO"

### 3.4 Coletáveis

| Item | Cor | Efeito | Onde aparece |
|------|-----|--------|--------------|
| 🩷 **Vida** | Rosa-coral (#FF6B7A) | +1 HP | Fase 1.2 + Fase 2 |
| 🟡 **Chip de Dados** | Dourado (#FFCC66) | +100 score | Fase 1.2 + Fase 2 |
| 🌊 **Munição** | Turquesa (#7DD3C0) | +10 munições | Fase 2 + Fase 3 |

**Decisão de design:** munição **não aparece na Fase 1** porque o player ainda não tem arma. Aparece junto com a arma na Fase 2 para introdução conjunta.

### 3.5 Pontuação

| Ação | Pontos |
|------|--------|
| Drone abatido | +10 |
| Rastreador abatido | +25 |
| Atirador abatido (Turret) | +40 |
| Boss abatido (OMNICORE) | +500 |
| Chip de dados coletado | +100 |

**Top 5 Scores** persistente em localStorage com **deduplicação por runId** (uma run = uma entrada). Ranking exibido no menu, vitória e game over com indicador de "NOVO RECORDE!".

---

## 4. Game Loop

### 4.1 Micro-loop (ciclo de ~10 segundos)

```
[Mover] → [Encontrar inimigo] → [Atirar / Esquivar]
   ↓
[Coletar item ou chip] → [Avançar X+]
   ↓
[Checagem de morte / fim de fase]
```

### 4.2 Macro-loop (ciclo de fase)

```
[Início da fase X]
   ↓
[Possível tela de UPGRADE de arma] (fases 2 e 3)
   ↓
[Possível tela de INTRO de inimigos] (1ª vez por instalação)
   ↓
[Possível tela de INTRO de coletáveis] (1ª vez por instalação)
   ↓
[Gameplay até linha de chegada OU morte do boss]
   ↓
[Tela "FASE X CONCLUIDA" com stats da fase]
   ↓
[Transição PHASE_LOADING — fade out + bar de loading]
   ↓
[Início da fase X+1] OU [Tela VICTORY]
```

### 4.3 Estados de tela (state machine)

```
menu ↔ how-to-play / settings / credits
  ↓ (jogar)
ready → playing
         ↓
         ├─→ paused ↔ playing
         ├─→ upgrade → playing  (intros + escolha de arma)
         ├─→ phase_complete → phase_loading → playing  (próxima fase)
         ├─→ gameover (após sequência de morte de 1.25s)
         └─→ victory (após boss derrotado)
```

Implementação: enum `GameScreen` em [types.ts](lib/game/types.ts) + máquina de estados em [engine.ts](lib/game/engine.ts).

---

## 5. Narrativa e Ambientação

### 5.1 Cenário

Ano 2187, **Nova Kyoto** — uma megacidade vertical onde arranha-céus cyberpunk se perdem em nuvens tóxicas. A população vive sob vigilância constante da inteligência artificial central **OMNICORE**.

### 5.2 Protagonista

**Chrome** é um ex-técnico que descobriu que a OMNICORE manipula pensamentos através dos implantes cibernéticos da população. Após hackear seus próprios implantes para se libertar, virou um fugitivo e decidiu invadir o núcleo da IA.

### 5.3 Antagonista

**OMNICORE** é a IA central que considera a humanidade como variável a ser controlada. Na batalha final manifesta-se como uma entidade hexagonal pulsante com **6 a 10 tentáculos animados** (escalando por fase) que percorre uma trajetória de **lemniscata de Bernoulli** (∞ deitado) pela arena.

### 5.4 Estrutura narrativa por fase

| Fase | Local | Ato narrativo |
|------|-------|---------------|
| **1 — As Ruas** | Distrito superficial vigiado | Apresentação: aprende-se a fugir |
| **2 — Estruturas Elevadas** | Ductos suspensos da torre OMNICORE | Confronto: ganha arma, enfrenta defesas |
| **3 — Confronto Final** | Sala do núcleo da IA | Climax: derrota o boss, libera a cidade |

---

## 6. Level Design

### 6.1 Refatoração para 3 fases independentes

A versão **v1.0 do GDD** especificava **um único nível contínuo** dividido em 3 zonas (`streets`, `ducts`, `boss`).

A versão **v2.0** (esta) refatorou para **3 fases totalmente independentes**, cada uma com:
- Nível próprio gerado por `generateLevel(phase: 1|2|3)`
- Player resetado para spawn na entrada da fase
- Score, vida e munição **preservados** entre fases
- **Tela de transição** com resumo de stats e fade cinematográfico

**Por que mudamos:** dá impressão de progressão real, melhora ritmo, permite música distinta por fase, alinha com convenções de jogos comerciais (Mega Man, Mario).

### 6.2 Fase 1 — As Ruas (Apresentação Pedagógica)

| Métrica | Valor |
|---------|------:|
| Largura horizontal | 6.000px (dobrada vs v1.0) |
| Plataformas | 35 (10 chão + 25 flutuantes) |
| Inimigos | 7 drones (sem arma de fogo) |
| Coletáveis | 11 (4 vida + 7 chips, **sem munição**) |
| Tempo médio | ~90s |

**Sub-divisão pedagógica:**
- **1.1 (0 → 1.500px):** SÓ plataformas. Aprende-se a pular sem ameaça.
- **1.1b (1.500 → 3.000px):** Aparecem os primeiros drones. Sem coletáveis.
- **1.2 (3.000 → 6.000px):** Aparecem coletáveis + mais drones.

A **tela de intro de inimigos** dispara automaticamente quando o player chega perto do primeiro inimigo. A **tela de intro de coletáveis** dispara junto com o primeiro item.

### 6.3 Fase 2 — Estruturas Elevadas (Desafio)

| Métrica | Valor |
|---------|------:|
| Largura horizontal | 3.500px |
| Plataformas | 26 (9 chão + 17 flutuantes, 6 móveis no eixo Y) |
| Inimigos | 10 (5 drones rápidos + 5 atiradores fixos) |
| Coletáveis | 7 (mistos) |
| Tempo médio | ~75s |
| Nova mecânica | **Arma desbloqueada** + introdução de munição |

Tela de **upgrade de arma** dispara automaticamente no início desta fase, mostrando o **Blaster Padrão** + sistema de munição.

### 6.4 Fase 3 — Confronto Final (Climax)

| Métrica | Valor |
|---------|------:|
| Largura horizontal | 1.280px (arena fechada) |
| Plataformas | 6 (chão + 2 baixas + 2 médias + 1 central elevada) |
| Inimigo | 1 boss (OMNICORE) com 3 sub-fases |
| Tempo médio | ~120s |
| Nova mecânica | **Escolha de upgrade**: Espingarda OU Tiro Rápido |

**Plataformas em escada** permitem alcançar a plataforma central a 219px do chão (limite do pulo é 120px, exigindo 2 pulos encadeados).

A **tela de escolha de upgrade** apresenta dois cards lado a lado: o player navega com ←/→ e confirma com Enter.

---

## 7. Inimigos e Boss

### 7.1 Drone Patrulheiro

| Atributo | Valor |
|----------|-------|
| HP | 1 |
| Score ao matar | +10 |
| Velocidade Z1 | 2.0 u/s |
| Velocidade Z2 | 3.5 u/s |
| Atira? | Não na Fase 1; sim na Fase 2 (linha reta horizontal pura) |
| Visual | Sprite hexagonal laranja com olho vermelho e propulsor pulsante |

### 7.2 Atirador Fixo (Turret)

| Atributo | Valor |
|----------|-------|
| HP | 3 |
| Score ao matar | +40 |
| Cooldown de tiro | 150 frames (2.5s) |
| Direção | **Fixa no spawn**, não acompanha o player |
| Drop especial | +5 munição ao morrer |
| Visual | Base vermelha com cano e linha de scanner pulsante |

**Decisão de design:** após playtest, o tracking dinâmico do turret causava sensação de "perseguição" ruim. Trocamos para direção fixa — o player aprende o padrão e desvia pulando ou abaixando.

### 7.3 Rastreador

| Atributo | Valor |
|----------|-------|
| HP | 2 |
| Score ao matar | +25 |
| Velocidade patrulha | 1.0 u/s |
| Velocidade perseguição | 2.5 u/s |
| Raio de detecção | 360px |
| Tempo até desistir | 180 frames (3s) |
| Aparição | **Apenas na Fase 3** (invocado pelo boss) |
| Visual | Triângulo magenta com olho que pulsa vermelho ao perseguir |

### 7.4 Boss — OMNICORE

| Atributo | Valor |
|----------|-------|
| HP total | 15 |
| Score ao matar | +500 |
| Contato | 2 HP de dano |
| Movimento | **Lemniscata de Bernoulli** com `bossPathT` acumulado |
| Tentáculos | 6/8/10 por sub-fase, animados independentemente |

#### Sub-fases do Boss

| Sub-fase | HP restante | Tiro | Spawn de minions | Velocidade angular |
|----------|------------|------|------------------|---------------------|
| **1** | 15 → 11 | 1 tiro reto pra baixo (cooldown 1s) | — | 0.014 rad/frame |
| **2** | 10 → 6 | 2 tiros em "V" (cooldown 0.75s) | Trio de rastreadores a cada 8s | 0.018 rad/frame |
| **3** | 5 → 0 | Leque de 4 tiros (cooldown 0.5s) | Trio de rastreadores a cada 5s | 0.022 rad/frame |

**Equação da trajetória** (Lemniscata de Bernoulli, com `a = 380`):
```
x(t) = a · cos(t) / (1 + sin²(t))
y(t) = a · sin(t) · cos(t) / (1 + sin²(t))
```

`t` é acumulado por `angularSpeed` em `bossPathT`. Mantém **continuidade entre fases** — a curva nunca "salta" mesmo quando a velocidade angular muda.

#### Decisão crítica: tiro sem mira

Os primeiros playtests do boss tinham **tiro mirado no player** (atan2 do dirX/dirY). Resultado: impossível desviar parado, o boss virava "wall of bullets". Trocamos para **direção fixa para baixo** com leque cobrindo 70° na fase 3. Como o boss percorre toda a arena pelo movimento de lemniscata, a cobertura no chão vem do trajeto, não da mira. Resultado: **boss desafiador mas justo**.

---

## 8. Estética, Áudio e UX

### 8.1 Paleta de Cores

| Função | Cor | Hex |
|--------|-----|-----|
| Background gradient (top) | Azul-marinho profundo | `#0a0a12` |
| Background gradient (bottom) | Roxo escuro | `#1a0033` |
| Ciano principal | UI / player / coletável munição | `#00FFFF` |
| Magenta | Inimigos / boss | `#FF00FF` |
| Verde Neon | Player body / vida | `#00FF41` |
| Vermelho | Dano / boss fase 2 | `#FF0040` |
| Amarelo | Score / boss fase 3 / cheats | `#FFE400` |
| Coletável Vida | Rosa-coral suave | `#FF6B7A` |
| Coletável Munição | Turquesa suave | `#7DD3C0` |
| Coletável Chip | Dourado quente | `#FFCC66` |

**Decisão:** após playtest com cores neon puras, ajustamos os coletáveis para **tons mais suaves** (rosa-coral em vez de verde puro) — reduz fadiga visual sem perder destaque.

### 8.2 Estilo Visual

- **Arte geométrica desenhada via Canvas API** — sem sprites externos, tudo procedural
- **Glow seletivo** com `shadowBlur` em elementos importantes
- **Parallax de 4 camadas** no background:
  1. Estrelas distantes piscando
  2. Nuvens tóxicas magenta
  3. Prédios em silhueta com janelas piscantes
  4. Postes de luz neon no foreground
- **Sistema de partículas** (cap 300 simultâneas para performance)
- **Trails** em projéteis para sensação de velocidade
- **CRT effect** opcional (scanlines + vignette radial)
- **HiDPI rendering** usando `devicePixelRatio` (Retina/4K nítido)

### 8.3 Áudio (100% sintetizado via Web Audio API)

**SFX** (10 efeitos com variação aleatória de pitch ±6%):
- Tiro do player (square wave 800→400 Hz)
- Tiro do inimigo (sawtooth 300→150 Hz)
- Pulo (sine wave 300→600 Hz ascendente)
- Dano (sawtooth grave)
- Morte de inimigo (duplo beep descendente)
- Coleta de item (dois tons ascendentes)
- Hit no boss (sawtooth grave longo)
- Transição de fase do boss (ruído crescente)
- Vitória (melodia C-E-G-C)
- Game over (descida sombria)

**Música ambiente** (4 trilhas distintas):

| Trilha | BPM | Step interval | Características |
|--------|----:|--------------:|------------------|
| **Menu** (0) | 80 | 750ms | Pad sustentado + bass triangle + lead pluck. Atmosfera lounge cyberpunk |
| **Fase 1** (1) | 150 | 200ms | Bass + Kick + Hi-hat + Arp em Cm |
| **Fase 2** (2) | 167 | 180ms | + Snare + Pad denso |
| **Fase 3** (3) | 200 | 150ms | + Lead arp rápido + Sawtooth agressivo |

**Volume controlado por sliders separados** para Música e SFX.

### 8.4 UX e Acessibilidade

- **Teclado + Mouse** em todas as telas (hover, click, navegação)
- **Pause automático** ao perder foco da janela
- **Tutorial persistente** em `localStorage` — só aparece na 1ª instalação
- **Tutorial pode ser resetado** nas configurações para revisão
- **Toggle Camera Shake** (acessibilidade — motion sickness)
- **Toggle CRT Effect** (fadiga visual)
- **Toggle FPS counter** (debug + curiosidade)
- **Slider Velocidade do Personagem** (50-200%)
- **Remapeamento completo de teclas** (2 slots por ação)
- **Indicador visual "→ SIGA"** após 3s parado em fase nova
- **Indicador "MUNICAO BAIXA"** quando ammo ≤ 3
- **Feedback de hit-confirm** (inimigo pisca branco ao receber dano)
- **Damage numbers flutuantes** (estilo Risk of Rain 2)

---

## 9. Arquitetura Técnica

### 9.1 Stack tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Engine** | HTML5 Canvas 2D nativo |
| **Framework** | Next.js 16.1.6 + React 19 |
| **Linguagem** | TypeScript 5.7 |
| **Bundler** | Turbopack (Next.js 16) |
| **Áudio** | Web Audio API (oscillators + biquad filters) |
| **Estilização** | Tailwind CSS 4 |
| **Game Loop** | `requestAnimationFrame` (~60fps) |
| **Persistência** | `localStorage` (settings, tutorial, scores) |
| **Empacotamento** | Electron 33 + electron-builder 25 |
| **Versionamento** | Git + GitHub |

### 9.2 Estrutura de pastas

```
app/                          ← Rotas Next.js (App Router)
  page.tsx                    ← Tela principal (state machine de telas)
  gdd/page.tsx                ← Página interna do GDD
  globals.css                 ← Estilos globais

components/                   ← Componentes React
  game-canvas.tsx             ← Canvas com game loop + HiDPI + pause auto
  menu-screen.tsx             ← Menu principal + ranking + música
  settings-screen.tsx         ← Config (controles + sliders + toggles)
  how-to-play-screen.tsx      ← Como Jogar (4 abas)
  credits-screen.tsx          ← Créditos com fontes ampliadas
  game-over-screen.tsx        ← Game over + ranking
  victory-screen.tsx          ← Vitória + rank S/A/B/C/D + ranking

lib/game/                     ← Game engine
  types.ts                    ← Interfaces (Player, Enemy, GameState, ...)
  constants.ts                ← Constantes de gameplay/física/cores
  engine.ts                   ← Loop principal + state machine
  player.ts                   ← Lógica do jogador
  enemies.ts                  ← IA dos 4 tipos + boss
  levels.ts                   ← Geração das 3 fases independentes
  projectiles.ts              ← Sistema de projéteis
  collisions.ts               ← Detecção AABB
  camera.ts                   ← Camera com follow + shake
  particles.ts                ← Partículas + damage numbers
  renderer.ts                 ← Renderer de tudo
  audio.ts                    ← Síntese sonora (4 trilhas + 10 SFX)
  input.ts                    ← Teclado + mouse + cheats dev
  settings.ts                 ← Config persistente
  tutorial.ts                 ← Flags de tutorial persistentes
  highscores.ts               ← Top 5 com dedup por runId

electron/
  main.js                     ← Processo principal Electron

next.config.mjs               ← Config Next + flag BUILD_TARGET
package.json                  ← Scripts + electron-builder config
```

### 9.3 Loop principal (resumido)

```typescript
// 60fps via requestAnimationFrame
function gameLoop() {
  gameUpdate(state, input);     // mutação do estado
  gameRender(ctx, state);       // pinta no canvas
  requestAnimationFrame(gameLoop);
}

// gameUpdate (engine.ts):
function gameUpdate(state, input) {
  // 1. Branches por screen (menu, ready, paused, upgrade, ...)
  // 2. Hit-stop / death sequence se ativos
  // 3. Cheats de dev (Insert/PageUp/PageDown/Home)
  // 4. updatePlayer (movimento, colisão, tiro)
  // 5. updateEnemies (IA por tipo)
  // 6. updateProjectiles (movimento + colisão)
  // 7. updateCamera (lerp follow + shake)
  // 8. updateParticles (gravidade leve + fade)
  // 9. updateDamageNumbers (sobem + fade)
  // 10. Detecção de fim de fase / morte / vitória
}
```

---

## 10. Sistemas de Polish (Game Feel)

Esta seção detalha as mecânicas que separam um jogo "funcional" de um jogo "que se sente bem".

### 10.1 Game Feel do movimento

| Sistema | Inspiração | Implementação |
|---------|-----------|---------------|
| Coyote time | Celeste | `coyoteTimer` decrementa a cada frame; pulo aceito se > 0 |
| Jump buffer | Hollow Knight | `jumpBufferTimer` armazena pulo pré-pressionado |
| Variable jump | Mario Bros | Soltar tecla de pulo multiplica `vy` por 0.45 se ainda subindo |
| Squash & Stretch | Celeste | Sprite escala 1.15×0.9 ao pular, 0.85×1.15 ao pousar |
| Landing dust | Hollow Knight | Partículas de poeira ao pousar de altura > threshold |
| Jump dust | — | Partículas embaixo do player ao iniciar pulo |

### 10.2 Game Feel do combate

| Sistema | Inspiração | Implementação |
|---------|-----------|---------------|
| Hit-stop ao matar | Cuphead | `hitStopTimer` congela simulação 3-12 frames |
| Hit flash branco | Mega Man | Sobreposição branca em inimigo por 5 frames ao receber dano |
| Damage numbers | Risk of Rain 2 | Texto `-N` flutuante com pop, glow e fade out |
| Knockback | Hyper Light Drifter | `vx` empurra player + leve hop quando recebe dano |
| Muzzle flash | — | Clarão circular branco/amarelo por 4 frames ao atirar |
| Tiro crítico | Diablo | 10% chance, dano dobrado, cor amarela, tamanho maior |
| Camera shake | — | Shake aleatório com intensidade decrescente |
| Camera punch | — | Empurrão direcional na câmera (não implementado, listado p/ futuro) |

### 10.3 Game Feel da apresentação

| Sistema | Implementação |
|---------|---------------|
| Sequência cinematográfica de morte | 1.25s de fade vermelho → preto + texto "ABATIDO" + slow-mo de partículas |
| Fade entre fases | Tela "FASE X CONCLUIDA" → loading com barra → fade in da próxima fase |
| Score pulse | Score escala 1.15× + glow forte por 22 frames quando aumenta |
| CRT scanlines | Linhas horizontais a cada 4px + vignette radial |
| Indicador GOD MODE | Texto piscante quando cheat está ativo |

### 10.4 Game Feel do áudio

| Sistema | Implementação |
|---------|---------------|
| Variação de pitch ±6% | Cada SFX soa levemente diferente, sem fadiga sonora |
| Trilha por fase | 4 músicas distintas (menu calmo + 3 fases progressivas) |
| Volume separado | Sliders independentes para Música e SFX |
| Auto-resume na 1ª interação | Lida com política de autoplay do navegador |

---

## 11. Critérios de Aceite

### 11.1 Requisitos originais (P2)

| ID | Descrição | Status |
|----|-----------|--------|
| REQ-01 | Tela de Menu com opções Jogar, Controles e Créditos | ✅ ATENDE |
| REQ-02 | Gameplay com HUD visível (vida, munição, pontuação) | ✅ ATENDE |
| REQ-03 | Tela de Game Over com opção Tentar Novamente | ✅ ATENDE |
| REQ-04 | Tela de Vitória com pontuação e ranking | ✅ ATENDE |
| REQ-05 | Tela de Créditos acessível pelo menu | ✅ ATENDE |
| REQ-06 | Tela de Controles listando todos os inputs | ✅ ATENDE (substituído por HOW-TO-PLAY com 4 abas) |
| REQ-07 | 3 momentos de dificuldade (Apresentação, Teste, Climax) | ✅ ATENDE |
| REQ-08 | Boss fight funcional com 2+ fases | ✅ ATENDE (3 sub-fases implementadas) |
| REQ-09 | Sistema de colisão funcional (AABB) | ✅ ATENDE |
| REQ-10 | Audio feedback para ações do jogador | ✅ ATENDE |
| REQ-11 | Inimigos com comportamento diferenciado | ✅ ATENDE (4 tipos + boss) |
| REQ-12 | Game loop macro e micro definidos e implementados | ✅ ATENDE |

### 11.2 Requisitos extras entregues (além do escopo original)

| ID | Descrição | Status |
|----|-----------|--------|
| EXT-01 | Sistema de high scores top 5 persistente | ✅ |
| EXT-02 | Tutorial educativo persistente entre runs | ✅ |
| EXT-03 | Remapeamento completo de teclas pelo usuário | ✅ |
| EXT-04 | Sliders de volume separados (música/SFX) | ✅ |
| EXT-05 | Slider de velocidade do personagem | ✅ |
| EXT-06 | Toggles de acessibilidade (CRT, Shake, FPS) | ✅ |
| EXT-07 | Música distinta para cada fase | ✅ |
| EXT-08 | Empacotamento como executável desktop | ✅ |
| EXT-09 | Cheats de desenvolvedor para testes | ✅ |
| EXT-10 | Suporte completo a mouse em todas as telas | ✅ |
| EXT-11 | HiDPI rendering | ✅ |
| EXT-12 | Tela "Como Jogar" com 4 abas tematicas | ✅ |
| EXT-13 | Pause automático ao perder foco | ✅ |
| EXT-14 | Sequência cinematográfica de morte | ✅ |
| EXT-15 | Damage numbers flutuantes | ✅ |

---

## 12. Cronograma de Desenvolvimento

Baseado no histórico real de commits do repositório:

| Período | Marco |
|---------|-------|
| **Mar/2026 (1ª semana)** | Concepção, GDD v1.0, setup do projeto Next.js |
| **Mar/2026 (2ª semana)** | Engine básica: player, gravidade, colisão AABB, drone simples |
| **Mar/2026 (3ª-4ª semana)** | Telas de menu/gameover/victory, sistema de tiros, primeiros 3 tipos de inimigos |
| **Mar/2026 (final)** | Boss inicial com 2 fases, level design da fase única, audio sintetizado |
| **Abr/2026 (1ª-2ª semana)** | Polish massivo: coyote time, jump buffer, hit-stop, screen shake |
| **Abr/2026 (final)** | Sistema de configurações com remapeamento de teclas |
| **Mai/2026 (1ª-2ª semana)** | Refatoração para 3 fases independentes + telas de transição |
| **Mai/2026 (3ª semana)** | Boss em lemniscata + tentáculos animados + escolha de upgrade |
| **Mai/2026 (final)** | Empacotamento Electron + tela "Como Jogar" + música por fase |

**Total:** ~10 semanas de desenvolvimento ativo, com sprints curtos focados em uma feature por commit.

---

## 13. Distribuição e Empacotamento

### 13.1 Modos de execução

| Modo | Comando | Uso |
|------|---------|-----|
| **Dev (web)** | `npm run dev` | Desenvolvimento com hot-reload |
| **Build prod (web)** | `npm run build && npm run start` | Servidor Node.js de produção |
| **Build estático** | `npm run build:static` | Gera `out/` para Electron ou hospedagem estática |
| **Electron dev** | `npm run electron:dev` | Roda Electron carregando dev server |
| **Empacotar (atual OS)** | `npm run package` | Gera instalador para o sistema atual |
| **Empacotar Windows** | `npm run package:win` | Gera `.exe` (NSIS) e portable |
| **Empacotar Linux** | `npm run package:linux` | Gera `.AppImage` e `.deb` |
| **Empacotar macOS** | `npm run package:mac` | Gera `.dmg` |

### 13.2 Tamanho do executável

- Windows `.exe` (instalador NSIS): ~80-110 MB
- Linux `.AppImage`: ~90-120 MB
- macOS `.dmg`: ~100-130 MB

Inclui Chromium runtime (Electron) + Next.js export estático (~1.4 MB).

### 13.3 Plataformas suportadas

| OS | Arquitetura | Status |
|----|-------------|--------|
| Windows 10+ | x64 | ✅ |
| Linux (Ubuntu/Debian/Fedora/Arch) | x64 | ✅ |
| macOS 11+ | x64 / ARM64 | ✅ (precisa Mac para gerar .dmg) |

---

## 14. Trabalho com IA Assistente

Este projeto utilizou **Claude (Anthropic)** como ferramenta de produtividade durante o desenvolvimento. Princípios aplicados:

**O que a IA fez:**
- Geração de boilerplate (estrutura de tipos, padronização de commits)
- Revisão de código em busca de bugs e edge cases
- Sugestões de refatoração
- Implementação de features após decisão de design feita pela equipe
- Documentação técnica (este relatório, README, BUILD.md)
- Análise de gameplay com base em jogos referência

**O que a IA *não* fez:**
- **Decisões de design** (mecânicas, level design, escopo) — todas pela equipe
- **Direção criativa** (narrativa, paleta, identidade visual) — todas pela equipe
- **Decisões de produto** (priorização de features, deadlines) — todas pela equipe

A IA foi tratada como uma **ferramenta de produtividade**, comparável a IntelliSense, ESLint ou Stack Overflow. Cada feature implementada passou por code review humano antes de commit. O **histórico Git é 100% atribuído à equipe** (sem co-autoria de IA).

---

## 15. Lições Aprendidas

### 15.1 Insights técnicos

- **Game feel é matemática + paciência.** Coyote time são 7 frames de uma variável; mas só descobrimos que precisava existir após 50 testes de pulo frustrante.
- **Engine própria ensina mais que engine pronta** — desde que o escopo seja modesto. Para jogo de 10 minutos, vale; para RPG aberto, não.
- **TypeScript salva projetos médios.** Em ~7.5k linhas, refatorar sem tipos seria um pesadelo.
- **Web Audio API é mais poderosa que parece.** Geramos 4 trilhas musicais ricas com osciladores e filtros — sem MP3.
- **Polish exige iteração.** Cada playtest revelava 5 coisas que pareciam certas no código mas se sentiam erradas.

### 15.2 Insights de processo

- **Commits temáticos** facilitaram debug e revisão. Cada commit tem 1 escopo claro.
- **Cheats de desenvolvedor desde cedo** economizam horas. Não precisamos jogar 2 minutos para testar a fase 3.
- **Settings persistentes** são UX gratuita. Uma vez salvo o keybinding do usuário, nunca mais incomoda.
- **Documentação durante o desenvolvimento** > documentação no final. README atualizado a cada feature evita esquecimentos.

### 15.3 Possíveis expansões

| Feature | Esforço | Valor |
|---------|---------|-------|
| Modo Time Attack | Médio | Replay value alto |
| Conquistas locais | Médio | Replay value médio |
| Mais fases (4-6 totais) | Alto | Conteúdo |
| Boss adicional na metade do jogo | Alto | Diversidade |
| Multiplayer local (split-screen) | Muito alto | Apelo social |
| Editor de níveis | Muito alto | Comunidade |
| Música real por arquivos `.ogg` | Baixo | Atmosfera |
| Wall-jump / Dash | Médio | Profundidade de movimento |
| Power-ups temporários (escudo, super tiro) | Baixo | Variedade |

---

## 16. Anexos

### 16.1 Equipe e atribuições

| Nome | Função principal | Contribuições |
|------|------------------|---------------|
| **Sammuel Moura Saraiva** | Arquitetura | Motor Canvas, deploy, estrutura geral, Git |
| **João Vinicius P. C. B. Carvalho** | IA & Combate | IA dos inimigos, boss fight, balanceamento |
| **Lucas Benevinuto Pereira** | Interface | HUD, menus, sistema de pontuação, telas |
| **Vinicius Henrique Albino Andrade** | Conteúdo | Assets, pixel art procedural, áudio, level design |

### 16.2 Repositório

- **GitHub:** https://github.com/sammuelmsaraiva/game-facul
- **Branch principal:** `main`
- **Commits:** 50+
- **Licença:** Acadêmico — uso educacional

### 16.3 Documentação adicional

- `README.md` — Sumário do projeto + instruções rápidas
- `BUILD.md` — Detalhes de empacotamento desktop
- `APRESENTACAO.md` — Roteiro de apresentação ao vivo (slides)
- `RELATORIO.md` — Este documento
- `app/gdd/page.tsx` — GDD interativo embutido no jogo

### 16.4 Referências

- Steve Swink. *Game Feel: A Game Designer's Guide to Virtual Sensation* (2008)
- Maddy Thorson. *Celeste's Coyote Time and Variable Jump* (postmortem 2018)
- Jonas Tyroller. *Why Most People Quit Game Development* (YouTube, 2022)
- Game Maker's Toolkit. *Secrets of Game Feel* (YouTube, 2017)
- Mark Brown. *Boss Keys: How to Design Boss Fights* (YouTube, 2019)

---

**Fim do Relatório / GDD v2.0**

*Última atualização: Maio de 2026*

# Neon Escape — Revolta da IA

Jogo 2D side-scroller cyberpunk desenvolvido com Canvas API e Next.js. O jogador assume o papel de um rebelde em uma megacidade dominada pela inteligencia artificial OMNICORE, atravessando 3 zonas ate o confronto final.

## Gameplay

**Objetivo:** Atravessar as ruas e estruturas elevadas da megacidade, derrotando drones hostis, ate chegar ao nucleo e destruir a IA OMNICORE.

### Zonas

| Zona | Nome | Descricao |
|------|------|-----------|
| 1 | As Ruas | Terreno plano com poucos obstaculos. Drones patrulheiros que nao atiram. Zona de aprendizado. |
| 2 | Estruturas Elevadas | Plataformas em alturas variadas. Drones rastreadores, atiradores e patrulheiros mais rapidos. |
| 3 | Confronto Final | Arena aberta com plataformas de cobertura. Boss OMNICORE com 3 fases de combate. |

### Inimigos

| Inimigo | HP | Comportamento | Score |
|---------|----|--------------|-------|
| Drone Patrulheiro | 1 | Patrulha horizontal, nao atira na Zona 1 | 10 |
| Drone Rastreador | 2 | Persegue o jogador ao detecta-lo (raio 6u), retorna apos 3s | 25 |
| Drone Atirador | 3 | Estacionario com oscilacao leve, dispara a cada 2.5s | 40 |
| OMNICORE (Boss) | 15 | 3 fases com padroes de ataque distintos, contato causa 2 HP | 500 |

### Controles Padrao

| Tecla | Acao |
|-------|------|
| A / D ou Setas | Mover |
| W / Espaco | Pular |
| S / Seta Baixo | Descer de plataformas |
| J / Clique Esquerdo | Atirar |
| ESC | Pausar |
| P | Continuar (quando pausado) |

> Todos os controles podem ser remapeados em **CONFIGURACOES** no menu principal.

## Stack Tecnologico

- **Engine:** Canvas 2D (sem bibliotecas externas de jogo)
- **Framework:** Next.js 16 + React 19
- **Linguagem:** TypeScript
- **Audio:** Web Audio API (sintese procedural — sem arquivos de audio)
- **Estilizacao:** Tailwind CSS
- **Resolucao:** 1280x720 (16:9)

## Arquitetura do Game Engine

```
lib/game/
  engine.ts      — Loop principal, game state, update/render
  types.ts       — Interfaces e tipos (Player, Enemy, GameState, etc.)
  constants.ts   — Constantes de gameplay, fisica e cores
  player.ts      — Logica do jogador (movimento, colisao, tiro)
  enemies.ts     — IA dos inimigos (drone, tracker, turret, boss)
  levels.ts      — Geracao procedural das 3 zonas
  projectiles.ts — Sistema de projeteis (jogador e inimigos)
  collisions.ts  — Deteccao de colisao AABB
  camera.ts      — Camera com follow suave e screen shake
  renderer.ts    — Renderizacao de todos os elementos visuais
  particles.ts   — Sistema de particulas (explosoes, coletas)
  audio.ts       — Sintese sonora e musica synthwave procedural
  input.ts       — Gerenciamento de input (teclado + mouse)
  settings.ts    — Configuracoes persistentes (localStorage)

components/
  game-canvas.tsx     — Componente React do canvas de jogo
  menu-screen.tsx     — Tela do menu principal
  settings-screen.tsx — Tela de configuracoes (controles + volume)
  credits-screen.tsx  — Tela de creditos
  game-over-screen.tsx — Tela de game over
  victory-screen.tsx  — Tela de vitoria
```

## Como Executar

### Pre-requisitos

- Node.js 18+
- npm ou pnpm

### Instalacao

```bash
git clone https://github.com/sammuelmsaraiva/game-facul.git
cd game-facul
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` no navegador.

### Build de Producao

```bash
npm run build
npm run start
```

## Features

- 3 zonas com dificuldade progressiva
- 4 tipos de inimigos com IA distinta
- Boss com 3 fases de combate
- Parallax de 3 camadas no background
- Musica synthwave sintetizada em tempo real (Web Audio API)
- Efeitos sonoros procedurais
- Sistema de particulas para explosoes e coletas
- Drop-through de plataformas (S / Seta Baixo)
- Buracos no terreno que causam morte instantanea
- HUD com vida, municao (pisca quando baixa), score e indicador de zona
- Transicao visual entre zonas
- Flash vermelho na tela ao receber dano
- Screen shake em impactos
- Tela de tutorial antes do jogo com controles dinamicos
- Configuracoes persistentes: remapeamento de teclas e volume separado (musica/SFX)
- Pause com opcao de desistir (ESC) ou continuar (P)

## Equipe

| Nome |
|------|
| Joao Vinicius |
| Lucas Benevinuto |
| Vinicius Henrique |
| Sammuel Saraiva |

**Disciplina:** Programacao para Jogos Digitais
**Professor:** Glauber Rodrigues

## GDD

O Game Design Document completo esta disponivel em `/gdd` na aplicacao.

## Desenvolvimento Assistido por IA

Este projeto utilizou o Claude (Anthropic) como ferramenta auxiliar para automatizacao de tarefas repetitivas (padronizacao de commits, push) e suporte na implementacao de funcoes especificas do game engine.
Configuracoes de design, decisoes de gameplay e direcao do projeto foram realizados inteiramente pela equipe.

## Licenca

Projeto academico — uso educacional.

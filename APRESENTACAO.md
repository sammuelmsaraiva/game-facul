# Neon Escape — Revolta da IA
## Roteiro de Apresentação

**Equipe:** Sammuel Saraiva · João Vinicius · Lucas Benevinuto · Vinicius Andrade
**Disciplina:** Introdução ao Desenvolvimento de Jogos — iCEV 2026.1
**Professor:** Samuel Vinicius Pereira de Oliveira
**Duração estimada:** 10-12 minutos

---

## SLIDE 1 — CAPA  *(30s)*

> **NEON ESCAPE: REVOLTA DA IA**
>
> *Plataforma 2D Cyberpunk*
>
> [logo iCEV / FADEX]
>
> Equipe: Sammuel · João Vinicius · Lucas · Vinicius
> Prof. Samuel Vinicius — iCEV 2026.1

**Fala:**
> "Boa [tarde/noite], professor. Somos a equipe de 4 alunos e vamos apresentar o **Neon Escape**, um jogo de plataforma 2D cyberpunk desenvolvido inteiramente do zero usando Canvas API e Next.js."

---

## SLIDE 2 — O CONCEITO  *(45s)*

> **High Concept**
>
> *"Em um futuro dominado pela IA OMNICORE, você é um rebelde com implantes cibernéticos. Atravesse 3 fases pela megacidade até destruir o núcleo da IA."*
>
> **Inspirações:**
> - Hollow Knight (atmosfera, level design)
> - Celeste (game feel, pulo responsivo)
> - Mega Man X (boss fight, padrões de ataque)
> - Cuphead (hit-stop, drama de impacto)
> - Hotline Miami (estética CRT, ritmo)

**Fala:**
> "O conceito é simples mas ambicioso: criar um jogo cyberpunk com **game feel de qualidade comercial**. Estudamos jogos referência do gênero e aplicamos as mesmas técnicas que eles usam."

---

## SLIDE 3 — ESCOPO DO PROJETO  *(45s)*

> **Números**
>
> | Métrica | Valor |
> |---------|------:|
> | Linhas de código (TypeScript) | ~7.500 |
> | Arquivos `.ts/.tsx` | 22 |
> | Commits no Git | 50+ |
> | Telas distintas | 11 |
> | Fases jogáveis | 3 |
> | Tipos de inimigos | 4 |
> | Mecânicas de gameplay | 15+ |
>
> **Tudo desenvolvido do zero**, sem engines comerciais (Unity, Godot, etc).

**Fala:**
> "Escolhemos o caminho mais difícil: **não usar engine pronta**. Tudo é feito com Canvas 2D nativo, JavaScript/TypeScript, e Web Audio API. Isso nos forçou a entender de verdade como um jogo funciona por dentro."

---

## SLIDE 4 — STACK TECNOLÓGICO  *(30s)*

> **Tecnologias**
>
> - **Engine:** Canvas 2D nativo *(sem bibliotecas de jogo)*
> - **Framework:** Next.js 16 + React 19
> - **Linguagem:** TypeScript 5
> - **Áudio:** Web Audio API *(música 100% sintetizada)*
> - **Estilização:** Tailwind CSS 4
> - **Persistência:** localStorage *(settings, scores, tutorial)*
> - **Distribuição:** Electron + electron-builder
>
> **Render HiDPI** com `devicePixelRatio` para nitidez em Retina/4K.

**Fala:**
> "Stack moderna mas crua. Para áudio, em vez de baixar arquivos `.mp3`, geramos **toda a música em tempo real** com osciladores Web Audio. Cada nota é matemática pura."

---

## SLIDE 5 — DEMO AO VIVO  *(2-3 min — momento mais importante)*

> **Roteiro de demonstração:**
>
> 1. Menu principal *(música calma + ranking de top 5)*
> 2. Tela "Como Jogar" *(4 abas: controles, mecânicas, inimigos, itens)*
> 3. Configurações *(remapeamento de teclas, sliders, toggles)*
> 4. Início da Fase 1 *(só anda e pula — sem arma)*
> 5. Trigger da intro de inimigos *(tela educativa)*
> 6. Trigger da intro de coletáveis
> 7. Final da Fase 1 → tela "Fase Concluída"
> 8. Loading + entrada na Fase 2
> 9. Tela de upgrade da arma *(animação verde de confirmação)*
> 10. Combate na Fase 2 *(damage numbers, hit-flash, crítico)*
> 11. *(Cheat: PageDown para pular pra Fase 3)*
> 12. Escolha de upgrade *(Espingarda vs Tiro Rápido)*
> 13. Boss em lemniscata com tentáculos
> 14. Vitória + ranking final

**Fala:**
> "Vou jogar o início pra vocês verem a progressão. Repare em três coisas: **(1)** quando paro de andar a seta amarela aparece guiando, **(2)** quando vejo um inimigo pela primeira vez aparece um tutorial, **(3)** quando termina a fase, há transição cinematográfica. Tudo polido."
>
> *(Se travar / faltar tempo: usar cheats Insert + PageDown para mostrar fase 3 rapidamente.)*

---

## SLIDE 6 — DIFERENCIAIS TÉCNICOS  *(1.5 min)*

> **Game Feel — o que separa um trabalho acadêmico de um produto**
>
> | Técnica | Inspiração | O que faz |
> |---------|-----------|-----------|
> | **Coyote time** | Celeste | Pulo permitido após sair da plataforma (7 frames) |
> | **Jump buffer** | Hollow Knight | Pulo pré-pressionado funciona |
> | **Variable jump** | Mario Bros | Soltar a tecla cedo encurta o salto |
> | **Hit-stop** | Cuphead | Freeze frames ao matar inimigo (peso) |
> | **Damage numbers** | Risk of Rain 2 | Feedback visual de cada acerto |
> | **Squash & stretch** | Celeste | Sprite distorce no pulo/pouso |
> | **Lemniscata do boss** | Mega Man X | Trajetória ∞ ao invés de stand-and-shoot |
> | **CRT scanlines** | Hotline Miami | Estética retrô-futurista |

**Fala:**
> "Estes detalhes não estão em nenhum tutorial básico de game dev. São técnicas usadas por estúdios profissionais. Implementar tudo isso à mão foi nosso maior aprendizado."

---

## SLIDE 7 — ARQUITETURA  *(1 min)*

> **Game Engine modular** — 14 módulos
>
> ```
> lib/game/
>   engine.ts     ← loop principal + game state
>   player.ts     ← mecânicas do personagem
>   enemies.ts    ← IA dos 4 tipos + boss
>   levels.ts     ← geração das 3 fases independentes
>   renderer.ts   ← render de tudo (HUD, sprites, overlays)
>   particles.ts  ← partículas + damage numbers
>   audio.ts      ← síntese sonora (4 trilhas)
>   tutorial.ts   ← persistência do tutorial
>   highscores.ts ← top 5 com dedup por runId
>   settings.ts   ← config + remapeamento de teclas
>   ...
> ```
>
> Separação clara de responsabilidades — cada módulo testável isoladamente.

**Fala:**
> "Não é uma bagunça num arquivo só. **Cada responsabilidade tem seu lugar.** Isso facilita debug e expansão. O `engine.ts` é o coração — chama os updates de cada subsistema na ordem certa."

---

## SLIDE 8 — DESAFIOS ENFRENTADOS  *(1 min)*

> **3 maiores desafios e como resolvemos**
>
> **1. Boss inalcançável**
> Plataformas estavam **no limite exato** do pulo (120px = altura máxima).
> *Solução:* Análise física, plataformas em escada com 90/165/220px.
>
> **2. Tiros que pareciam perseguir**
> Turret virava-se para o player a cada disparo, **simulando perseguição**.
> *Solução:* Direção fixa no spawn, sem tracking dinâmico.
>
> **3. High Score com duplicatas**
> Cada `gameover` adicionava entrada nova → top 5 enchia rápido com mesma run.
> *Solução:* `runId` único por jogada → `submitScore` substitui em vez de duplicar.

**Fala:**
> "Esses problemas só apareceram em playtest. **Game dev é debugar coisas que parecem certas mas se sentem erradas.**"

---

## SLIDE 9 — POLIMENTOS DE QUALIDADE  *(1 min)*

> **20+ refinamentos pequenos que somam**
>
> ✓ HiDPI rendering (Retina/4K nítido)
> ✓ Pause automático ao perder foco
> ✓ Variação de pitch nos SFX (anti-fadiga)
> ✓ Mouse + teclado em todas as telas
> ✓ Tutorial só na primeira vez (localStorage)
> ✓ Health regen lento (-frustração)
> ✓ Tiro crítico aleatório (dopamina)
> ✓ Inimigos piscam ao tomar dano
> ✓ Score pulsa amarelo ao ganhar pontos
> ✓ Indicador de objetivo se ficar parado
> ✓ Knockback ao receber dano
> ✓ Música muda por fase (4 trilhas)
> ✓ Sequência cinematográfica de morte (1.25s)
> ✓ Cheats de dev para testes

**Fala:**
> "Cada um desses parece pouco, mas é como tempero. Juntos transformam o jogo em algo que **se sente bem de jogar**."

---

## SLIDE 10 — RANKING & ACESSIBILIDADE  *(45s)*

> **Replay value**
> - Top 5 high scores persistente em `localStorage`
> - Ranking exibido no menu, vitória e game over
> - "NOVO RECORDE!" piscando se entrou no top 1
>
> **Acessibilidade**
> - Toggle Camera Shake *(motion sickness)*
> - Toggle CRT Effect *(fadiga visual)*
> - Slider de velocidade do personagem (50-200%)
> - Remapeamento completo de teclas
> - Suporte a mouse em todas as telas
> - Indicador "MUNICAO BAIXA" piscante
> - Tutorial pode ser resetado para revisão

**Fala:**
> "Pensamos em **diferentes perfis de jogador**. Quem tem motion sickness desliga shake. Quem é iniciante usa velocidade reduzida. Quem prefere mouse, joga com mouse."

---

## SLIDE 11 — PROCESSO DE DESENVOLVIMENTO  *(1 min)*

> **Histórico**
>
> | Fase | Período | Resultado |
> |------|---------|-----------|
> | Concepção & GDD | Mar/2026 | High concept, mecânicas, telas planejadas |
> | MVP playável | Mar/2026 | 1 fase, boss, telas básicas |
> | Polish & game feel | Abr-Mai/2026 | Coyote time, juice, damage numbers |
> | Refatoração 3 fases | Mai/2026 | Fases independentes com transições |
> | Empacotamento | Mai/2026 | Build Electron .exe / .AppImage |
>
> **Versionamento Git** com 50+ commits temáticos.
> **Trabalho assistido por IA** (Claude) para automatizar tarefas e revisar código.

**Fala:**
> "Trabalhamos em ciclos curtos. **MVP primeiro, polish depois.** Cada commit é uma feature isolada — facilita reversão se algo quebra."

---

## SLIDE 12 — ENTREGÁVEIS  *(45s)*

> **O que vamos entregar**
>
> 1. **Código-fonte** completo no GitHub *(repositório público)*
> 2. **Build executável** standalone:
>    - `Neon Escape Setup 1.0.0.exe` *(Windows, instalador)*
>    - `Neon Escape 1.0.0.AppImage` *(Linux, portátil)*
>    - `Neon Escape-1.0.0.dmg` *(macOS, opcional)*
> 3. **README.md** com instruções de build e estrutura
> 4. **GDD atualizado** *(página `/gdd` na aplicação)*
> 5. **Este documento de apresentação** + **Relatório técnico**
>
> **Joga sem internet, sem instalação de Node.js. Clica e roda.**

**Fala:**
> "Vocês não precisam abrir terminal para rodar. **É um executável**, igual qualquer jogo de Steam ou itch.io."

---

## SLIDE 13 — CONCLUSÃO  *(30s)*

> **O que aprendemos**
>
> - **Game Loop** e arquitetura de jogos por dentro
> - **Game Feel** vai além de "funcionar" — é *sentir bem*
> - **Trabalho em equipe** com Git, code review e divisão clara
> - **Decisões de design** — por que cada feature existe
> - **Iteração baseada em playtest** — código está certo, mas o jogo se sente errado?
>
> **Obrigado!**
>
> *Aceitamos perguntas e críticas técnicas.*

**Fala:**
> "Mais que entregar um jogo, queríamos **entender por dentro**. Hoje conseguimos olhar pra qualquer jogo 2D e adivinhar como ele foi feito. Esse é o maior ganho. Obrigado!"

---

## ANEXO — RESPOSTAS PRONTAS PARA PERGUNTAS PROVÁVEIS

### "Por que não usaram Unity / Godot?"
> Decisão consciente: o objetivo era **aprender fundamentos**. Engine pronta esconde colision, render loop, input. Fazendo do zero entendemos o que cada framework faz por trás.

### "Quanto tempo levaram?"
> ~3 meses de Mar a Mai/2026, em sprints semanais. O MVP ficou pronto em 4 semanas; o resto foi polish.

### "Qual foi o trabalho mais difícil?"
> O **boss em lemniscata**: a primeira versão movia em senoide simples, ficava previsível demais. Tivemos que estudar a equação da lemniscata de Bernoulli e parametrizar pelo tempo, mantendo continuidade entre as 3 sub-fases.

### "Funciona offline?"
> Sim, 100%. Nem o áudio precisa de download — toda música é gerada por matemática pura na hora.

### "Tem multiplayer?"
> Não. Era escopo single-player desde o GDD. Multiplayer mudaria a arquitetura completamente.

### "Vocês fizeram tudo manualmente ou usaram IA?"
> Usamos Claude (Anthropic) como ferramenta de produtividade — para gerar boilerplate, revisar código, sugerir refatorações, e padronizar commits. **Decisões de design, mecânicas, level design e tom do jogo** foram tomadas pela equipe. A IA é uma ferramenta, não substitui criatividade.

### "Por que TypeScript?"
> Tipagem estática evita uma classe inteira de bugs em runtime. Em projeto de 7500 linhas com 22 arquivos interagindo, refatorar sem tipos é receita pra desastre.

### "Como o jogo seria expandido?"
> 3 caminhos óbvios: (1) mais fases com novos inimigos, (2) sistema de progressão entre runs (roguelite), (3) modo speedrun com leaderboard online. A arquitetura suporta tudo isso.

---

## CHECKLIST PRÉ-APRESENTAÇÃO

Antes de subir no palco:

- [ ] Build executável testado em Windows
- [ ] Build executável testado em Linux (se possível)
- [ ] Cabos: HDMI/USB-C para o projetor
- [ ] Backup: jogo rodando localmente em `npm run dev` como fallback
- [ ] Audio: garantir que som está ligado (música muda por fase)
- [ ] Tela: zoom do navegador em 100% (HiDPI funciona melhor)
- [ ] **High score limpo** antes de demo (ir em Configurações → Limpar Recordes)
- [ ] **Tutorial resetado** antes de demo (Configurações → Resetar Tutorial)
- [ ] Cheats memorizados: Insert (god) / PageDown (skip) / Home (ammo)
- [ ] Cronômetro: testar tempo total das falas + demo
- [ ] Quem fala o quê: dividir slides entre os 4 integrantes

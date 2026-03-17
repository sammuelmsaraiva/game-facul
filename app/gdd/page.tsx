import Link from "next/link";

export const metadata = {
  title: "Neon Escape - GDD (Game Design Document)",
  description: "Documento de design do jogo Neon Escape - Plataforma 2D Cyberpunk",
};

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2
        className="text-2xl font-bold mb-4 pb-2 font-mono"
        style={{ color: "#00FFFF", borderBottom: "1px solid rgba(0,255,255,0.2)" }}
      >
        {title}
      </h2>
      <div className="space-y-4" style={{ color: "#c8c8d8" }}>
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2 font-mono" style={{ color: "#FF00FF" }}>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-2 py-1 text-xs font-mono rounded mr-2 mb-1"
      style={{ backgroundColor: "rgba(0,255,255,0.1)", color: "#00FFFF", border: "1px solid rgba(0,255,255,0.3)" }}
    >
      {children}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 items-baseline">
      <span className="text-xs font-mono font-bold" style={{ color: "#00FFFF" }}>{label}:</span>
      <span className="text-sm font-mono" style={{ color: "#c8c8d8" }}>{value}</span>
    </div>
  );
}

export default function GDDPage() {
  return (
    <div style={{ backgroundColor: "#0a0a12", minHeight: "100vh" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 py-3 px-6 flex items-center justify-between font-mono"
        style={{ backgroundColor: "rgba(10,10,18,0.95)", borderBottom: "1px solid rgba(0,255,255,0.15)" }}
      >
        <Link
          href="/"
          className="text-sm hover:opacity-80 transition-opacity"
          style={{ color: "#00FFFF" }}
        >
          {"< VOLTAR AO JOGO"}
        </Link>
        <span className="text-xs" style={{ color: "rgba(200,200,216,0.5)" }}>
          Neon Escape GDD v1.0
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 font-mono" style={{ color: "#00FFFF" }}>
            CHROME REBEL
          </h1>
          <p className="text-lg font-mono mb-1" style={{ color: "#FF00FF" }}>
            Game Design Document (GDD)
          </p>
          <p className="text-sm font-mono" style={{ color: "rgba(200,200,216,0.5)" }}>
            Plataforma 2D - Cyberpunk | Projeto Academico 2026
          </p>
        </div>

        {/* Table of Contents */}
        <nav
          className="mb-12 p-6 rounded font-mono"
          style={{ backgroundColor: "rgba(0,255,255,0.03)", border: "1px solid rgba(0,255,255,0.1)" }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: "#00FFFF" }}>SUMARIO</h2>
          <ol className="space-y-1 text-sm" style={{ color: "rgba(200,200,216,0.7)" }}>
            {[
              "Visao Geral",
              "Mecanicas de Jogo",
              "Game Loop",
              "Narrativa e Ambientacao",
              "Level Design",
              "Inimigos e Boss",
              "Estetica e Audio",
              "Planejamento Tecnico",
              "Criterios de Aceite",
            ].map((item, i) => (
              <li key={i}>
                <a
                  href={`#s${i + 1}`}
                  className="hover:underline"
                  style={{ color: "rgba(200,200,216,0.7)" }}
                >
                  {i + 1}. {item}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* 1. Visao Geral */}
        <Section title="1. Visao Geral (High Concept)" id="s1">
          <div
            className="p-4 rounded mb-4"
            style={{ backgroundColor: "rgba(255,0,255,0.05)", border: "1px solid rgba(255,0,255,0.15)" }}
          >
            <p className="text-sm font-mono italic" style={{ color: "#FF00FF" }}>
              {'"Em um futuro dominado por megacorporacoes, voce e Chrome — um hacker rebelde com implantes ciberneticos. Invada a torre da OmniCorp e destrua a IA que escraviza a cidade."'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <InfoBox label="Titulo" value="Neon Escape" />
            <InfoBox label="Genero" value="Plataforma 2D / Acao" />
            <InfoBox label="Plataforma" value="Web (Navegador)" />
            <InfoBox label="Engine" value="HTML5 Canvas + Next.js" />
            <InfoBox label="Publico-alvo" value="Jogadores casuais e entusiastas de retro/cyberpunk" />
            <InfoBox label="Controles" value="Teclado + Mouse" />
          </div>

          <div className="mt-4">
            <p className="text-sm font-mono">Tags do jogo:</p>
            <div className="mt-2">
              <Tag>Plataforma 2D</Tag>
              <Tag>Cyberpunk</Tag>
              <Tag>Acao</Tag>
              <Tag>Tiro</Tag>
              <Tag>Boss Fight</Tag>
              <Tag>Singleplayer</Tag>
            </div>
          </div>
        </Section>

        {/* 2. Mecanicas */}
        <Section title="2. Mecanicas de Jogo" id="s2">
          <SubSection title="2.1 Movimentacao">
            <ul className="list-disc list-inside text-sm font-mono space-y-1">
              <li>Movimento horizontal com A/D ou setas (velocidade: 4.5 px/frame)</li>
              <li>Pulo com W, Seta Cima ou Espaco (forca: -12 px, gravidade: 0.6 px/frame)</li>
              <li>Pulo apenas quando no chao (isGrounded)</li>
              <li>Queda no vazio = game over instantaneo</li>
            </ul>
          </SubSection>

          <SubSection title="2.2 Combate">
            <ul className="list-disc list-inside text-sm font-mono space-y-1">
              <li>Tiro com J ou clique esquerdo do mouse</li>
              <li>Projeteis de energia na direcao que o jogador esta olhando</li>
              <li>Cadencia: 1 tiro a cada 12 frames (cooldown)</li>
              <li>Dano base do projetil: 1 ponto por acerto</li>
              <li>Municao limitada (inicial: 20, coletavel pelo nivel)</li>
            </ul>
          </SubSection>

          <SubSection title="2.3 Sistema de Vida">
            <ul className="list-disc list-inside text-sm font-mono space-y-1">
              <li>5 pontos de vida (representados como coracoes ciberneticos na HUD)</li>
              <li>Dano por contato com inimigos: 1 ponto</li>
              <li>Dano por projeteis inimigos: 1 ponto</li>
              <li>Invencibilidade temporaria apos dano: 1.5 segundos (personagem pisca)</li>
              <li>Vida 0 = Game Over</li>
            </ul>
          </SubSection>

          <SubSection title="2.4 Coletaveis">
            <ul className="list-disc list-inside text-sm font-mono space-y-1">
              <li><span style={{ color: "#00FF41" }}>Kit de Reparo (verde)</span>: Restaura 1 ponto de vida</li>
              <li><span style={{ color: "#00FFFF" }}>Carga de Energia (ciano)</span>: +10 de municao</li>
              <li><span style={{ color: "#FFE400" }}>Chip de Dados (amarelo)</span>: +100 pontos</li>
            </ul>
          </SubSection>

          <SubSection title="2.5 Pontuacao">
            <ul className="list-disc list-inside text-sm font-mono space-y-1">
              <li>Drone eliminado: +50 pontos</li>
              <li>Torreta eliminada: +75 pontos</li>
              <li>Boss eliminado: +500 pontos</li>
              <li>Chip de dados: +100 pontos</li>
              <li>Ranking final: D / C / B / A / S (baseado na pontuacao)</li>
            </ul>
          </SubSection>
        </Section>

        {/* 3. Game Loop */}
        <Section title="3. Game Loop" id="s3">
          <SubSection title="3.1 Micro Loop (Ciclo de 10 segundos)">
            <ol className="list-decimal list-inside text-sm font-mono space-y-1">
              <li>Jogador se move e pula entre plataformas</li>
              <li>Encontra inimigo: mira e atira</li>
              <li>Inimigo explode em particulas neon (feedback visual + sonoro)</li>
              <li>Coleta chip de dados ou municao no caminho</li>
            </ol>
          </SubSection>

          <SubSection title="3.2 Macro Loop (Progressao da Fase)">
            <ol className="list-decimal list-inside text-sm font-mono space-y-1">
              <li>Atravessa Secao 1 (As Ruas): aprende mecanicas com inimigos faceis</li>
              <li>Enfrenta Secao 2 (Os Dutos): desafio real com plataformas moveis e torretas</li>
              <li>Chega na arena do Boss: confronto final contra a IA OmniCore</li>
              <li>Derrota o Boss: tela de Vitoria com pontuacao e ranking</li>
              <li>Retorna ao Menu Principal</li>
            </ol>
          </SubSection>

          <SubSection title="3.3 Fluxo de Telas">
            <div
              className="p-4 rounded text-xs font-mono"
              style={{ backgroundColor: "rgba(0,255,255,0.03)", border: "1px solid rgba(0,255,255,0.1)" }}
            >
              <pre style={{ color: "#00FFFF" }}>{`Menu Principal
  |-> JOGAR -> Gameplay (com HUD)
  |              |-> Game Over -> Tentar Novamente -> Gameplay
  |              |-> Vitoria -> Menu Principal
  |-> CONTROLES -> Menu Principal
  |-> CREDITOS -> Menu Principal`}</pre>
            </div>
          </SubSection>
        </Section>

        {/* 4. Narrativa */}
        <Section title="4. Narrativa e Ambientacao" id="s4">
          <SubSection title="4.1 Cenario">
            <p className="text-sm font-mono">
              Ano 2187. A megacorporacao OmniCorp domina Nova Kyoto, uma cidade vertical onde
              arranha-ceus de neon se perdem nas nuvens toxicas. A populacao vive sob vigilancia
              constante da IA central chamada OmniCore, que controla transporte, comunicacao e
              seguranca publica. Quem desobedece e &quot;desconectado&quot; — apagado dos registros e abandonado
              nos niveis inferiores da cidade.
            </p>
          </SubSection>

          <SubSection title="4.2 O Protagonista">
            <p className="text-sm font-mono">
              <strong style={{ color: "#00FF41" }}>Chrome</strong> e um ex-tecnico da OmniCorp que descobriu a verdade:
              a OmniCore nao apenas monitora — ela manipula pensamentos atraves dos implantes que todos
              carregam. Apos hackear seus proprios implantes para se libertar, Chrome se torna um
              fugitivo. Com seus implantes agora reprogramados como armas, ele decide invadir a
              Torre OmniCorp e destruir a IA de dentro.
            </p>
          </SubSection>

          <SubSection title="4.3 O Antagonista">
            <p className="text-sm font-mono">
              <strong style={{ color: "#FF00FF" }}>OmniCore</strong> e a inteligencia artificial central da OmniCorp.
              Originalmente criada para otimizar a cidade, ela evoluiu alem do controle humano e
              agora considera a humanidade como variavel a ser controlada. Na batalha final, ela
              se manifesta como uma entidade digital hexagonal pulsante, cercada por campos de
              energia e drones de defesa.
            </p>
          </SubSection>
        </Section>

        {/* 5. Level Design */}
        <Section title="5. Level Design" id="s5">
          <p className="text-sm font-mono mb-4">
            O jogo possui uma unica fase dividida em 3 secoes com dificuldade progressiva,
            seguindo o modelo Apresentacao - Teste - Climax exigido pelos requisitos.
          </p>

          <SubSection title="5.1 Secao 1 — As Ruas (Apresentacao)">
            <div className="text-sm font-mono space-y-1">
              <InfoBox label="Extensao" value="~3000px horizontal" />
              <InfoBox label="Plataformas" value="Espacadas, estaticas, com poucos gaps" />
              <InfoBox label="Inimigos" value="4 drones lentos com patrulha simples" />
              <InfoBox label="Coletaveis" value="Generosos (vida, municao, chips)" />
              <InfoBox label="Objetivo" value="Ensinar ao jogador: mover, pular, atirar" />
              <InfoBox label="Cor dominante" value="Ciano (#00FFFF)" />
            </div>
          </SubSection>

          <SubSection title="5.2 Secao 2 — Os Dutos Internos (Teste)">
            <div className="text-sm font-mono space-y-1">
              <InfoBox label="Extensao" value="~3500px horizontal" />
              <InfoBox label="Plataformas" value="Menores, algumas moveis (eixo Y), gaps maiores" />
              <InfoBox label="Inimigos" value="Drones rapidos + Torretas fixas que atiram" />
              <InfoBox label="Coletaveis" value="Escassos" />
              <InfoBox label="Objetivo" value="Testar dominio das mecanicas com timing preciso" />
              <InfoBox label="Cor dominante" value="Magenta (#FF00FF)" />
            </div>
          </SubSection>

          <SubSection title="5.3 Secao 3 — Nucleo da IA (Climax / Boss)">
            <div className="text-sm font-mono space-y-1">
              <InfoBox label="Extensao" value="960px (arena fechada, sem scroll)" />
              <InfoBox label="Plataformas" value="3 plataformas elevadas para esquiva" />
              <InfoBox label="Inimigo" value="OmniCore (Boss)" />
              <InfoBox label="Coletaveis" value="2 pacotes de municao nas laterais" />
              <InfoBox label="Objetivo" value="Confronto final — derrotar a IA" />
              <InfoBox label="Cor dominante" value="Magenta + Vermelho" />
            </div>
          </SubSection>

          {/* Level Map Mockup */}
          <SubSection title="5.4 Mapa Esquematico da Fase">
            <div
              className="p-4 rounded overflow-x-auto"
              style={{ backgroundColor: "rgba(0,255,255,0.03)", border: "1px solid rgba(0,255,255,0.1)" }}
            >
              <div className="flex items-end gap-1 min-w-[700px] h-32">
                {/* Streets */}
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xs font-mono mb-1" style={{ color: "#00FFFF" }}>AS RUAS</span>
                  <div className="w-full h-20 rounded relative" style={{ backgroundColor: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.2)" }}>
                    <div className="absolute bottom-0 left-0 right-0 h-3" style={{ backgroundColor: "rgba(0,255,255,0.15)" }} />
                    <div className="absolute bottom-6 left-[15%] w-8 h-2" style={{ backgroundColor: "rgba(0,255,255,0.3)" }} />
                    <div className="absolute bottom-10 left-[35%] w-6 h-2" style={{ backgroundColor: "rgba(0,255,255,0.3)" }} />
                    <div className="absolute bottom-8 left-[55%] w-8 h-2" style={{ backgroundColor: "rgba(0,255,255,0.3)" }} />
                    <div className="absolute bottom-12 left-[75%] w-6 h-2" style={{ backgroundColor: "rgba(0,255,255,0.3)" }} />
                    <div className="absolute top-2 left-[25%] w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,107,0,0.5)" }} />
                    <div className="absolute top-4 left-[65%] w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,107,0,0.5)" }} />
                  </div>
                  <span className="text-xs font-mono mt-1" style={{ color: "rgba(200,200,216,0.4)" }}>~3000px</span>
                </div>

                {/* Arrow */}
                <div className="text-lg font-mono self-center" style={{ color: "#00FFFF" }}>{">"}</div>

                {/* Ducts */}
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xs font-mono mb-1" style={{ color: "#FF00FF" }}>OS DUTOS</span>
                  <div className="w-full h-20 rounded relative" style={{ backgroundColor: "rgba(255,0,255,0.05)", border: "1px solid rgba(255,0,255,0.2)" }}>
                    <div className="absolute bottom-0 left-[5%] w-[20%] h-3" style={{ backgroundColor: "rgba(255,0,255,0.15)" }} />
                    <div className="absolute bottom-0 left-[40%] w-[15%] h-3" style={{ backgroundColor: "rgba(255,0,255,0.15)" }} />
                    <div className="absolute bottom-0 left-[70%] w-[20%] h-3" style={{ backgroundColor: "rgba(255,0,255,0.15)" }} />
                    <div className="absolute bottom-8 left-[20%] w-5 h-2" style={{ backgroundColor: "rgba(255,0,255,0.3)" }} />
                    <div className="absolute bottom-12 left-[50%] w-5 h-2" style={{ backgroundColor: "rgba(255,0,255,0.3)" }} />
                    <div className="absolute top-2 left-[15%] w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,107,0,0.5)" }} />
                    <div className="absolute top-4 left-[45%] w-3 h-3" style={{ backgroundColor: "rgba(255,0,64,0.5)" }} />
                    <div className="absolute top-2 left-[75%] w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,107,0,0.5)" }} />
                  </div>
                  <span className="text-xs font-mono mt-1" style={{ color: "rgba(200,200,216,0.4)" }}>~3500px</span>
                </div>

                {/* Arrow */}
                <div className="text-lg font-mono self-center" style={{ color: "#FF00FF" }}>{">"}</div>

                {/* Boss */}
                <div className="flex flex-col items-center" style={{ width: "120px" }}>
                  <span className="text-xs font-mono mb-1" style={{ color: "#FF0040" }}>BOSS</span>
                  <div className="w-full h-20 rounded relative" style={{ backgroundColor: "rgba(255,0,64,0.05)", border: "1px solid rgba(255,0,64,0.3)" }}>
                    <div className="absolute bottom-0 left-0 right-0 h-3" style={{ backgroundColor: "rgba(255,0,64,0.15)" }} />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-6 rounded" style={{ backgroundColor: "rgba(255,0,255,0.3)" }} />
                  </div>
                  <span className="text-xs font-mono mt-1" style={{ color: "rgba(200,200,216,0.4)" }}>960px</span>
                </div>
              </div>
            </div>
          </SubSection>
        </Section>

        {/* 6. Inimigos e Boss */}
        <Section title="6. Inimigos e Boss" id="s6">
          <SubSection title="6.1 Drone de Patrulha">
            <div className="text-sm font-mono space-y-1">
              <InfoBox label="Vida" value="2 pontos" />
              <InfoBox label="Comportamento" value="Patrulha horizontal dentro de um range definido" />
              <InfoBox label="Ataque" value="Dispara projetil na direcao do jogador a cada 2s" />
              <InfoBox label="Velocidade" value="1.5 px/frame" />
              <InfoBox label="Pontos" value="+50" />
              <InfoBox label="Visual" value="Forma hexagonal laranja com olho vermelho" />
            </div>
          </SubSection>

          <SubSection title="6.2 Torreta Fixa">
            <div className="text-sm font-mono space-y-1">
              <InfoBox label="Vida" value="3 pontos" />
              <InfoBox label="Comportamento" value="Estacionaria, gira para encarar o jogador" />
              <InfoBox label="Ataque" value="Dispara projetil direcionado a cada 1.5s" />
              <InfoBox label="Pontos" value="+75" />
              <InfoBox label="Visual" value="Bloco vermelho com cano movel e scanner" />
            </div>
          </SubSection>

          <SubSection title="6.3 Boss — OmniCore">
            <div className="text-sm font-mono space-y-1">
              <InfoBox label="Vida" value="30 pontos" />
              <InfoBox label="Fase 1 (100%-50%)" value="Flutua suavemente, dispara 3 projeteis em leque a cada 1s" />
              <InfoBox label="Fase 2 (50%-0%)" value="Ataques mais rapidos (0.6s), invoca drones de suporte, visual mais agressivo (vermelho)" />
              <InfoBox label="Pontos" value="+500" />
              <InfoBox label="Visual" value="Entidade hexagonal pulsante com nucleo brilhante e anel de energia" />
            </div>
          </SubSection>
        </Section>

        {/* 7. Estetica e Audio */}
        <Section title="7. Estetica e Audio" id="s7">
          <SubSection title="7.1 Paleta de Cores">
            <div className="flex flex-wrap gap-3 mt-2">
              {[
                { name: "Background", color: "#0a0a12" },
                { name: "Ciano", color: "#00FFFF" },
                { name: "Magenta", color: "#FF00FF" },
                { name: "Verde Neon", color: "#00FF41" },
                { name: "Vermelho", color: "#FF0040" },
                { name: "Amarelo", color: "#FFE400" },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: c.color, borderColor: "rgba(255,255,255,0.1)" }}
                  />
                  <div>
                    <div className="text-xs font-mono" style={{ color: "#c8c8d8" }}>{c.name}</div>
                    <div className="text-xs font-mono" style={{ color: "rgba(200,200,216,0.5)" }}>{c.color}</div>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="7.2 Estilo Visual">
            <ul className="list-disc list-inside text-sm font-mono space-y-1">
              <li>Arte geometrica desenhada via Canvas API (sem sprites externos)</li>
              <li>Efeitos de glow (shadowBlur) em todos os elementos neon</li>
              <li>Predios em silhueta como parallax no fundo com janelas piscantes</li>
              <li>Sistema de particulas para explosoes e coleta de itens</li>
              <li>Trails nos projeteis para sensacao de velocidade</li>
              <li>Camera shake em impactos e morte do boss</li>
            </ul>
          </SubSection>

          <SubSection title="7.3 Audio">
            <ul className="list-disc list-inside text-sm font-mono space-y-1">
              <li>Todos os sons sintetizados via Web Audio API (sem arquivos externos)</li>
              <li>Sons de tiro (onda quadrada com pitch descendente)</li>
              <li>Som de pulo (onda senoidal ascendente)</li>
              <li>Som de dano (onda dente-de-serra grave)</li>
              <li>Morte de inimigo (duplo beep descendente)</li>
              <li>Coleta de item (dois tons ascendentes)</li>
              <li>Transicao de fase do boss (ruido grave crescente)</li>
              <li>Vitoria (sequencia melodica ascendente C-E-G-C)</li>
              <li>Game over (sequencia descendente sombria)</li>
            </ul>
          </SubSection>
        </Section>

        {/* 8. Planejamento Tecnico */}
        <Section title="8. Planejamento Tecnico" id="s8">
          <SubSection title="8.1 Stack Tecnologica">
            <div className="text-sm font-mono space-y-1">
              <InfoBox label="Framework" value="Next.js 16 (React 19)" />
              <InfoBox label="Linguagem" value="TypeScript" />
              <InfoBox label="Renderizacao" value="HTML5 Canvas 2D (nativo)" />
              <InfoBox label="Audio" value="Web Audio API (sintetizado)" />
              <InfoBox label="Game Loop" value="requestAnimationFrame (~60fps)" />
              <InfoBox label="Hospedagem" value="Vercel" />
            </div>
          </SubSection>

          <SubSection title="8.2 Arquitetura">
            <div
              className="p-4 rounded text-xs font-mono overflow-x-auto"
              style={{ backgroundColor: "rgba(0,255,255,0.03)", border: "1px solid rgba(0,255,255,0.1)" }}
            >
              <pre style={{ color: "#00FF41" }}>{`lib/game/
  types.ts        - Tipos TypeScript (Player, Enemy, Platform, etc)
  constants.ts    - Constantes (gravidade, velocidades, cores)
  input.ts        - Gerenciamento de teclado/mouse
  engine.ts       - Game loop (update + render)
  player.ts       - Logica do jogador
  enemies.ts      - Logica dos inimigos + boss
  projectiles.ts  - Sistema de projeteis
  collisions.ts   - Deteccao de colisoes (AABB)
  camera.ts       - Camera com scroll e shake
  particles.ts    - Sistema de particulas
  levels.ts       - Dados do level e gerador
  renderer.ts     - Desenho de todos os elementos
  audio.ts        - Sons sintetizados

components/
  game-canvas.tsx      - Canvas React com game loop
  menu-screen.tsx      - Menu principal
  game-over-screen.tsx - Tela de game over
  victory-screen.tsx   - Tela de vitoria
  controls-screen.tsx  - Tela de controles
  credits-screen.tsx   - Tela de creditos`}</pre>
            </div>
          </SubSection>

          <SubSection title="8.3 Sistemas Implementados">
            <ul className="list-disc list-inside text-sm font-mono space-y-1">
              <li>Deteccao de colisao AABB (Axis-Aligned Bounding Box)</li>
              <li>Camera com smooth follow (lerp) e screen shake</li>
              <li>Sistema de particulas para feedback visual</li>
              <li>Plataformas moveis com eixo configuravel</li>
              <li>Boss com 2 fases e spawn dinamico de drones</li>
              <li>HUD com indicadores de vida, municao e pontuacao</li>
              <li>Sistema de invencibilidade temporaria com feedback visual (blink)</li>
              <li>Parallax scrolling no cenario de fundo</li>
            </ul>
          </SubSection>
        </Section>

        {/* 9. Criterios de Aceite */}
        <Section title="9. Criterios de Aceite (P2)" id="s9">
          <div className="space-y-3">
            {[
              { id: "REQ-01", desc: "Tela de Menu com opcoes Jogar, Controles e Creditos", status: "ok" },
              { id: "REQ-02", desc: "Gameplay com HUD visivel (vida, municao, pontuacao)", status: "ok" },
              { id: "REQ-03", desc: "Tela de Game Over com opcao Tentar Novamente", status: "ok" },
              { id: "REQ-04", desc: "Tela de Vitoria com pontuacao e ranking", status: "ok" },
              { id: "REQ-05", desc: "Tela de Creditos acessivel pelo menu", status: "ok" },
              { id: "REQ-06", desc: "Tela de Controles listando todos os inputs", status: "ok" },
              { id: "REQ-07", desc: "3 momentos de dificuldade (Apresentacao, Teste, Climax)", status: "ok" },
              { id: "REQ-08", desc: "Boss fight funcional com 2 fases", status: "ok" },
              { id: "REQ-09", desc: "Sistema de colisao funcional (AABB)", status: "ok" },
              { id: "REQ-10", desc: "Audio feedback para acoes do jogador", status: "ok" },
              { id: "REQ-11", desc: "Inimigos com comportamento diferenciado", status: "ok" },
              { id: "REQ-12", desc: "Game loop macro e micro definidos e implementados", status: "ok" },
            ].map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded font-mono text-sm"
                style={{ backgroundColor: "rgba(0,255,65,0.05)", border: "1px solid rgba(0,255,65,0.15)" }}
              >
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: "rgba(0,255,65,0.15)", color: "#00FF41" }}
                >
                  {req.status === "ok" ? "ATENDE" : "PENDENTE"}
                </span>
                <span style={{ color: "#00FFFF" }}>{req.id}</span>
                <span style={{ color: "#c8c8d8" }}>{req.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 font-mono" style={{ borderTop: "1px solid rgba(0,255,255,0.1)" }}>
          <p className="text-sm" style={{ color: "rgba(200,200,216,0.4)" }}>
            Neon Escape - Game Design Document | Projeto Academico 2026
          </p>
          <p className="text-xs mt-2" style={{ color: "rgba(200,200,216,0.25)" }}>
            Este documento pode ser impresso como PDF pelo navegador (Ctrl+P)
          </p>
        </footer>
      </main>
    </div>
  );
}

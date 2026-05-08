# Neon Escape — Pacote de Entrega

**Equipe:** Sammuel Saraiva · João Vinicius P. C. B. Carvalho · Lucas Benevinuto Pereira · Vinicius Andrade
**Disciplina:** Introdução ao Desenvolvimento de Jogos — iCEV 2026.1
**Professor:** Samuel Vinicius Pereira de Oliveira

---

## 📦 Conteúdo do Pacote

| Arquivo | Tamanho | Descrição |
|---------|--------:|-----------|
| `Neon-Escape-1.0.0-Windows.zip` | **246 MB** | **Versão portátil** para Windows — extrai e roda |
| `RELATORIO.md` | — | Relatório técnico completo (atualização do GDD) |
| `APRESENTACAO.md` | — | Roteiro de apresentação ao vivo |
| `README.md` | — | Documentação geral do projeto |
| `BUILD.md` | — | Instruções para regenerar a build |

---

## 🎮 Como Jogar (Avaliador)

### Passos
1. **Extraia** o arquivo `Neon-Escape-1.0.0-Windows.zip` (qualquer descompactador serve — clique direito → "Extrair tudo")
2. Entre na pasta extraída `Neon-Escape-1.0.0-Win-x64/`
3. Dê duplo-clique em **`Neon Escape.exe`**
4. Pode aparecer aviso do Windows Defender:
   *"O Windows protegeu o seu PC"* — clique em **"Mais informações"** → **"Executar mesmo assim"**
   *(O aviso aparece porque o executável não é assinado digitalmente. É seguro — código-fonte aberto no GitHub.)*
5. O jogo abre direto, sem instalar nada no sistema

### Para apagar
- Apenas delete a pasta `Neon-Escape-1.0.0-Win-x64/` — o jogo não cria entradas no Registro nem em outras pastas do sistema

---

## ⌨️ Controles

| Tecla | Ação |
|-------|------|
| **W A S D** ou **Setas** | Mover / Pular / Descer |
| **Espaço** | Pular |
| **J** ou **Clique esquerdo** | Atirar |
| **ESC** | Pausar |
| **P** | Continuar (quando pausado) |
| **Enter** ou **Clique** | Confirmar telas |

> Todos os controles podem ser remapeados em **Configurações** → seção Controles.

---

## 🎯 Cheats de Desenvolvedor

Para o avaliador testar fases específicas sem precisar jogar tudo:

| Tecla | Efeito |
|-------|--------|
| **Insert** | Liga/desliga **GOD MODE** (invencibilidade) |
| **PageDown** | Pula para o final da fase atual |
| **PageUp** | Vida cheia |
| **Home** | +50 munição (e desbloqueia a arma) |

---

## 🎪 Fluxo Recomendado para Apresentação

1. **Menu Principal** — observe o ranking de top 5 e a música ambiente calma
2. **"Como Jogar"** — explore as 4 abas (Controles, Mecânicas, Inimigos, Coletáveis)
3. **Configurações** — veja remapeamento + sliders + toggles
4. **JOGAR** → Início da Fase 1 (sem arma, só anda e pula)
5. Após ~1500px, aparece a tela de **intro de inimigos** (drone)
6. Após ~3000px, aparece a tela de **intro de coletáveis**
7. Final da Fase 1 → tela "FASE 1 CONCLUIDA"
8. Confirme → loading → **Fase 2** → tela de **upgrade da arma**
9. Combate da Fase 2 — note os damage numbers e o tiro crítico amarelo
10. *(Atalho: PageDown para pular pra Fase 3)*
11. **Fase 3** → tela de **escolha de upgrade** (Espingarda vs Tiro Rápido)
12. **Boss** em movimento de lemniscata com tentáculos
13. **Vitória** → ranking final + "NOVO RECORDE!" se aplicável

---

## 📚 Fontes para Estudo Profundo

Se quiser entender o código:

- **`README.md`** — sumário e instruções de build
- **`RELATORIO.md`** — relatório técnico/GDD atualizado (este pacote)
- **GDD interativo no jogo** — clique em "[ VER DOCUMENTO GDD ]" no rodapé do menu
- **Repositório GitHub** — https://github.com/sammuelmsaraiva/game-facul

---

## 🛠 Stack Técnico

- **Engine:** Canvas 2D nativo *(sem Unity, Godot, etc)*
- **Framework:** Next.js 16 + React 19
- **Linguagem:** TypeScript 5
- **Áudio:** Web Audio API (música 100% sintetizada — sem arquivos `.mp3`)
- **Empacotamento:** Electron 33 + electron-builder 25

---

## ❓ Problemas?

| Problema | Solução |
|----------|---------|
| **Windows Defender bloqueia** | Clique em "Mais informações" → "Executar mesmo assim" |
| **Tela em branco** | Atualizar drivers de vídeo. O jogo usa Canvas 2D acelerado |
| **Sem som** | Verificar volume do sistema + slider in-game (Configurações → Volume) |
| **Música não toca no menu** | Mover o mouse ou apertar qualquer tecla (política de autoplay do Chromium) |
| **High score com entradas estranhas** | Configurações → "Limpar Quadro de Recordes" |
| **Tela de intro reaparece** | Configurações → "Resetar Introduções" liga de novo |

---

## 🏆 Critérios de Avaliação Atendidos

✅ REQ-01 a REQ-12 (todos os 12 requisitos do GDD original)
✅ EXT-01 a EXT-15 (15 features além do escopo original)

Ver detalhes em `RELATORIO.md` seção 11.

---

**Boa sorte na avaliação!**
*Estamos disponíveis para perguntas técnicas durante a apresentação.*

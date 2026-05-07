# Build & Empacotamento — Neon Escape

## Pré-requisitos
- Node.js 18+
- npm ou pnpm

## Desenvolvimento (web)
```bash
npm install
npm run dev
# abre em http://localhost:3099
```

## Empacotamento como executável desktop (Electron)

### 1. Instalar dependências (primeira vez)
```bash
npm install
```
Isso vai instalar `electron` e `electron-builder` declarados em `devDependencies`.

### 2. Gerar build estático + instalador
Para a plataforma atual:
```bash
npm run package
```

Para plataforma específica:
```bash
npm run package:win     # Windows (.exe instalador + portable)
npm run package:linux   # Linux (.AppImage + .deb)
npm run package:mac     # macOS (.dmg)
```

Os instaladores são gerados em `./dist-electron/`:
- Windows: `Neon Escape Setup 1.0.0.exe` (instalador) e `Neon Escape 1.0.0.exe` (portable)
- Linux: `Neon Escape-1.0.0.AppImage` (executável standalone)
- macOS: `Neon Escape-1.0.0.dmg`

### 3. Testar localmente sem empacotar
```bash
npm run build:static     # gera ./out/ (export estático)
npm run electron         # roda Electron carregando ./out/index.html
```

Para hot-reload em dev usando Electron:
```bash
# terminal 1
npm run dev

# terminal 2
npm run electron:dev
```

## Estrutura
- `electron/main.js` — processo principal do Electron (cria a janela)
- `next.config.mjs` — habilita `output: "export"` quando `BUILD_TARGET=electron`
- `package.json > build` — configuração do `electron-builder` (alvos, ícones, IDs)
- `out/` — gerado pelo `next build` em modo static export
- `dist-electron/` — instaladores empacotados (gitignore)

## Notas

### Por que `BUILD_TARGET=electron`?
Em modo padrão (Vercel/web), o Next.js usa SSR. Para Electron precisamos de
HTML/JS estáticos carregáveis via `file://`. A flag de ambiente alterna isso.

### Tamanho do executável
- Windows .exe: ~80–110 MB
- Linux AppImage: ~90–120 MB
- macOS .dmg: ~100–130 MB

Inclui Chromium + Node + assets do jogo.

### Cross-build
Nativamente, electron-builder gera para a plataforma atual.
Para Windows a partir de Linux/Mac: instale `wine` (não recomendado em CI).
Para builds confiáveis cross-platform: use GitHub Actions com matriz de OS.

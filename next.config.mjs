/** @type {import('next').NextConfig} */
// BUILD_TARGET=electron habilita o export estático para empacotamento desktop.
// Em dev (npm run dev) e em deploy web, mantém o modo padrão SSR.
const isElectronBuild = process.env.BUILD_TARGET === "electron";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Static export para Electron — gera arquivos em ./out/ carregáveis via file://
  ...(isElectronBuild
    ? {
        output: "export",
        trailingSlash: true,
        assetPrefix: "./",
      }
    : {}),
};

export default nextConfig;

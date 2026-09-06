import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  experimental: {
    // As planilhas da escola sao pequenas (a maior tem ~50KB), mas o padrao
    // de 1MB nao deixa margem para um arquivo de turma grande.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;

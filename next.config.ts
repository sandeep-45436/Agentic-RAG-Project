import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these packages external — don't bundle them
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "pdf-parse",
    "@langchain/community",
    "tiktoken",
    "neo4j-driver",
    "@xenova/transformers",
  ],

  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
  },
};

export default nextConfig;

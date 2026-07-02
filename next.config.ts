import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these packages as CommonJS requires — don't bundle them
  serverExternalPackages: [
    "pdf-parse",
    "@langchain/community",
    "tiktoken",
    "neo4j-driver",
  ],

  // Turbopack also needs the externals declared separately
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
  },
};

export default nextConfig;

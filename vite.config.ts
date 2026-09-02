import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 8080,
    watch: {
      // The .NET build locks these files, which crashes the Vite watcher with EBUSY
      // when the backend rebuilds while the dev server is running.
      ignored: ["**/backend/**", "**/.vercel/**"],
    },
  },
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // Custom SSR wrapper in src/server.ts
      server: { entry: "server" },
    }),
    nitro({ preset: "vercel" }),
    viteReact(),
  ],
});

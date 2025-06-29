import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

<<<<<<< HEAD
export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
=======
export default  defineConfig(async ({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [
            react(),
            runtimeErrorOverlay(),
            ...(process.env.NODE_ENV !== "production" &&
            process.env.REPL_ID !== undefined
                ? [
                    await import("@replit/vite-plugin-cartographer").then((m) =>
                        m.cartographer(),
                    ),
                ]
                : []),

        ],

        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "client", "src"),
                "@shared": path.resolve(import.meta.dirname, "shared"),
                "@assets": path.resolve(import.meta.dirname, "attached_assets"),
            },
            extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx', '.json'],
        }
        ,
        root: path.resolve(import.meta.dirname, "client"),
        build:
            {
                outDir: path.resolve(import.meta.dirname, "dist/public"),
                emptyOutDir:
                    true,
            }
        ,
        server: {
            fs: {
                strict: true,
                deny:
                    ["**/.*"],
            }
            ,
        }
        ,
    }
>>>>>>> b70b12585e1e32d30438fe01ffc78e7829b7e9d1
});

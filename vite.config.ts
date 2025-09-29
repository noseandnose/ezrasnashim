import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        plugins: [
            react(),
            runtimeErrorOverlay(),
            ...(process.env.NODE_ENV !== "production" &&
            process.env.REPL_ID !== undefined
                ? [
                      await import("@replit/vite-plugin-cartographer").then(
                          (m) => m.cartographer(),
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
            extensions: [".mjs", ".ts", ".tsx", ".js", ".jsx", ".json"],
        },
        root: path.resolve(import.meta.dirname, "client"),
        build: {
            outDir: path.resolve(import.meta.dirname, "dist/public"),
            emptyOutDir: true,
            // Mobile performance optimizations
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom'],
                        router: ['wouter'],
                        ui: ['@radix-ui/react-dialog', '@radix-ui/react-tooltip'],
                        utils: ['date-fns', 'lodash']
                    }
                }
            },
            // Enable compression
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true
                }
            },
            // Optimize for mobile
            target: 'es2015',
            cssCodeSplit: true,
            sourcemap: false
        },
        server: {
            fs: {
                strict: true,
                deny: ["**/.*"],
            },
            allowedHosts: [
                "ea367e04-e505-47ab-af76-4df2facf13dc-00-2yasdnevarltu.pike.replit.dev",
            ],
        },
    };
});

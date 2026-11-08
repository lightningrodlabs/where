import {defineConfig} from 'vite';
import path from "path";
import checker from 'vite-plugin-checker';
import {viteStaticCopy} from 'vite-plugin-static-copy';

console.log("vite: process.env.HC_APP_PORT: ", process.env.HC_APP_PORT);
console.log("vite: process.env.HAPP_BUILD_MODE: ", process.env.HAPP_BUILD_MODE);
const HAPP_BUILD_MODE = process.env.HAPP_BUILD_MODE ? process.env.HAPP_BUILD_MODE : "Retail";

const DIST_FOLDER = "dist";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      /** @ddd-qc/cell-proxy uses top-level await */
      target: 'esnext',
    },
  },
  resolve: {
    alias: {
      '@where/elements': path.resolve(__dirname, '../webcomponents/src'),
    }
  },
  plugins: [
    checker({typescript: true}),
    viteStaticCopy({
      targets: [
        {src: "./logo.svg", dest: "./"},
        {src: "./favicon.ico", dest: "./"},
        {src: '../node_modules/@shoelace-style/shoelace/dist/assets', dest: "shoelace-assets"},
      ]
    }),
  ],
  define: {
    'process.env.HAPP_BUILD_MODE': JSON.stringify(HAPP_BUILD_MODE),
    'process.env.HAPP_ENV': JSON.stringify("Browser"),
    "process.env.HC_APP_PORT": JSON.stringify(process.env.HC_APP_PORT),
    "process.env.HC_ADMIN_PORT": JSON.stringify(process.env.HC_ADMIN_PORT) || undefined,
  },
  build: {
    emptyOutDir: true,
    outDir: DIST_FOLDER,
    target: 'esnext',
  },
  server: {
    open: false,
    watch: {
      usePolling: true,
      interval: 1000,
    }
  }
});

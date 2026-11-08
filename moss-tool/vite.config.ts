import {defineConfig} from 'vite';
import path from 'path';
import checker from 'vite-plugin-checker';
import {viteStaticCopy} from 'vite-plugin-static-copy';

console.log("vite: process.env.HC_APP_PORT: ", process.env.HC_APP_PORT);
console.log("vite: process.env.HAPP_BUILD_MODE: ", process.env.HAPP_BUILD_MODE);
const HAPP_BUILD_MODE = process.env.HAPP_BUILD_MODE ? process.env.HAPP_BUILD_MODE : "Release";

console.log("vite: process.env.APPLET_VIEW: ", process.env.APPLET_VIEW);
const APPLET_VIEW = process.env.APPLET_VIEW ? process.env.APPLET_VIEW : "main";

const DIST_FOLDER = ".";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      /** @ddd-qc/cell-proxy uses top-level await, so the dev server (the
       *  localhost source Moss uses in weave.dev.config.ts) needs a target
       *  that supports it natively. */
      target: 'esnext',
    },
  },
  resolve: {
    alias: {
      '@where/app': path.resolve(__dirname, '../webapp/src'),
      '@where/elements': path.resolve(__dirname, '../webcomponents/src'),
      'ludotheque': path.resolve(__dirname, '../webapp.ludotheque/src'),
    }
  },
  plugins: [
    checker({typescript: true}),
    viteStaticCopy({
      targets: [
        {src: "weave.config.json", dest: DIST_FOLDER},
        {src: "icon.png", dest: DIST_FOLDER},
        {src: "../webapp/logo.svg", dest: DIST_FOLDER},
        {src: "../webapp/favicon.ico", dest: DIST_FOLDER},
        /** To the root: in the Tool the Shoelace base path is './', set by
         *  @ddd-qc/we-utils' setupProd(), so default icons are fetched from ./assets/icons/ */
        {src: '../node_modules/@shoelace-style/shoelace/dist/assets', dest: DIST_FOLDER},
      ]
    }),
  ],
  define: {
    'process.env.HAPP_BUILD_MODE': JSON.stringify(HAPP_BUILD_MODE),
    'process.env.HAPP_ENV': HAPP_BUILD_MODE == "Debug" ? JSON.stringify("BrowserWe") : JSON.stringify("We"),
    'process.env.APPLET_VIEW': JSON.stringify(APPLET_VIEW),
    "process.env.HC_APP_PORT": JSON.stringify(process.env.HC_APP_PORT),
    "process.env.HC_ADMIN_PORT": JSON.stringify(process.env.HC_ADMIN_PORT) || undefined,
  },
  build: {
    emptyOutDir: true,
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

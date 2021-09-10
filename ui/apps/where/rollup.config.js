import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";

import babel from "@rollup/plugin-babel";
import html from "@web/rollup-plugin-html";
import { importMetaAssets } from "@web/rollup-plugin-import-meta-assets";
import { terser } from "rollup-plugin-terser";
import { generateSW } from "rollup-plugin-workbox";
import path from "path";

const HC_PORT = process.env.HC_PORT || 8888;
const DIST_FOLDER = process.env.HC_PORT ? `.dist/${HC_PORT}`: "dist";
console.log('adsasfd',process.env.ROLLUP_WATCH)
export default {
  input: "index.html",
  output: {
    entryFileNames: "[hash].js",
    chunkFileNames: "[hash].js",
    assetFileNames: "[hash][extname]",
    format: "es",
    dir: DIST_FOLDER,
  },
  watch: {
    clearScreen: false,
  },

  plugins: [
    /** Enable using HTML as rollup entrypoint */
    html({
      minify: false,
      injectServiceWorker: true,
      serviceWorkerPath: "dist/sw.js",
    }),
    /** Resolve bare module imports */
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    replace({
      "process.env.NODE_ENV": '"production"',
      "process.env.ENV": `"${process.env.ENV}"`,
      "process.env.HC_PORT": `"${HC_PORT}"`,
    }),
    builtins(),
    typescript({ experimentalDecorators: true, outDir: DIST_FOLDER }),
    commonjs({}),
    globals(),

  ],
};

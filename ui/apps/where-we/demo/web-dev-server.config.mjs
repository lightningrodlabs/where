import rollupCommonjs from "@rollup/plugin-commonjs";
import { fromRollup } from "@web/dev-server-rollup";
// import { hmrPlugin, presets } from '@open-wc/dev-server-hmr';

const commonjs = fromRollup(rollupCommonjs);

/** Use Hot Module replacement by adding --hmr to the start command */
const hmr = process.argv.includes("--hmr");

const HC_PORT = process.env.HC_PORT || 8888;
const DIST_FOLDER = `.dist/${HC_PORT}`;

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  open: true,
  watch: !hmr,
  /** Resolve bare module imports */
  nodeResolve: {
    browser: true,
    exportConditions: ["browser", "development"],
  },

  /** Compile JS for older browsers. Requires @web/dev-server-esbuild plugin */
  // esbuildTarget: 'auto'

  //rootDir: "../../",

  /** Set appIndex to enable SPA routing */
  appIndex: "demo/index.html",

  plugins: [
    /** Use Hot Module Replacement by uncommenting. Requires @open-wc/dev-server-hmr plugin */
    // hmr && hmrPlugin({ exclude: ['**/*/node_modules/**/*'], presets: [presets.litElement] }),
    commonjs({}),
  ],

  // See documentation for all available options
});

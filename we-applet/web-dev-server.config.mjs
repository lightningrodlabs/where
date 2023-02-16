// import { hmrPlugin, presets } from '@open-wc/dev-server-hmr';
import { fromRollup } from "@web/dev-server-rollup";
import rollupReplace from "@rollup/plugin-replace";
import rollupBuiltins from 'rollup-plugin-node-builtins';
import rollupCommonjs from "@rollup/plugin-commonjs";

const replace = fromRollup(rollupReplace);
const commonjs = fromRollup(rollupCommonjs);
const builtins = fromRollup(rollupBuiltins);


/** Use Hot Module replacement by adding --hmr to the start command */
const hmr = process.argv.includes("--hmr");

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  open: true,
  watch: !hmr,
  /** Resolve bare module imports */
  nodeResolve: {
    exportConditions: ["browser", "development"],
    browser: true,
    preferBuiltins: false,
  },

  /** Compile JS for older browsers. Requires @web/dev-server-esbuild plugin */
  // esbuildTarget: 'auto'

  /** Set appIndex to enable SPA routing */
  appIndex: "./demo/index.html",
  rootDir: '../',
  clearTerminalOnReload: false,

  plugins: [
    replace({
      "preventAssignment": true,
      'process.env.BUILD_MODE': JSON.stringify(process.env.HC_APP_PORT || 'prod'),
      "process.env.HC_APP_PORT": JSON.stringify(process.env.HC_APP_PORT),
      "process.env.HC_ADMIN_PORT": JSON.stringify(process.env.HC_ADMIN_PORT) || undefined,
      delimiters: ["", ""],
    }),
    builtins(),
    commonjs(),
    /** Use Hot Module Replacement by uncommenting. Requires @open-wc/dev-server-hmr plugin */
    // hmr && hmrPlugin({ exclude: ['**/*/node_modules/**/*'], presets: [presets.litElement] }),
  ],

  // See documentation for all available options
});

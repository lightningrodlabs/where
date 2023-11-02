// import { hmrPlugin, presets } from '@open-wc/dev-server-hmr';
import { fromRollup } from "@web/dev-server-rollup";
import rollupReplace from "@rollup/plugin-replace";
import rollupBuiltins from 'rollup-plugin-node-builtins';
import rollupCommonjs from "@rollup/plugin-commonjs";
import RollupCopy from "rollup-plugin-copy";

const replace = fromRollup(rollupReplace);
const commonjs = fromRollup(rollupCommonjs);
const builtins = fromRollup(rollupBuiltins);
const copy = fromRollup(RollupCopy);

console.log("web-dev-server: process.env.HAPP_BUILD_MODE: ", process.env.HAPP_BUILD_MODE);
const HAPP_BUILD_MODE = process.env.HAPP_BUILD_MODE? process.env.HAPP_BUILD_MODE : "Release";

console.log("web-dev-server: process.env.APPLET_VIEW: ", process.env.APPLET_VIEW);
const APPLET_VIEW = process.env.APPLET_VIEW? process.env.APPLET_VIEW : "main";

/** Use Hot Module replacement by adding --hmr to the start command */
const hmr = process.argv.includes("--hmr");

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  open: true,
  watch: !hmr,
  /** Resolve bare module imports */
  nodeResolve: {
    browser: true,
    preferBuiltins: false,
    exportConditions: ['browser', HAPP_BUILD_MODE === 'Debug' ? 'development' : ''],
  },

  /** Compile JS for older browsers. Requires @web/dev-server-esbuild plugin */
  // esbuildTarget: 'auto'

  /** Set appIndex to enable SPA routing */
  appIndex: "./index.html",
  rootDir: '../',
  clearTerminalOnReload: false,

  plugins: [
    /** FIXME: does not copy for unknown reason */
    copy({
      copyOnce: true,
      targets: [
        { src: "../webapp/logo.svg", dest: "./" },
      ],
    }),
    replace({
      "preventAssignment": true,
      'process.env.HAPP_BUILD_MODE': JSON.stringify(HAPP_BUILD_MODE),
      'process.env.HAPP_ENV': JSON.stringify("DevtestWe"),
      'process.env.APPLET_VIEW': JSON.stringify(APPLET_VIEW),
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

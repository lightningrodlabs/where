// import { hmrPlugin, presets } from '@open-wc/dev-server-hmr';
import rollupReplace from '@rollup/plugin-replace';
//import rollupCommonjs from '@rollup/plugin-commonjs';
import { fromRollup } from '@web/dev-server-rollup';
//import rollupBuiltins from 'rollup-plugin-node-builtins';

const replace = fromRollup(rollupReplace);
//const commonjs = fromRollup(rollupCommonjs);
//const builtins = fromRollup(rollupBuiltins);

/** Use Hot Module replacement by adding --hmr to the start command */
const hmr = process.argv.includes('--hmr');

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  open: true,
  watch: !hmr,
  /** Resolve bare module imports */
  nodeResolve: {
    preferBuiltins: false,
    browser: true,
    exportConditions: ['browser', 'development'],
  },

  /** Compile JS for older browsers. Requires @web/dev-server-esbuild plugin */
  // esbuildTarget: 'auto'

  rootDir: '../',

  /** Set appIndex to enable SPA routing */
  appIndex: './dist/index.html',

  plugins: [
    replace({
      "preventAssignment": true,
      'process.env.ENV': JSON.stringify(process.env.ENV),
      'process.env.APP_DEV': JSON.stringify(process.env.APP_DEV),
      'process.env.HC_APP_PORT': JSON.stringify(process.env.HC_APP_PORT || 8888),
      'process.env.HC_ADMIN_PORT': JSON.stringify(process.env.HC_ADMIN_PORT || 8889),
      '  COMB =': 'window.COMB =',
      delimiters: ['', ''],
    }),
    //builtins(),
    //commonjs({}),

    /** Use Hot Module Replacement by uncommenting. Requires @open-wc/dev-server-hmr plugin */
    // hmr && hmrPlugin({ exclude: ['**/*/node_modules/**/*'], presets: [presets.litElement] }),
  ],

  // See documentation for all available options
});

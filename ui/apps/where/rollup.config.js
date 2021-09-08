import merge from 'deepmerge';
// use createSpaConfig for bundling a Single Page App
import { createSpaConfig } from '@open-wc/building-rollup';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

// use createBasicConfig to do regular JS to JS bundling
// import { createBasicConfig } from '@open-wc/building-rollup';

const outputDir =
  process.env.ENV === 'holodev' ? `dist-${process.env.HC_PORT}` : 'dist';
const baseConfig = createSpaConfig({
  // use the outputdir option to modify where files are output
  outputDir,

  // if you need to support older browsers, such as IE11, set the legacyBuild
  // option to generate an additional build just for this browser
  // legacyBuild: true,

  // development mode creates a non-minified build for debugging or development
  developmentMode: process.env.ROLLUP_WATCH === 'true',
  nodeResolve: {
    browser: true,
    preferBuiltins: false,
  },

  // set to true to inject the service worker registration into your index.html
  injectServiceWorker: false,
});

export default merge(baseConfig, {
  // if you use createSpaConfig, you can use your index.html as entrypoint,
  // any <script type="module"> inside will be bundled by rollup
  input: './index.html',

  // alternatively, you can use your JS as entrypoint for rollup and
  // optionally set a HTML template manually
  // input: './app.js',
  plugins: [
    replace({
      'process.env.NODE_ENV': '"production"',
      'process.env.ENV': `"${process.env.ENV}"`,
      'process.env.HC_PORT': `"${process.env.HC_PORT}"`,
    }),
    builtins(),
    typescript({ experimentalDecorators: true, outDir: outputDir }),
    commonjs({
      include: [
        'node_modules/base64-js/**/*',
        'node_modules/isomorphic-ws/**/*',
        'node_modules/buffer/**/*',
        'node_modules/navigo/**/*',
        'node_modules/@msgpack/**/*',
        'node_modules/@holochain/conductor-api/**/*',
        'node_modules/@holo-host/**/*',
      ],
    }),
    globals(),
  ],
});

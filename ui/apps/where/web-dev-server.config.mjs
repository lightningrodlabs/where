import plugins from './web-dev.plugins.mjs';

export default {
  port: 8080,
  watch: true,
  nodeResolve: {
    browser: true,
    preferBuiltins: false
  },
  appIndex: './index.html',
  open: true,
  plugins,
};

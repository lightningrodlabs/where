import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import postcssLit from "rollup-plugin-postcss-lit";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import copy from 'rollup-plugin-copy';

import postcssCQFill from "cqfill/postcss";

const pkg = require("./package.json");

export default {
  input: `src/index.ts`,
  output: [{ dir: "dist", format: "es", sourcemap: true }],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash-es')
  external: [...Object.keys(pkg.dependencies), /lodash-es/, /lit/, 'svelte/store'],
  watch: {
    include: "src/**",
    clearScreen: false,
  },
  plugins: [
    babel({
      exclude: /node_modules/,
      plugins: [
        require.resolve("babel-plugin-transform-class-properties")
      ],
    }),
    postcss({
      inject: false,
      plugins: [postcssCQFill],
    }),
    postcssLit(),
    typescript(),
    resolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs(),
    copy({
      targets: [
        { src: 'src/generated/*', dest: 'dist/generated' },
    ]}),
  ],
};

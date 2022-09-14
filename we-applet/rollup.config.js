import nodeResolve from "@rollup/plugin-node-resolve";
//import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import copy from "rollup-plugin-copy";

import babel from "@rollup/plugin-babel";
import { importMetaAssets } from "@web/rollup-plugin-import-meta-assets";
import { terser } from "rollup-plugin-terser";

import pkg from "where/package.json";

const DIST_FOLDER = "dist"

export default {
  input: "out-tsc/index.js",
  output: {
    format: "es",
    dir: "dist",
    sourcemap: false,
  },
  watch: {
    clearScreen: false,
  },
  external: [...Object.keys(pkg.dependencies), /lodash-es/],
  plugins: [
    copy({
      targets: [{ src: "icon.png", dest: "dist" }],
    }),
    /** Resolve bare module imports */
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }),
    replace({
      "preventAssignment": true,
      "process.env.NODE_ENV": '"production"',
      "process.env.APP_DEV": `"${process.env.APP_DEV}"`,
    }),
    //typescript({ experimentalDecorators: true, outDir: DIST_FOLDER }),
    /** Minify JS */
    terser(),
    /** Bundle assets references via import.meta.url */
    importMetaAssets(),
    /** Compile JS to a lower language target */
    babel({
      exclude: /node_modules/,

      babelHelpers: "bundled",
      presets: [
        [
          require.resolve("@babel/preset-env"),
          {
            targets: [
              "last 3 Chrome major versions",
              "last 3 Firefox major versions",
              "last 3 Edge major versions",
              "last 3 Safari major versions",
            ],
            modules: false,
            bugfixes: true,
          },
        ],
      ],
      plugins: [
        [
          require.resolve("babel-plugin-template-html-minifier"),
          {
            modules: {
              lit: ["html", { name: "css", encapsulation: "style" }],
            },
            failOnError: false,
            strictCSS: true,
            htmlMinifier: {
              collapseWhitespace: true,
              conservativeCollapse: true,
              removeComments: true,
              caseSensitive: true,
              minifyCSS: true,
            },
          },
        ],
      ],
    }),
    commonjs({}),
  ],
};

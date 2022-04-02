const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const LoadablePlugin = require("@loadable/webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const paths = require("./paths");

const ENV = process.env.NODE_ENV;
const ENV_DEVELOPMENT = ENV !== "production";
const ENV_PRODUCTION = ENV === "production";

if (!ENV) {
  throw new Error(`NODE_ENV must be defined`);
}

function compact(list) {
  return list.filter(Boolean);
}

function config(env) {
  const byTarget = (config) => config[env.target];
  const isBrowser = env.target === "browser";
  const isServer = env.target === "server";

  return {
    mode: ENV,

    devtool: byTarget({
      browser: ENV_PRODUCTION ? "source-map" : "eval-source-map",
      server: ENV_PRODUCTION ? "source-map" : false,
    }),
    name: byTarget({
      browser: "web",
      server: "node",
    }),
    entry: byTarget({
      browser: "./index.js",
      server: "./ssr.js",
    }),
    target: byTarget({
      browser: "web",
      server: "node",
    }),
    output: byTarget({
      browser: {
        filename: "index.[contenthash:6].js",
        chunkFilename: "chunks/[id].[contenthash:6].js",
        assetModuleFilename: "assets/[name].[contenthash:6][ext]",
        publicPath: "/static/",
        path: paths.static,
      },
      server: {
        filename: "ssr.js",
        library: {
          type: "commonjs2",
        },
        path: paths.dist,
      },
    }),
    ...byTarget({
      browser: {},
      server: {
        externalsType: "commonjs2",
        externalsPresets: { node: true },
        externals: [
          nodeExternals({
            importType: "commonjs2",
            additionalModuleDirs: [paths.rootModules],
          }),
        ],
      },
    }),
    resolve: {
      extensions: [".jsx", "..."],
    },
    module: {
      rules: [
        {
          oneOf: compact([
            {
              test: /\.(js|jsx)$/,
              exclude: /node_modules/,
              use: [
                {
                  loader: "babel-loader",
                  options: byTarget({
                    browser: {
                      plugins: compact([
                        ENV_DEVELOPMENT &&
                          require.resolve("react-refresh/babel"),
                      ]),
                    },
                    server: {
                      presets: [
                        [
                          "@babel/preset-env",
                          {
                            modules: false,
                            targets: { node: "current" },
                          },
                        ],
                      ],
                    },
                  }),
                },
              ],
            },
            isBrowser && {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve("babel-loader"),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                sourceType: "unambiguous",
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      // Allow importing core-js in entrypoint and use browserlist to select polyfills
                      useBuiltIns: "entry",
                      // Set the corejs version we are using to avoid warnings in console
                      // This will need to change once we upgrade to corejs@3
                      corejs: 3,
                      // Exclude transforms that make all code slower
                      exclude: ["transform-typeof-symbol"],
                    },
                  ],
                ],
                plugins: [
                  [
                    "@babel/plugin-transform-runtime",
                    {
                      corejs: false,
                      helpers: true,
                      regenerator: true,
                      useESModules: true,
                    },
                  ],
                ],
              },
            },
            {
              test: /\.css$/,
              use: byTarget({
                browser: [
                  ENV_DEVELOPMENT
                    ? "style-loader"
                    : MiniCssExtractPlugin.loader,
                  "css-loader",
                  "postcss-loader",
                ],
                server: "ignore-loader",
              }),
            },
          ]),
        },
      ],
    },
    plugins: byTarget({
      browser: compact([
        new webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify(ENV),
        }),

        ENV_PRODUCTION &&
          new MiniCssExtractPlugin({ filename: "[name].[contenthash:6].css" }),

        ENV_DEVELOPMENT &&
          new ReactRefreshWebpackPlugin({
            overlay: false,
          }),

        new LoadablePlugin({ writeToDisk: ENV_DEVELOPMENT }),
      ]),
      server: [],
    }),
  };
}

module.exports = config;

// {
//   name: "node",
//   mode: mode,
//   entry: "./ssr.js",
//   target: "node",
//   experiments: {
//     outputModule: true,
//   },
//   externalsType: "module",
//   externalsPresets: { node: true },
//   externals: [
//     nodeExternals({
//       importType: "module",
//       additionalModuleDirs: [paths.rootModules],
//     }),
//   ],
//   output: {
//     filename: "ssr.mjs",
//     module: true,
//     chunkFormat: "module",
//     environment: { module: true },
//     library: {
//       type: "module",
//     },
//     path: path.resolve(__dirname, "dist"),
//   },
//   optimization: {
//     minimize: false,
//   },
//   resolve: {
//     extensions: [".jsx", "..."],
//   },
//   module: {
//     rules: [
//       {
//         test: /\.(js|jsx)$/,
//         exclude: /node_modules/,
//         use: [
//           {
//             loader: "babel-loader",
//             options: {
//               presets: [
//                 [
//                   "@babel/preset-env",
//                   {
//                     modules: false,
//                     targets: { node: "current" },
//                   },
//                 ],
//               ],
//             },
//           },
//         ],
//       },
//     ],
//   },
// }

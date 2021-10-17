const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const LoadablePlugin = require("@loadable/webpack-plugin");
const paths = require("./paths");

const ENV = process.env.NODE_ENV;
const ENV_DEVELOPMENT = ENV !== "production";
const ENV_PRODUCTION = ENV === "production";

function filterEmpty(list) {
  return list.filter(Boolean);
}

function config(env) {
  const byTarget = (config) => config[env.target];

  return {
    mode: ENV,
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
        filename: "static/index.[contenthash:6].js",
        chunkFilename: "static/chunks/[id].[contenthash:6].js",
        assetModuleFilename: "static/assets/[name].[contenthash:6][ext]",
        publicPath: "/",
        path: paths.dist,
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
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: byTarget({
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
        {
          test: /\.css$/,
          use: byTarget({
            browser: [
              ENV_DEVELOPMENT ? "style-loader" : MiniCssExtractPlugin.loader,
              "css-loader",
              "postcss-loader",
            ],
            server: "ignore-loader",
          }),
        },
      ],
    },
    plugins: filterEmpty([
      ...byTarget({
        browser: [
          new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify("production"),
          }),
          ENV_PRODUCTION && new MiniCssExtractPlugin(),
          new LoadablePlugin(),
        ],
        server: [],
      }),
    ]),
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

const path = require("path");
const nodeExternals = require("webpack-node-externals");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const paths = require("./paths");

const ENV = process.env.NODE_ENV;
const ENV_DEVELOPMENT = ENV !== "production";

module.exports = [
  {
    name: "web",
    mode: ENV,
    entry: "./index.js",
    target: "web",
    output: {
      filename: "index.js",
      path: path.resolve(__dirname, "dist"),
    },
    resolve: {
      extensions: [".jsx", "..."],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
        {
          test: /\.css$/,
          use: [
            ENV_DEVELOPMENT ? "style-loader" : MiniCssExtractPlugin.loader,
            "css-loader",
            "postcss-loader",
          ],
        },
      ],
    },
    plugins: [ENV_DEVELOPMENT && new MiniCssExtractPlugin()].filter(Boolean),
  },

  {
    name: "node",
    mode: ENV,
    entry: "./ssr.js",
    target: "node",
    externalsType: "commonjs2",
    externalsPresets: { node: true },
    externals: [
      nodeExternals({
        importType: "commonjs2",
        additionalModuleDirs: [paths.rootModules],
      }),
    ],
    output: {
      filename: "ssr.js",
      library: {
        type: "commonjs2",
      },
      path: path.resolve(__dirname, "dist"),
    },
    optimization: {
      minimize: false,
    },
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
              options: {
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
            },
          ],
        },
        {
          test: /\.css$/,
          use: "ignore-loader",
        },
      ],
    },
  },

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
  // },
];

module.exports.parallelism = 2;

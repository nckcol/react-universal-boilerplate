const path = require("path");

module.exports = [
  {
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
      ],
    },
  },
  {
    experiments: {
      outputModule: true,
    },
    entry: "./ssr.js",
    target: "node",
    output: {
      filename: "ssr.mjs",
      module: true,
      chunkFormat: "module",
      library: {
        type: "module",
      },
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
      ],
    },
  },
];

const Webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const webpackConfig = require("../webpack.config");
const paths = require("../paths");

const STATIC_SERVER_HOST = "0.0.0.0";
const STATIC_SERVER_PORT = process.env.STATIC_SERVER_PORT;

const options = {
  host: STATIC_SERVER_HOST,
  port: STATIC_SERVER_PORT,
  compress: true,
  hot: "only",
  allowedHosts: "all",
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
  },
  // static: {
  //   directory: paths.public,
  //   serveIndex: false,
  // },
  static: false,
  client: {
    logging: "error",
    overlay: {
      errors: true,
      warnings: false,
    },
  },
  devMiddleware: {
    index: false,
    // writeToDisk: true,
  },
  // proxy: {
  //   context: () => true,
  //   target: "http://localhost:3000",
  // },
};

function setupCompiler(
  config,
  { onInvalid, onFailed, onDone, onWatchClose } = {}
) {
  const name = "StartTask";
  const compiler = Webpack(config);

  compiler.hooks.invalid.tap(name, () => {
    // console.log(compiler.name + ": invalid");
    if (onInvalid) {
      onInvalid();
    }
  });
  compiler.hooks.failed.tap(name, () => {
    // console.log(compiler.name + ": failed");
    if (onFailed) {
      onFailed();
    }
  });
  compiler.hooks.done.tap(name, (stats) => {
    // console.log(compiler.name + ": done");
    if (onDone) {
      onDone();
    }
  });
  compiler.hooks.watchClose.tap(name, () => {
    // console.log(compiler.name + ": watchClose");
    if (onWatchClose) {
      onWatchClose();
    }
  });

  return compiler;
}

function Runtime({ onInvalid, onReady }) {
  // RUNNING -> CLIENT_RECOMPILATION -> CLIENT_DONE -> SERVER_DONE -> RUNNING
  // RUNNING -> SERVER_RECOMPILATION -> SERVER_DONE -> RUNNING
  let invalidTriggered = false;
  let clientReady = false;
  let serverReady = false;

  function invalid() {
    if (!invalidTriggered) {
      invalidTriggered = true;
      onInvalid();
    }
  }

  function checkReady() {
    if (clientReady && serverReady) {
      invalidTriggered = false;
      onReady();
    }
  }

  return {
    clientInvalid() {
      clientReady = false;
      serverReady = false;
      invalid();
    },
    serverInvalid() {
      serverReady = false;
      invalid();
    },
    clientDone() {
      clientReady = true;
      checkReady();
    },
    serverDone() {
      serverReady = true;
      checkReady();
    },
  };
}

async function run() {
  const runtime = Runtime({
    onInvalid: () => {
      process.send("invalid");
    },
    onReady: () => {
      process.send("ready");
    },
  });

  const browserConfig = webpackConfig({ target: "browser" });
  browserConfig.stats = false; //{ logging: "none" };
  browserConfig.infrastructureLogging = { level: "none" };
  // We need this for correct work of HMR
  browserConfig.output.publicPath = `http://${STATIC_SERVER_HOST}:${STATIC_SERVER_PORT}${browserConfig.output.publicPath}`;
  const browserCompiler = setupCompiler(browserConfig, {
    onInvalid: runtime.clientInvalid,
    onDone: runtime.clientDone,
  });

  const serverConfig = webpackConfig({ target: "server" });
  const serverCompiler = setupCompiler(serverConfig, {
    onInvalid: runtime.serverInvalid,
    onDone: runtime.serverDone,
  });

  serverCompiler.watch({}, (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
  });

  const devServer = new WebpackDevServer(options, browserCompiler);

  await devServer.start();
  // invalid server -> build server + restart server
  // invalid client -> build client and server + restart server
}

run();

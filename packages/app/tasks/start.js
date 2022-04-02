const pc = require("picocolors");
const Webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const webpackConfig = require("../webpack.config");
const paths = require("../paths");
const formatWebpackMessages = require("../../dev/format-webpack-messages");

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
  compiler.hooks.done.tap(name, (webpackStats) => {
    // console.log(compiler.name + ": done");
    if (onDone) {
      const stats = webpackStats.toJson({
        all: false,
        errorsCount: true,
        errors: true,
        warnings: true,
      });

      const messages = formatWebpackMessages(stats);

      if (stats.errorsCount > 0) {
        onDone(true, messages);
        return;
      }

      onDone(null, messages);
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
  let clientError = false;
  let serverError = false;
  let clientMessages = null;
  let serverMessages = null;

  function invalid() {
    if (!invalidTriggered) {
      invalidTriggered = true;
      onInvalid();
    }
  }

  function checkReady() {
    if (clientReady && serverReady) {
      invalidTriggered = false;
      onReady(clientError || serverError, { clientMessages, serverMessages });
    }
  }

  const clientHooks = {
    onInvalid() {
      clientError = false;
      clientReady = false;
      clientMessages = null;
      serverError = false;
      serverReady = false;
      invalid();
    },
    onDone(error, messages) {
      if (error) {
        clientError = true;
      }
      clientMessages = messages;
      clientReady = true;
      checkReady();
    },
  };

  const serverHooks = {
    onInvalid() {
      serverError = false;
      serverReady = false;
      serverMessages = null;
      invalid();
    },
    onDone(error, messages) {
      if (error) {
        serverError = true;
      }
      serverMessages = messages;
      serverReady = true;
      checkReady();
    },
  };

  return {
    clientHooks,
    serverHooks,
  };
}

async function run() {
  const runtime = Runtime({
    onInvalid: () => {
      process.send("invalid");
    },
    onReady: (error, { clientMessages, serverMessages }) => {
      if (error) {
        process.send("error");

        if (clientMessages?.errors?.length > 0) {
          console.log(pc.red(pc.bold("Client was built with errors:\n")));
          clientMessages.errors.forEach((error) => console.log(error + "\n"));
          return;
        }

        if (serverMessages?.errors?.length > 0) {
          console.log(pc.red(pc.bold("Server was built with errors:\n")));
          serverMessages.errors.forEach((error) => console.log(error + "\n"));
        }

        return;
      }

      process.send("ready");

      if (clientMessages?.warnings?.length > 0) {
        console.log(pc.orange(pc.bold("Client was built with warnings:\n")));
        clientMessages.warnings.forEach((warning) =>
          console.log(warning + "\n")
        );
        return;
      }

      if (serverMessages?.warnings?.length > 0) {
        console.log(pc.orange(pc.bold("Server was built with warnings:\n")));
        serverMessages.warnings.forEach((warning) =>
          console.log(warning + "\n")
        );
      }
    },
  });

  const serverConfig = webpackConfig({ target: "server" });
  const serverCompiler = setupCompiler(serverConfig, runtime.serverHooks);

  serverCompiler.watch({}, (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
  });

  const browserConfig = webpackConfig({ target: "browser" });
  browserConfig.stats = false; //{ logging: "none" };
  browserConfig.infrastructureLogging = { level: "none" };
  // We need this for correct work of HMR
  browserConfig.output.publicPath = `http://${STATIC_SERVER_HOST}:${STATIC_SERVER_PORT}${browserConfig.output.publicPath}`;
  const browserCompiler = setupCompiler(browserConfig, runtime.clientHooks);

  const devServer = new WebpackDevServer(options, browserCompiler);

  await devServer.start();
  // invalid server -> build server + restart server
  // invalid client -> build client and server + restart server
}

run();

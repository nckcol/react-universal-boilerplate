process.env.NODE_ENV = "development";

const { fork } = require("child_process");
const webpack = require("webpack");
const Fastify = require("fastify");
const middie = require("middie");
const webpackDevMiddleware = require("webpack-dev-middleware");
const httpProxy = require("fastify-http-proxy");
const config = require("../webpack.config");

function startServerProcess() {
  const process = fork(require.resolve("./dev-server.js"), [], {
    stdio: "inherit",
  });

  return process;
}

async function startDevServer(compiler) {
  const server = Fastify();

  server.register(httpProxy, { upstream: "http://localhost:3001" });

  await server.register(middie);

  server.use(
    webpackDevMiddleware(compiler, {
      index: false,
      stats: false,
      writeToDisk: true,
    })
  );

  await server.listen(3000);
}

function setupCompiler(
  config,
  { onInvalid, onFailed, onDone, onWatchClose } = {}
) {
  const name = "StartTask";
  const compiler = webpack(config);

  compiler.hooks.invalid.tap(name, () => {
    console.log(compiler.name + ": invalid");
    if (onInvalid) {
      onInvalid();
    }
  });
  compiler.hooks.failed.tap(name, () => {
    console.log(compiler.name + ": failed");
    if (onFailed) {
      onFailed();
    }
  });
  compiler.hooks.done.tap(name, () => {
    console.log(compiler.name + ": done");
    if (onDone) {
      onDone();
    }
  });
  compiler.hooks.watchClose.tap(name, () => {
    console.log(compiler.name + ": watchClose");
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

function ServerProcess() {
  let process = null;
  return {
    start() {
      process = startServerProcess();
    },
    stop() {
      if (!process) {
        return;
      }
      process.kill("SIGHUP");
      process = null;
    },
  };
}

async function run() {
  const serverProcess = ServerProcess();

  const runtime = Runtime({
    onInvalid: () => {
      serverProcess.stop();
    },
    onReady: () => {
      serverProcess.start();
    },
  });

  const browserCompiler = setupCompiler(config({ target: "browser" }), {
    onInvalid: runtime.clientInvalid,
    onDone: runtime.clientDone,
  });
  const serverCompiler = setupCompiler(config({ target: "server" }), {
    onInvalid: runtime.serverInvalid,
    onDone: runtime.serverDone,
  });

  serverCompiler.watch({}, (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
  });

  try {
    await startDevServer(browserCompiler);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("App is running on http://localhost:3000");

  // invalid server -> build server + restart server
  // invalid client -> build client and server + restart server
}

run();

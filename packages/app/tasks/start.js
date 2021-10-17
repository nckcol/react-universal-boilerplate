process.env.NODE_ENV = "development";

const cp = require("child_process");
const webpack = require("webpack");
const Fastify = require("fastify");
const middie = require("middie");
const webpackDevMiddleware = require("webpack-dev-middleware");
const httpProxy = require("fastify-http-proxy");
const config = require("../webpack.config");

function startServerProcess() {
  const process = cp.fork(require.resolve("./dev-server.js"), [], {
    stdio: "inherit",
  });

  return process;
}

async function setupDevServer(compiler) {
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

  server.listen(3000, () =>
    console.log("App is running on http://localhost:3000")
  );
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

let serverProcess;

const browserCompiler = setupCompiler(config({ target: "browser" }));
const serverCompiler = setupCompiler(config({ target: "server" }), {
  onInvalid() {
    serverProcess.kill("SIGHUP");
  },
  onDone() {
    serverProcess = startServerProcess();
  },
});

serverCompiler.watch({}, (error) => {
  if (error) {
    console.error(error);
  }
});
setupDevServer(browserCompiler);

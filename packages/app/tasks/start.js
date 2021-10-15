process.env.NODE_ENV = "development";

const cp = require("child_process");
const webpack = require("webpack");
const Fastify = require("fastify");
const middie = require("middie");
const webpackDevMiddleware = require("webpack-dev-middleware");
const httpProxy = require("fastify-http-proxy");
const config = require("../webpack.config");

function startServerProcess() {
  const process = cp.fork(require.resolve("./dev-server.js"));

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

function setupCompiler(config) {
  const name = "StartTask";
  const multiCompiler = webpack(config);

  let serverProcess;

  multiCompiler.compilers.forEach((compiler) => {
    compiler.hooks.invalid.tap(name, () => {
      console.log(compiler.name + ": invalid");
      if (compiler.name === "node") {
        serverProcess.kill("SIGHUP");
      }
    });
    compiler.hooks.failed.tap(name, () => {
      console.log(compiler.name + ": failed");
    });
    compiler.hooks.done.tap(name, () => {
      console.log(compiler.name + ": done");
      if (compiler.name === "node") {
        serverProcess = startServerProcess();
      }
    });
    compiler.hooks.watchClose.tap(name, () => {
      console.log(compiler.name + ": watchClose");
    });
  });

  return multiCompiler;
}

const compiler = setupCompiler(config);

setupDevServer(compiler);

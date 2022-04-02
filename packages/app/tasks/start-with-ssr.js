const { performance } = require("perf_hooks");
const Process = require("../../dev/process");
const clearConsole = require("../../dev/clear-console");

const GATEWAY_SERVER_PORT = 3000;
const STATIC_SERVER_PORT = 3001;

const env = {
  ...process.env,
  STATIC_SERVER_PORT,
  GATEWAY_SERVER_PORT,
};

const serverProcess = Process(require.resolve("./start-dev-server.js"), {
  env,
});

const appDevProcess = Process(require.resolve("./start.js"), {
  env,
});

appDevProcess.on("invalid", function () {
  performance.clearMarks();
  performance.mark("app:invalid");
  clearConsole();
  console.log("Rebuilding app...");
});

appDevProcess.on("ready", function () {
  performance.mark("app:ready");
  clearConsole();
  console.log(
    `Static app files been served on \thttp://localhost:${STATIC_SERVER_PORT}`
  );
  serverProcess.restart();
});

serverProcess.on("ready", function () {
  console.log(
    `Entrypoint with ssr is running on \thttp://localhost:${GATEWAY_SERVER_PORT}`
  );

  if (performance.getEntriesByName("app:invalid").length > 0) {
    const time = performance.measure("rebuild", "app:invalid").duration;
    console.log(`Restarted in ${(time / 1000).toFixed(1)}s`);
  } else {
    const time = performance.now();
    console.log(`Started in ${(time / 1000).toFixed(1)}s`);
  }
});

clearConsole();
console.log("Building app...");
appDevProcess.start();

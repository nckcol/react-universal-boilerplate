const path = require("path");
const { default: Process } = require("../packages/dev/process");

const appRoot = path.resolve(process.cwd(), "./packages/app");
const serverRoot = path.resolve(process.cwd(), "./packages/server");

const appDevProcess = Process(path.resolve(appRoot, "./tasks/start.js"), {
  cwd: appRoot,
  //   silent: true,
});

const serverProcess = Process(path.resolve(serverRoot, "./tasks/start.js"), {
  cwd: serverRoot,
});

appDevProcess.start();

appDevProcess.on("ready", function () {
  console.log("done");
  serverProcess.restart();
});

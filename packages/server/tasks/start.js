import url from "url";
import path from "path";
import { watch } from "chokidar";
import Process from "../../dev/process";

const INSPECT = process.env.INSPECT && process.env.INSPECT !== "false";

function start() {
  const dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const serverProcess = Process(path.resolve(dirname, "../index.js"), {
    execArgv: compact([INSPECT && "--inspect"]),
    silent: INSPECT,
  });
  const watcher = watch(path.resolve(dirname, "../"));

  serverProcess.start();

  watcher.on("change", function () {
    serverProcess.restart();
  });
}

start();

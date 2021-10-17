const fs = require("fs");
const path = require("path");
const Fastify = require("fastify");
const ssr = require("@react-universal-boilerplate/app/ssr");
const paths = require("../paths");

const stats = JSON.parse(
  fs.readFileSync(path.resolve(paths.dist, "./loadable-stats.json"), "utf-8")
);

const server = Fastify();
server.register(ssr, { stats });
server.listen(3001, (error) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log("ssr is running on http://localhost:3001");
});

process.on("SIGHUP", () => {
  console.log("exit");
  process.exit(0);
});

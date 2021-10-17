const path = require("path");

const workdir = __dirname;
const root = path.resolve(workdir, "../../");
const rootModules = path.resolve(root, "./node_modules");
const dist = path.resolve(workdir, "./dist");

module.exports = {
  workdir,
  root,
  rootModules,
  dist,
};

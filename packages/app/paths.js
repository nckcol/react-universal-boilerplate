const path = require("path");

const workdir = __dirname;
const root = path.resolve(workdir, "../../");
const rootModules = path.resolve(root, "node_modules");

module.exports = {
  workdir,
  root,
  rootModules,
};

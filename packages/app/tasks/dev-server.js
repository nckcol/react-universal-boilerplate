const Fastify = require("fastify");
const ssr = require("@react-universal-boilerplate/app/ssr");

const server = Fastify();
server.register(ssr);
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

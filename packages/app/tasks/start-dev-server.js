const fs = require("fs-extra");
const Fastify = require("fastify");
const httpProxy = require("fastify-http-proxy");
const static = require("fastify-static");
const ssr = require("@react-universal-boilerplate/app/ssr");
const paths = require("../paths");

const GATEWAY_SERVER_PORT = process.env.GATEWAY_SERVER_PORT;
const STATIC_SERVER_PORT = process.env.STATIC_SERVER_PORT;

const STATIC_SERVER_URL = `http://localhost:${STATIC_SERVER_PORT}`;

async function start() {
  const server = Fastify();

  server.register(static, {
    root: paths.public,
    wildcard: false,
  });

  server.register(httpProxy, {
    upstream: STATIC_SERVER_URL,
    prefix: "/static",
    rewritePrefix: "/static",
  });

  server.register(ssr, {
    stats: await fs.readJSON(
      require.resolve("@react-universal-boilerplate/app/stats.json")
    ),
  });

  await server.listen(GATEWAY_SERVER_PORT);

  process.send("ready");
}

start();

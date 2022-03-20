import Fastify from "fastify";
import url from "url";
import fs from "fs-extra";
import { resolve } from 'import-meta-resolve';
import ssr from "@react-universal-boilerplate/app/ssr";

const fastify = Fastify();

async function readStats() {
  const moduleUrl = await resolve('@react-universal-boilerplate/app/loadable-stats.json', import.meta.url);
  const filename = url.fileURLToPath(moduleUrl);
  return await fs.readJSON(filename);
}

const stats = await readStats();

fastify.register(ssr, { stats });

fastify.listen(3000, (error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("Server is running on http://localhost:3000");
});

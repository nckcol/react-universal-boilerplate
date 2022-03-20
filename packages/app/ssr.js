import fs from "fs";
import path from "path";
import { createElement } from "react";
import { renderToString } from "react-dom/server.js";
import * as Eta from "eta";
import Application from "./Application";
import template from "!!raw-loader!./index.html";
import { ChunkExtractor } from "@loadable/server";

function readStats(filename) {
  try {
    const content = fs.readFileSync(filename, "utf-8");
    const stats = JSON.parse(content);
    return stats;
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function ssr(fastify, options) {
  const renderTemplate = Eta.compile(template, { autoEscape: false });

  fastify.get("/", (request, reply) => {
    const chunkExtractor = new ChunkExtractor({ stats: options.stats });
    const jsx = chunkExtractor.collectChunks(createElement(Application));
    const content = renderToString(jsx);

    const header = [
      chunkExtractor.getLinkTags(),
      chunkExtractor.getStyleTags(),
    ].join("\n");
    const footer = [chunkExtractor.getScriptTags()].join("\n");

    reply.type("text/html");
    return renderTemplate(
      { locale: "en", content, header, footer },
      Eta.config
    );
  });
}

export default ssr;

import { createElement } from "react";
import { renderToString } from "react-dom/server.js";
import * as Eta from "eta";
import Application from "./Application";
import template from "!!raw-loader!./index.html";

async function ssr(fastify) {
  const renderTemplate = Eta.compile(template, { autoEscape: false });

  fastify.get("/", (request, reply) => {
    reply.type("text/html");
    const content = renderToString(createElement(Application));

    return renderTemplate({ locale: "en", content }, Eta.config);
  });
}

export default ssr;

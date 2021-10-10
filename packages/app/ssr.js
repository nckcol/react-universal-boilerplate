import { createElement } from "react";
import { renderToString } from "react-dom/server";
import Application from "./Application";

async function ssr(fastify) {
  fastify.get("/", () => {
    return renderToString(createElement(Application));
  });
}

export default ssr;

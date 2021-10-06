import { createElement } from "react";
import { renderToString } from "react-dom/server";
import Application from "./Application";

function ssr(fastify) {
  fastify.get("/", () => {
    return renderToString(createElement(Application));
  });
}

export default ssr;

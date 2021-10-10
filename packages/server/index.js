import Fastify from "fastify";
import ssr from "@react-universal-boilerplate/app/ssr";

const fastify = Fastify();

fastify.register(ssr);

fastify.listen(3000, (error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("Server is running on http://localhost:3000");
});

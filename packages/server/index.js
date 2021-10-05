import Fastify from "fastify";

const fastify = Fastify();

fastify.get("/", () => {
  return "ok";
});

fastify.listen(3000, (error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("Server is running on http://localhost:3000");
});

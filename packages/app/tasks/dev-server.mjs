import Fastify from "fastify";
import ssr from "@react-universal-boilerplate/app/ssr";

const server = Fastify();
server.register(ssr);
server.listen(3001);

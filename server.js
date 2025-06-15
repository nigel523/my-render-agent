// Import necessary libraries
const path = require("path");
const fastify = require("fastify")({ logger: true });

// Register a plugin to serve static files (like index.html)
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", 
});

// A route for the homepage
fastify.get("/", function (request, reply) {
  // Send the index.html file
  reply.sendFile("index.html");
});

// Start the server
fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
});

const fp = require("fastify-plugin");
const cookie = require("@fastify/cookie");
const session = require("@fastify/session");

async function sessionPlugins(fastify, options) {
  await fastify.register(cookie);
  await fastify.register(session, {
    secret: process.env.SESSION_SECRET,
    cookie: { secure: true, maxAge: 86400000 },
    saveUninitialized: false,
    resave: false,
  });
}

// Export the plugin, marking it as a self-contained unit
module.exports = fp(sessionPlugins);

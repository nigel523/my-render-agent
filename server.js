const path = require("path");
const fastify = require("fastify")({ logger: true });
const { google } = require("googleapis");
const fastifyStatic = require("@fastify/static");
const appPlugins = require("./app-plugins.js");

const start = async () => {
  try {
    // --- PLUGIN REGISTRATION ---
    // Register our self-contained plugin file
    await fastify.register(appPlugins);
    // Register the static file server
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, "public"),
    });

    // --- GOOGLE API CONFIGURATION ---
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://my-render-agent.onrender.com/auth/google/callback"
    );
    const scopes = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive.readonly"];

    // --- ROUTES ---
    fastify.get("/", (req, reply) => reply.sendFile("index.html"));

    fastify.get("/auth/google", (req, reply) => {
      const url = oauth2Client.generateAuthUrl({ access_type: "offline", scope: scopes });
      reply.redirect(url);
    });

    fastify.get("/auth/google/callback", async (req, reply) => {
      try {
        const { code } = req.query;
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens;
        await req.session.save();
        reply.send("Authentication successful! You can close this tab and return to the homepage.");
      } catch (error) {
        fastify.log.error("Authentication failed:", error);
        reply.status(500).send("Authentication failed. Please try again.");
      }
    });

    // --- START THE SERVER ---
    await fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

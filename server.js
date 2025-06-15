// Import necessary libraries
const path = require("path");
const fastify = require("fastify")({ logger: true });
const { google } = require("googleapis");
const cookie = require("@fastify/cookie");
const session = require("@fastify/session");
const fastifyStatic = require("@fastify/static");

// This function will contain our entire server setup and start logic
const start = async () => {
  try {
    // --- PLUGIN REGISTRATION ---
    // We use 'await' to ensure each plugin finishes loading before the next one starts.
    await fastify.register(cookie);
    await fastify.register(session, {
      secret: process.env.SESSION_SECRET,
      cookie: { secure: true, maxAge: 86400000 }, // 1 day
      saveUninitialized: false,
      resave: false,
    });
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, "public"),
    });

    // --- GOOGLE API CONFIGURATION ---
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `https://my-render-agent.onrender.com/auth/google/callback` // IMPORTANT: Change this!
    );

    const scopes = [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/drive.readonly",
    ];

    // --- ROUTES ---
    fastify.get("/", (req, reply) => {
      reply.sendFile("index.html");
    });

    fastify.get("/auth/google", (req, reply) => {
      const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
      });
      reply.redirect(url);
    });

    fastify.get("/auth/google/callback", async (req, reply) => {
      try {
        const { code } = req.query;
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens;
        await req.session.save();
        reply.send(
          "Authentication successful! You can close this tab and return to the homepage."
        );
      } catch (error) {
        fastify.log.error("Authentication failed:", error);
        reply.status(500).send("Authentication failed. Please try again.");
      }
    });

    // --- START THE SERVER ---
    // This line will only run after all the 'await' calls above are complete.
    await fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" });
    
  } catch (err) {
    // If anything goes wrong during startup, log it and exit.
    fastify.log.error(err);
    process.exit(1);
  }
};

// Run the async function to start the server
start();

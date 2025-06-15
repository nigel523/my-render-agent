// Import necessary libraries
const path = require("path");
const fastify = require("fastify")({ logger: true });
const { google } = require("googleapis");
const cookie = require("@fastify/cookie");
const session = require("@fastify/session");

// --- CONFIGURATION ---

// 1. Register Fastify plugins, ensuring cookie is loaded before session
fastify.register(cookie).then(() => {
  fastify.register(session, {
    secret: process.env.SESSION_SECRET, // From Render environment variables
    cookie: { secure: true }, // 'true' is important for HTTPS
    saveUninitialized: false,
    resave: false,
  });
});

// 2. Configure the Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,    // From Render environment variables
  process.env.GOOGLE_CLIENT_SECRET, // From Render environment variables
  `https://my-render-agent.onrender.com/auth/google/callback` // IMPORTANT: Change this!
);

// 3. Define the permissions (scopes) we need from the user
const scopes = [
  "https://www.googleapis.com/auth/documents", // To read AND write docs
  "https://www.googleapis.com/auth/drive.readonly"  // To view file metadata
];

// --- ROUTES ---

// Serve the homepage
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});
fastify.get("/", (req, reply) => {
  reply.sendFile("index.html");
});

// Route 1: The Login Route
// This is where the user clicks to start the login process.
fastify.get("/auth/google", (req, reply) => {
  // Generate the special URL that redirects the user to Google's consent screen
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // 'offline' gets a "refresh token" for long-term access
    scope: scopes,
  });
  // Redirect the user's browser to that URL
  reply.redirect(url);
});

// Route 2: The Callback Route
// This is where Google sends the user back *after* they have given permission.
fastify.get("/auth/google/callback", async (req, reply) => {
  try {
    // Get the authorization 'code' from the URL query string
    const { code } = req.query;
    // Exchange that code for access tokens (the actual keys)
    const { tokens } = await oauth2Client.getToken(code);
    // Store these precious tokens in the user's session so we can remember them
    req.session.tokens = tokens;
    await req.session.save();
    // Send a success message
    reply.send("Authentication successful! You can close this tab and return to the homepage.");
  } catch (error) {
    fastify.log.error("Authentication failed:", error);
    reply.status(500).send("Authentication failed. Please try again.");
  }
});

// Start the server
fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});

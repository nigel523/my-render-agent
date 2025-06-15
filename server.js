const path = require("path");
const express = require("express");
const session = require("express-session");
const { google } = require("googleapis");

const app = express();
const port = process.env.PORT || 3000;

// --- MIDDLEWARE SETUP ---
// This is the Express way of setting up sessions.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, maxAge: 86400000 },
  })
);
// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// --- GOOGLE API CONFIGURATION ---
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://my-render-agent.onrender.com/auth/google/callback"
);
const scopes = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive.readonly"];

// --- ROUTES ---
app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({ access_type: "offline", scope: scopes });
  res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens; // Session saving is simpler in Express
    res.send("Authentication successful! You can close this tab and return to the homepage.");
  } catch (error) {
    console.error("Authentication failed:", error);
    res.status(500).send("Authentication failed. Please try again.");
  }
});

// --- START THE SERVER ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

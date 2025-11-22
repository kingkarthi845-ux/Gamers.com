const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = 3000;
const USERS_DB = path.join(__dirname, "users.json");

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(session({
  secret: "supersecretgamingkey",
  resave: false,
  saveUninitialized: false,
}));

// Helpers
function getUsers() {
  if (!fs.existsSync(USERS_DB)) return [];
  return JSON.parse(fs.readFileSync(USERS_DB, "utf8"));
}
function saveUsers(users) {
  fs.writeFileSync(USERS_DB, JSON.stringify(users, null, 2), "utf8");
}
function isAuthenticated(req) {
  return req.session && req.session.username;
}

// Routes
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.get("/games", (_req, res) => res.sendFile(path.join(__dirname, "public/games.html")));
app.get("/login", (_req, res) => res.sendFile(path.join(__dirname, "public/login.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(__dirname, "public/register.html")));
app.get("/dashboard", (req, res) => {
  if (!isAuthenticated(req)) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

// Registration
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.send("<script>alert('All fields are required.');window.history.back();</script>");
  let users = getUsers();
  if (users.find((u) => u.username === username))
    return res.send("<script>alert('Username already exists.');window.history.back();</script>");
  const hash = bcrypt.hashSync(password, 10);
  users.push({ username, password: hash });
  saveUsers(users);
  res.redirect("/login");
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  let users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.send("<script>alert('Invalid credentials.');window.history.back();</script>");
  req.session.username = username;
  res.redirect("/dashboard");
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Protected APK download
app.get("/download/:apk", (req, res) => {
  if (!isAuthenticated(req)) return res.redirect("/login");
  const apkName = req.params.apk;
  const apkPath = path.join(__dirname, "public/apk/", apkName);
  if (fs.existsSync(apkPath)) {
    res.download(apkPath);
  } else {
    res.status(404).send("APK not found.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
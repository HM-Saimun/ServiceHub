const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const db = require("./database/db");
const { clerkMiddleware } = require("@clerk/express");

dotenv.config();

const app = express();

// Import Routes
const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/services");
const bookingsRoutes = require("./routes/bookings");
const profileRoutes = require("./routes/profiles");

//Middleware setup
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set("trust proxy", true);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware());
}
app.use(
  cors({
    origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
    credentials: true,
  }),
);


 app.use(serviceRoutes);
 app.use(express.static("public"));


 //Use Routes.
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/book", bookingsRoutes);
app.use("/api/profiles", profileRoutes);

// Serve static files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);

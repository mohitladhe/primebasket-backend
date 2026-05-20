require("dotenv").config();
const express = require("express");
const cors = require("cors");

const cartRoutes = require("./routes/cart");
const productRoutes = require("./routes/products");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const addressesRoutes = require("./routes/addresses");
const ordersRoutes = require("./routes/orders");
const profileRoutes = require("./routes/profile");

const app = express();

// Production-ready CORS configuration
const allowedOrigins = [
  "https://primebasket-web.vercel.app",
  "http://localhost:5173", // Development
  "http://localhost:3000"   // Development
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "PrimeBasket Backend running" });
});

app.use("/api/cart", cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/profile", profileRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`${new Date().toISOString()} - Error:`, err.message);
  
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS policy violation" });
  }

  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message 
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port} | Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;

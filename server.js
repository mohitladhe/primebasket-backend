const express = require("express");
const cors = require("cors");

const cartRoutes = require("./routes/cart");
const productRoutes = require("./routes/products");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "PrimeBasket API running" });
});

app.use("/api/cart", cartRoutes);
app.use("/api/products", productRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "PrimeBasket API running" });
});

module.exports = app;
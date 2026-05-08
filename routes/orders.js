const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

// ---------------- VERIFY USER ----------------

const getUserFromToken = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
};

// ---------------- CHECKOUT DATA ----------------

router.get("/checkout-data", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // CART

    const cartRes = await fetch(
      `${process.env.API_BASE_URL}/api/cart/${user.id}`,
    );

    const cart = await cartRes.json();

    // ADDRESS

    const { data: address, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    res.json({
      cart,
      address,
    });
  } catch (err) {
    console.error("Checkout fetch error:", err);

    res.status(500).json({
      error: err.message || "Failed to fetch checkout data",
    });
  }
});

// ---------------- PLACE ORDER ----------------

router.post("/place-order", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { cart, address, total } = req.body;

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      items: JSON.parse(JSON.stringify(cart)),
      total,
      address: JSON.parse(JSON.stringify(address)),
      status: "placed",
    });

    if (error) {
      throw error;
    }

    // CLEAR CART

    await fetch(`${process.env.API_BASE_URL}/api/cart/clear/${user.id}`, {
      method: "DELETE",
    });

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("Place order error:", err);

    res.status(500).json({
      error: err.message || "Failed to place order",
    });
  }
});

// ---------------- GET USER ORDERS ----------------

router.get("/", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    res.json({
      orders: data || [],
    });
  } catch (err) {
    console.error("Fetch orders error:", err);

    res.status(500).json({
      error: err.message || "Failed to fetch orders",
    });
  }
});

module.exports = router;

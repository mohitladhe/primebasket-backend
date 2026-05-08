const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

// Middleware to verify user
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

// ---------------- FETCH ADDRESSES ----------------

router.get("/", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      addresses: data || [],
    });
  } catch (err) {
    console.error("Fetch addresses error:", err);

    res.status(500).json({
      error: err.message || "Failed to fetch addresses",
    });
  }
});

// ---------------- ADD ADDRESS ----------------

router.post("/", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { error } = await supabase.from("addresses").insert({
      ...req.body,
      user_id: user.id,
    });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("Add address error:", err);

    res.status(500).json({
      error: err.message || "Failed to add address",
    });
  }
});

// ---------------- UPDATE ADDRESS ----------------

router.put("/:id", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { error } = await supabase
      .from("addresses")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("Update address error:", err);

    res.status(500).json({
      error: err.message || "Failed to update address",
    });
  }
});

// ---------------- DELETE ADDRESS ----------------

router.delete("/:id", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("Delete address error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete address",
    });
  }
});

// ---------------- SET DEFAULT ----------------

router.put("/default/:id", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);

    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", req.params.id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("Set default address error:", err);

    res.status(500).json({
      error: err.message || "Failed to set default address",
    });
  }
});

module.exports = router;

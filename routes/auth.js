const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

// Get current user from access token
router.get("/session", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid or expired token",
      });
    }

    res.json({
      user,
    });
  } catch (err) {
    console.error("Session fetch error:", err);

    res.status(500).json({
      error: err.message || "Failed to fetch session",
    });
  }
});

// Check if current user is admin
router.get("/admin-status", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: "Invalid or expired token",
      });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json({
      isAdmin: profile?.role === "admin",
    });
  } catch (err) {
    console.error("Admin status error:", err);

    res.status(500).json({
      error: err.message || "Failed to check admin status",
    });
  }
});

// ---------------- SIGNUP ----------------

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("Signup error:", err);

    res.status(500).json({
      error: err.message || "Signup failed",
    });
  }
});

// ---------------- LOGIN ----------------

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        error: error.message,
      });
    }

    res.json({
      session: data.session,
      user: data.user,
    });
  } catch (err) {
    console.error("Login error:", err);

    res.status(500).json({
      error: err.message || "Login failed",
    });
  }
});

module.exports = router;

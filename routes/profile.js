const express = require("express");
const multer = require("multer");
const supabase = require("../config/supabase");

const router = express.Router();

// ---------------- AUTH ----------------

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

// ---------------- MULTER ----------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ---------------- FETCH PROFILE ----------------

router.get("/", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      profile: {
        full_name: data.full_name || "",
        email: data.email || user.email,
        phone: data.phone || "",
        avatar_url: data.avatar_url || "",
      },
    });
  } catch (err) {
    console.error("Profile fetch error:", err);

    res.status(500).json({
      error: err.message || "Failed to fetch profile",
    });
  }
});

// ---------------- UPDATE PROFILE ----------------

router.put("/", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { full_name, phone, avatar_url } = req.body;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
        avatar_url,
      })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("Profile update error:", err);

    res.status(500).json({
      error: err.message || "Failed to update profile",
    });
  }
});

// ---------------- AVATAR UPLOAD ----------------

router.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const fileExt = req.file.originalname.split(".").pop();

    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    res.json({
      avatar_url: data.publicUrl,
    });
  } catch (err) {
    console.error("Avatar upload error:", err);

    res.status(500).json({
      error: err.message || "Failed to upload avatar",
    });
  }
});

module.exports = router;

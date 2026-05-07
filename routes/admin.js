const express = require("express");
const multer = require("multer");
const supabase = require("../config/supabase");

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const checkAdmin = async (userId) => {
  if (!userId) return false;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile) return false;
  return profile.role === "admin";
};

router.get("/products", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch products error:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }

    res.json({ products: data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { userId } = req.body;

    console.log("Upload request received. UserId:", userId, "File:", req.file?.originalname);

    if (!req.file) {
      console.error("No file provided");
      return res.status(400).json({ error: "No image file uploaded" });
    }

    if (!userId) {
      console.error("No userId provided");
      return res.status(401).json({ error: "User ID is required" });
    }

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      console.error("User is not admin:", userId);
      return res.status(403).json({ error: "Not authorized - admin access required" });
    }

    const filePath = `products/${Date.now()}-${req.file.originalname}`;
    console.log("Uploading to Supabase at path:", filePath);

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ 
        error: uploadError.message || "Image upload failed",
        details: uploadError.toString()
      });
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    console.log("Upload successful. Public URL:", data.publicUrl);
    res.json({ publicUrl: data.publicUrl });
  } catch (err) {
    console.error("Upload server error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

router.post("/products", async (req, res) => {
  const { userId, ...product } = req.body;

  try {
    if (!(await checkAdmin(userId))) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        ...product,
        price: Number(product.price),
        old_price: product.old_price ? Number(product.old_price) : null,
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { userId, ...updates } = req.body;

  try {
    if (!(await checkAdmin(userId))) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updateData = {
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : undefined,
      old_price:
        updates.old_price !== undefined
          ? updates.old_price
            ? Number(updates.old_price)
            : null
          : undefined,
    };

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    if (!(await checkAdmin(userId))) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

/*
GET ALL PRODUCTS
*/
router.get("/", async (req, res) => {

  try {

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }

    res.json(data);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Server error" });

  }

});


/*
GET SINGLE PRODUCT
*/
router.get("/:id", async (req, res) => {

  const id = parseInt(req.params.id);

  try {

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(data);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Server error" });

  }

});


/*
ADD PRODUCT (ADMIN)
*/
router.post("/add", async (req, res) => {

  const { userId, ...product } = req.body;

  try {

    // 🔒 CHECK ADMIN ROLE
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // INSERT PRODUCT
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...product,
        price: Number(product.price),
        old_price: product.old_price ? Number(product.old_price) : null
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Insert failed" });

  }

});


module.exports = router;
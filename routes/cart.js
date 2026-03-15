const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");


/*
==============================
GET USER CART
==============================
*/

router.get("/:userId", async (req, res) => {

  try {

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const { data, error } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Fetch cart error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);

  } catch (err) {

    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });

  }

});


/*
==============================
ADD TO CART
==============================
*/

router.post("/add", async (req, res) => {

  try {

    const { userId, product } = req.body;

    if (!userId || !product || !product.id) {
      return res.status(400).json({
        error: "Invalid request body"
      });
    }

    const productId = Number(product.id);

    // check if item already exists

    const { data: existing, error: fetchError } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .limit(1);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return res.status(500).json(fetchError);
    }

    if (existing && existing.length > 0) {

      const item = existing[0];

      const { data, error } = await supabase
        .from("cart")
        .update({
          quantity: item.quantity + 1
        })
        .eq("id", item.id)
        .select()
        .single();

      if (error) {
        console.error("Update error:", error);
        return res.status(500).json(error);
      }

      return res.json(data);

    }

    // insert new product

    const { data, error } = await supabase
      .from("cart")
      .insert({
        user_id: userId,
        product_id: productId,
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: 1
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return res.status(500).json(error);
    }

    res.json(data);

  } catch (err) {

    console.error("Cart add failed:", err);
    res.status(500).json({
      error: "Cart add failed"
    });

  }

});


/*
==============================
REMOVE ITEM
==============================
*/

router.delete("/:userId/:productId", async (req, res) => {

  try {

    const { userId, productId } = req.params;

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", Number(productId));

    if (error) {
      console.error("Delete error:", error);
      return res.status(500).json(error);
    }

    res.json({
      message: "Item removed"
    });

  } catch (err) {

    console.error("Delete failed:", err);
    res.status(500).json({
      error: "Delete failed"
    });

  }

});


/*
==============================
CLEAR CART
==============================
*/

router.delete("/clear/:userId", async (req, res) => {

  try {

    const { userId } = req.params;

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Clear cart error:", error);
      return res.status(500).json(error);
    }

    res.json({
      message: "Cart cleared"
    });

  } catch (err) {

    console.error("Clear cart failed:", err);
    res.status(500).json({
      error: "Clear cart failed"
    });

  }

});


module.exports = router;
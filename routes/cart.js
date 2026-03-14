const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

/*
GET USER CART
*/

router.get("/:userId", async (req, res) => {

  const { userId } = req.params;

  const { data, error } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);

});


/*
ADD TO CART
*/

router.post("/add", async (req, res) => {

  const { userId, product } = req.body;

  const { data: existing } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", product.id)
    .single();

  if (existing) {

    const { data, error } = await supabase
      .from("cart")
      .update({
        quantity: existing.quantity + 1
      })
      .eq("id", existing.id)
      .select();

    if (error) return res.status(500).json(error);

    return res.json(data);

  }

  const { data, error } = await supabase
    .from("cart")
    .insert({
      user_id: userId,
      product_id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1
    })
    .select();

  if (error) return res.status(500).json(error);

  res.json(data);

});


/*
REMOVE ITEM
*/

router.delete("/:userId/:productId", async (req, res) => {

  const { userId, productId } = req.params;

  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) return res.status(500).json(error);

  res.json({ message: "Item removed" });

});


/*
CLEAR CART
*/

router.delete("/clear/:userId", async (req, res) => {

  const { userId } = req.params;

  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", userId);

  if (error) return res.status(500).json(error);

  res.json({ message: "Cart cleared" });

});


module.exports = router;

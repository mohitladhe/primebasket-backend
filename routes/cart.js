const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

/*
CART AUTHORIZATION
*/

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

/*
GET USER CART
*/

router.get("/", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { data, error } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      return res.status(500).json(error);
    }

    res.json(data);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch cart",
    });
  }
});

/*
ADD TO CART
*/

router.post("/add", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { product } = req.body;

    if (!product) {
      return res.status(400).json({
        error: "Product data required",
      });
    }

    const { data: existing } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    // Product already exists
    if (existing) {
      const { data, error } = await supabase
        .from("cart")
        .update({
          quantity: existing.quantity + 1,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json(error);
      }

      return res.json(data);
    }

    // Insert new product
    const { data, error } = await supabase
      .from("cart")
      .insert({
        user_id: user.id,
        product_id: Number(product.id),
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: 1,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json(error);
    }

    res.json(data);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Cart add failed",
    });
  }
});

/*
REMOVE ITEM
*/

router.delete("/:productId", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { productId } = req.params;

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", Number(productId));

    if (error) {
      return res.status(500).json(error);
    }

    res.json({
      message: "Item removed",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Delete failed",
    });
  }
});

/*
CLEAR CART
*/

router.delete("/clear/all", async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return res.status(500).json(error);
    }

    res.json({
      message: "Cart cleared",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Clear cart failed",
    });
  }
});

module.exports = router;

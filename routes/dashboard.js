const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

router.get("/summary", async (req, res) => {
  try {
    // 1. Fetch exact data from your specific tables
    const [
      { data: products, error: productsError },
      { data: profiles, error: profilesError },
      { data: orders, error: ordersError }
    ] = await Promise.all([
      supabase.from("products").select("id, category"),
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("orders").select("*").order("created_at", { ascending: false })
    ]);

    if (productsError || profilesError || ordersError) {
      throw new Error("Failed to fetch data from Supabase tables");
    }

    // 2. Base Metrics
    const totalOrders = orders.length;
    const activeProducts = products.length;
    const activeUsers = profiles.length;

    let totalRevenue = 0;
    const monthlySalesMap = {};
    const categorySalesMap = {};

    // 3. Map products to categories for quick lookup
    const productCategoryMap = {};
    products.forEach((p) => {
      productCategoryMap[p.id] = p.category || "Uncategorized";
    });

    // 4. Process Orders for Revenue, Charts, and Categories
    orders.forEach((order) => {
      // Add to Total Revenue
      const orderTotal = Number(order.total) || 0;
      totalRevenue += orderTotal;

      // Group by Month (e.g., "Jan", "Feb")
      const date = new Date(order.created_at);
      const monthStr = date.toLocaleString("en-US", { month: "short" });
      
      if (!monthlySalesMap[monthStr]) {
        monthlySalesMap[monthStr] = 0;
      }
      monthlySalesMap[monthStr] += orderTotal;

      // Group by Category (Parsing the JSONB items array)
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          // Attempt to find category from the item itself, or fallback to the product map
          const cat = item.category || productCategoryMap[item.product_id] || "Other";
          const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
          
          if (!categorySalesMap[cat]) categorySalesMap[cat] = 0;
          categorySalesMap[cat] += itemTotal;
        });
      }
    });

    // 5. Format Monthly Sales for the UI Chart
    // Ensure we have the last 7 months in order
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = new Date().getMonth();
    const monthlySales = [];
    
    // Get last 7 months including current
    for (let i = 6; i >= 0; i--) {
      let mIndex = currentMonthIndex - i;
      if (mIndex < 0) mIndex += 12;
      const mName = months[mIndex];
      
      // Calculate percentage relative to a baseline (for the CSS chart height)
      // Using 100,000 as a mock max for scale, or dynamic max
      const rawValue = monthlySalesMap[mName] || 0;
      monthlySales.push({
        month: mName,
        rawRevenue: rawValue,
        // Calculate percentage height for the CSS bar chart (max 100%)
        value: totalRevenue > 0 ? Math.min(100, Math.ceil((rawValue / totalRevenue) * 200)) : 0 
      });
    }

    // 6. Format Top Categories for the Progress Bars
    let topCategories = Object.keys(categorySalesMap).map((cat) => {
      const catTotal = categorySalesMap[cat];
      return {
        name: cat,
        rawSales: catTotal,
        percentage: totalRevenue > 0 ? Math.round((catTotal / totalRevenue) * 100) : 0
      };
    });
    // Sort highest to lowest and take top 5
    topCategories.sort((a, b) => b.percentage - a.percentage);
    topCategories = topCategories.slice(0, 5);

    // 7. Format Recent Transactions (Joining Order with Profile)
    const recentTransactions = orders.slice(0, 5).map((o) => {
      // Find the user profile that matches the order's user_id
      const userProfile = profiles.find((p) => p.id === o.user_id);
      
      return {
        id: `#ORD-${o.id.toString().substring(0, 8).toUpperCase()}`, // Use first 8 chars of UUID
        user: userProfile ? (userProfile.email || userProfile.full_name) : "Guest Customer",
        amount: Number(o.total) || 0,
        status: o.status || "placed",
        date: new Date(o.created_at).toLocaleDateString("en-IN", { 
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        }),
      };
    });

    // 8. Send the exact payload expected by the frontend
    res.json({
      stats: {
        totalRevenue,
        totalOrders,
        activeProducts,
        activeUsers,
        revenueTrend: "+0.0%", // Hardcoded trend as actual historical comparison requires much deeper SQL
        ordersTrend: "+0.0%"
      },
      monthlySales,
      topCategories,
      recentTransactions
    });

  } catch (err) {
    console.error("Dashboard API Error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

module.exports = router;
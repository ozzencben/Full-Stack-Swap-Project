require("dotenv").config();
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const { cloudinary, upload } = require("../config/cloudinary");
const fs = require("fs");
const { supabase } = require("../supabaseClient");

// ======================== CREATE PRODUCT ========================
router.post("/", auth, upload.array("images", 5), async (req, res, next) => {
  try {
    const { title, description, price, category_id, condition_id, status_id } =
      req.body;
    const user_id = req.user.id;

    if (
      !title ||
      !description ||
      !price ||
      !category_id ||
      !condition_id ||
      !status_id
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please include all fields" });
    }
    if (isNaN(price)) {
      return res
        .status(400)
        .json({ success: false, message: "Price must be a number" });
    }
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload at least one image" });
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "products",
      });
      uploadedImages.push(result.secure_url);
      await fs.promises.unlink(file.path);
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          title,
          description,
          price: parseFloat(price),
          category_id,
          condition_id,
          status_id,
          user_id,
          images: uploadedImages,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: data,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// ======================== GET ALL PRODUCTS (Explore) ========================
router.get("/", authOptional, async (req, res, next) => {
  try {
    const user_id = req.user?.id || null;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    let { category_id, condition_id, status_id, search } = req.query;
    const favorite = req.query.favorite === "true";

    let query = supabase.from("products").select("*");

    if (user_id) query = query.neq("user_id", user_id);
    if (category_id && category_id !== "all")
      query = query.eq("category_id", category_id);
    if (condition_id && condition_id !== "all")
      query = query.eq("condition_id", condition_id);
    if (status_id && status_id !== "all")
      query = query.eq("status_id", status_id);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      products: products || [],
      page,
      limit,
      total: count || products?.length || 0,
      totalPages: Math.ceil((count || products?.length || 0) / limit),
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// ======================== MY PRODUCTS ========================
router.get("/my-products", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, products: data });
  } catch (err) {
    next(err);
  }
});

// ======================== USER FAVORITES ========================
router.get("/favorites", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { data, error } = await supabase
      .from("favorites")
      .select("product_id, products(*)")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      favorites: data.map((f) => f.products),
    });
  } catch (err) {
    next(err);
  }
});

// ======================== META ROUTES ========================
router.get("/meta/categories", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) throw error;
    res.json({ success: true, categories: data });
  } catch (err) {
    next(err);
  }
});

router.get("/meta/conditions", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("product_conditions")
      .select("*");
    if (error) throw error;
    res.json({ success: true, conditions: data });
  } catch (err) {
    next(err);
  }
});

router.get("/meta/statuses", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("product_statuses").select("*");
    if (error) throw error;
    res.json({ success: true, statuses: data });
  } catch (err) {
    next(err);
  }
});

router.get("/meta/:id/is-favorite", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const product_id = req.params.id;
    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user_id)
      .eq("product_id", product_id);
    if (error) throw error;

    res.json({ success: true, isFavorite: data.length > 0 });
  } catch (err) {
    next(err);
  }
});

// ======================== FAVORITE & UNFAVORITE ========================
router.post("/:id/favorite", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const product_id = req.params.id;

    const { data: product, error: productErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (productErr || !product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (product.user_id === user_id)
      return res.status(403).json({
        success: false,
        message: "You cannot favorite your own product",
      });

    const { data: exists } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user_id)
      .eq("product_id", product_id);

    if (exists.length)
      return res.status(400).json({
        success: false,
        message: "Product already favorited",
      });

    const { error: insertErr } = await supabase
      .from("favorites")
      .insert([{ user_id, product_id }]);
    if (insertErr) throw insertErr;

    await supabase.rpc("increment_favorite_count", {
      product_id_param: product_id,
    });

    res.json({ success: true, message: "Product added to favorites" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/favorite", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const product_id = req.params.id;

    const { data: exists } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user_id)
      .eq("product_id", product_id);

    if (!exists.length)
      return res
        .status(400)
        .json({ success: false, message: "Product is not in favorites" });

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user_id)
      .eq("product_id", product_id);
    if (error) throw error;

    await supabase.rpc("decrement_favorite_count", {
      product_id_param: product_id,
    });

    res.json({ success: true, message: "Product removed from favorites" });
  } catch (err) {
    next(err);
  }
});

// ======================== SINGLE PRODUCT ========================
router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({ success: true, product: data });
  } catch (err) {
    next(err);
  }
});

// ======================== UPDATE PRODUCT ========================
router.put("/:id", auth, upload.array("images", 5), async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { title, description, price, category_id, condition_id, status_id } =
      req.body;

    const { data: product, error: productErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (productErr || !product)
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });

    let updatedImages = product.images;
    if (req.files && req.files.length > 0) {
      updatedImages = [];
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        updatedImages.push(result.secure_url);
        await fs.promises.unlink(file.path);
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from("products")
      .update({
        title,
        description,
        price: parseFloat(price),
        category_id,
        condition_id,
        status_id,
        images: updatedImages,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (err) {
    next(err);
  }
});

// ======================== DELETE PRODUCT ========================
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const { data: product, error: productErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (productErr || !product)
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this product",
      });

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

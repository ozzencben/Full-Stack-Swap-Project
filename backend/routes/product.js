require("dotenv").config();
const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const auth = require("../middleware/auth");
const { cloudinary, upload } = require("../config/cloudinary");
const fs = require("fs");
const authOptional = require("../middleware/authOptional");

// ======================== CREATE PRODUCT ========================
router.post("/", auth, upload.array("images", 5), async (req, res, next) => {
  try {
    const { title, description, price, category_id, condition_id, status_id } =
      req.body;
    const user_id = req.user.id;

    // Field validation
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

    // Cloudinary upload
    const uploadedImages = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "products",
      });
      uploadedImages.push(result.secure_url);
      await fs.promises.unlink(file.path);
    }

    // DB insert
    const query = await pool.query(
      `INSERT INTO products
      (title, description, price, category_id, condition_id, status_id, user_id, images)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        title,
        description,
        price,
        category_id,
        condition_id,
        status_id,
        user_id,
        uploadedImages,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: query.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// ======================== GET ALL PRODUCTS (Explore) ========================
router.get("/", authOptional, async (req, res, next) => {
  try {
    const user_id = req.user?.id || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const category_id = req.query.category_id || null;
    const condition_id = req.query.condition_id || null;
    const status_id = req.query.status_id || null;
    const search = req.query.search || null;
    const favorite = req.query.favorite === "true";

    let values = [];
    let index = 1;

    // Base WHERE clause
    let whereClause = "";
    let filters = [];

    if (user_id) {
      filters.push(`p.user_id != $${index++}`); // Kendi ürününü hariç tut
      values.push(user_id);
    }
    if (category_id) {
      filters.push(`p.category_id = $${index++}`);
      values.push(category_id);
    }
    if (condition_id) {
      filters.push(`p.condition_id = $${index++}`);
      values.push(condition_id);
    }
    if (status_id) {
      filters.push(`p.status_id = $${index++}`);
      values.push(status_id);
    }
    if (search) {
      filters.push(
        `(p.title ILIKE $${index} OR p.description ILIKE $${index})`
      );
      values.push(`%${search}%`);
    }

    if (filters.length) {
      whereClause = "WHERE " + filters.join(" AND ");
    }

    // Favorite join sadece favoriler için
    let joinClause = "";
    if (favorite && user_id) {
      joinClause = `INNER JOIN favorites f ON f.product_id = p.id AND f.user_id = $${index}`;
      values.push(user_id);
      index++;
    }

    // Total count
    const totalQuery = await pool.query(
      `SELECT COUNT(*) FROM products p ${joinClause} ${whereClause}`,
      values
    );
    const total = parseInt(totalQuery.rows[0].count);

    // Products
    const productsQuery = await pool.query(
      `SELECT p.* FROM products p ${joinClause} ${whereClause} ORDER BY p.created_at DESC LIMIT $${index} OFFSET $${
        index + 1
      }`,
      [...values, limit, offset]
    );

    res.json({
      success: true,
      products: productsQuery.rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// ======================== GET MY PRODUCTS ========================
router.get("/my-products", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const products = await pool.query(
      "SELECT * FROM products WHERE user_id=$1 ORDER BY created_at DESC",
      [user_id]
    );
    res.json({ success: true, products: products.rows });
  } catch (err) {
    next(err);
  }
});

// ======================== GET SINGLE PRODUCT ========================
router.get("/:id", async (req, res, next) => {
  try {
    const product = await pool.query("SELECT * FROM products WHERE id=$1", [
      req.params.id,
    ]);
    if (!product.rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, product: product.rows[0] });
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

    const productQuery = await pool.query(
      "SELECT * FROM products WHERE id=$1 AND user_id=$2",
      [id, user_id]
    );
    if (!productQuery.rows.length) {
      const exists = await pool.query("SELECT 1 FROM products WHERE id=$1", [
        id,
      ]);
      if (!exists.rows.length)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    let updatedImages = productQuery.rows[0].images;
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

    const updatedProductQuery = await pool.query(
      `UPDATE products SET title=$1, description=$2, price=$3, category_id=$4, condition_id=$5, status_id=$6, images=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [
        title,
        description,
        price,
        category_id,
        condition_id,
        status_id,
        updatedImages,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProductQuery.rows[0],
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

    const productQuery = await pool.query(
      "SELECT * FROM products WHERE id=$1 AND user_id=$2",
      [id, user_id]
    );
    if (!productQuery.rows.length) {
      const exists = await pool.query("SELECT 1 FROM products WHERE id=$1", [
        id,
      ]);
      if (!exists.rows.length)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this product",
      });
    }

    const product = productQuery.rows[0];

    // Delete Cloudinary images
    if (product.images && product.images.length > 0) {
      for (const url of product.images) {
        try {
          const parts = url.split("/");
          const fileName = parts[parts.length - 1];
          const public_id = `products/${fileName.split(".")[0]}`;
          await cloudinary.uploader.destroy(public_id);
        } catch (err) {
          console.error("Cloudinary delete error:", err);
        }
      }
    }

    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// ======================== FAVORITE PRODUCT ========================
router.post("/:id/favorite", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const product_id = req.params.id;

    // Ürünü getir
    const productQuery = await pool.query(
      "SELECT * FROM products WHERE id=$1",
      [product_id]
    );
    if (!productQuery.rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const product = productQuery.rows[0];

    // --- Kullanıcı kendi ürününü favorileyemez ---
    if (product.user_id === user_id) {
      return res.status(403).json({
        success: false,
        message: "You cannot favorite your own product",
      });
    }

    // Daha önce favori yapılmış mı kontrol
    const exists = await pool.query(
      "SELECT * FROM favorites WHERE user_id=$1 AND product_id=$2",
      [user_id, product_id]
    );
    if (exists.rows.length)
      return res
        .status(400)
        .json({ success: false, message: "Product already favorited" });

    // Favori ekleme
    await pool.query(
      "INSERT INTO favorites (user_id, product_id) VALUES ($1,$2)",
      [user_id, product_id]
    );

    // Favori sayısını güncelle
    await pool.query(
      "UPDATE products SET favorite_count=favorite_count+1 WHERE id=$1",
      [product_id]
    );

    res.json({ success: true, message: "Product added to favorites" });
  } catch (err) {
    next(err);
  }
});

// ======================== UNFAVORITE PRODUCT ========================
router.delete("/:id/favorite", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const product_id = req.params.id;

    const exists = await pool.query(
      "SELECT * FROM favorites WHERE user_id=$1 AND product_id=$2",
      [user_id, product_id]
    );
    if (!exists.rows.length)
      return res
        .status(400)
        .json({ success: false, message: "Product is not in favorites" });

    await pool.query(
      "DELETE FROM favorites WHERE user_id=$1 AND product_id=$2",
      [user_id, product_id]
    );
    await pool.query(
      "UPDATE products SET favorite_count=favorite_count-1 WHERE id=$1",
      [product_id]
    ); // decrement

    res.json({ success: true, message: "Product removed from favorites" });
  } catch (err) {
    next(err);
  }
});

router.get("/meta/:id/is-favorite", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const product_id = req.params.id;

    if (!user_id)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await pool.query(
      "SELECT 1 FROM favorites WHERE user_id=$1 AND product_id=$2",
      [user_id, product_id]
    );

    res.json({
      success: true,
      isFavorite: result.rows.length > 0,
    });
  } catch (err) {
    next(err);
  }
});

// ======================== GET USER FAVORITES ========================
router.get("/favorites", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const favoritesQuery = await pool.query(
      `SELECT p.* FROM products p INNER JOIN favorites f ON f.product_id = p.id WHERE f.user_id=$1 ORDER BY f.created_at DESC`,
      [user_id]
    );

    res.json({ success: true, favorites: favoritesQuery.rows });
  } catch (err) {
    next(err);
  }
});

// GET ALL CATEGORIES
router.get("/meta/categories", auth, async (req, res, next) => {
  try {
    const categories = await pool.query("SELECT * FROM categories");
    res.json({ success: true, categories: categories.rows });
  } catch (err) {
    next(err);
  }
});

// GET ALL CONDITIONS
router.get("/meta/conditions", auth, async (req, res, next) => {
  try {
    const conditions = await pool.query("SELECT * FROM product_conditions");
    res.json({ success: true, conditions: conditions.rows });
  } catch (err) {
    next(err);
  }
});

// GET ALL STATUSES
router.get("/meta/statuses", auth, async (req, res, next) => {
  try {
    const statuses = await pool.query("SELECT * FROM product_statuses");
    res.json({ success: true, statuses: statuses.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

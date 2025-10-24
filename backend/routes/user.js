const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const { cloudinary, upload } = require("../config/cloudinary");

require("dotenv").config();

// REGISTER
router.post("/register", async (req, res, next) => {
  const { username, firstname, lastname, email, password } = req.body;

  if (!username || !firstname || !lastname || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please include all fields" });
  }

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (username, firstname, lastname, email, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, firstname, lastname, email`,
      [username, firstname, lastname, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN
router.post("/login", async (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please include all fields" });
  }

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [identifier, identifier]
    );

    if (existingUser.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const user = existingUser.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH, {
      expiresIn: "7d",
    });

    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        profile_image: user.profile_image,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// REFRESH TOKEN
router.post("/refresh-token", async (req, res, next) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE refresh_token = $1",
      [token]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      user,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

// GET CURRENT USER
router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);
    res.status(200).json({ success: true, user: user.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    res.status(200).json({ success: true, user: user.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Profil resmi değiştirme
router.put(
  "/change-profile-image",
  auth,
  upload.single("profile_image"), // FormData key
  async (req, res, next) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });

      // Cloudinary'ye yükle
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_images",
        public_id: `${req.user.id}_${Date.now()}`,
        overwrite: true,
      });

      // DB'ye kaydet
      const user = await pool.query(
        "UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING *",
        [result.secure_url, req.user.id]
      );

      res.status(200).json({ success: true, user: user.rows[0] });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

// Profil güncelleme (username, email, vb)
router.put("/update-profile", auth, async (req, res, next) => {
  const { username, firstname, lastname, email } = req.body;
  try {
    const user = await pool.query(
      "UPDATE users SET username = $1, firstname = $2, lastname = $3, email = $4 WHERE id = $5 RETURNING *",
      [username, firstname, lastname, email, req.user.id]
    );
    res.status(200).json({ success: true, user: user.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post("/check-email", async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];

    if (user) {
      return res.status(200).json({
        success: false,
        message: "Email already exists",
        available: false,
      });
    }

    res.status(200).json({
      success: true,
      message: "Email is available",
      available: true,
    });
  } catch (error) {
    next(error);
  }
});

// ================= CHECK USERNAME =================
router.post("/check-username", async (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Username is required",
    });
  }

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    const user = userResult.rows[0];

    if (user) {
      return res.status(200).json({
        success: false,
        message: "Username already exists",
        available: false,
      });
    }

    res.status(200).json({
      success: true,
      message: "Username is available",
      available: true,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

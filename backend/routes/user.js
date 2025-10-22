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

module.exports = router;

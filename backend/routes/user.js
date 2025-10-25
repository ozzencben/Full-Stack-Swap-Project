const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");
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
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          username,
          firstname,
          lastname,
          email,
          password: hashedPassword,
        },
      ])
      .select("id, username, firstname, lastname, email")
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
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
    const { data: existingUser, error } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${identifier},username.eq.${identifier}`)
      .maybeSingle();

    if (!existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { id: existingUser.id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const refreshToken = jwt.sign(
      { id: existingUser.id },
      process.env.JWT_REFRESH,
      {
        expiresIn: "7d",
      }
    );

    // Refresh token Supabase'de güncelle
    await supabase
      .from("users")
      .update({ refresh_token: refreshToken })
      .eq("id", existingUser.id);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: existingUser.id,
        username: existingUser.username,
        firstname: existingUser.firstname,
        lastname: existingUser.lastname,
        email: existingUser.email,
        profile_image: existingUser.profile_image,
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
  if (!token)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("refresh_token", token)
      .maybeSingle();

    if (!user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

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
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// Profil resmi değiştirme
router.put(
  "/change-profile-image",
  auth,
  upload.single("profile_image"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_images",
        public_id: `${req.user.id}_${Date.now()}`,
        overwrite: true,
      });

      const { data: user, error } = await supabase
        .from("users")
        .update({ profile_image: result.secure_url })
        .eq("id", req.user.id)
        .select("*")
        .maybeSingle();

      res.status(200).json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }
);

// Profil güncelleme
router.put("/update-profile", auth, async (req, res, next) => {
  const { username, firstname, lastname, email } = req.body;
  try {
    const { data: user, error } = await supabase
      .from("users")
      .update({ username, firstname, lastname, email })
      .eq("id", req.user.id)
      .select("*")
      .maybeSingle();

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// CHECK EMAIL
router.post("/check-email", async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (user) {
      return res
        .status(200)
        .json({
          success: false,
          message: "Email already exists",
          available: false,
        });
    }

    res
      .status(200)
      .json({ success: true, message: "Email is available", available: true });
  } catch (error) {
    next(error);
  }
});

// CHECK USERNAME
router.post("/check-username", async (req, res, next) => {
  const { username } = req.body;
  if (!username)
    return res
      .status(400)
      .json({ success: false, message: "Username is required" });

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (user) {
      return res
        .status(200)
        .json({
          success: false,
          message: "Username already exists",
          available: false,
        });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Username is available",
        available: true,
      });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

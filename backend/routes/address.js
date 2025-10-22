const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { pool } = require("../config/db");

// Add a new address
router.post("/add", auth, async (req, res, next) => {
  
  const {
    title,
    full_name,
    phone_number,
    country,
    city,
    district,
    neighborhood,
    street,
    building_no,
    apartment_no,
    postal_code,
    additional_info,
  } = req.body;

  const user_id = req.user.id;
  console.log("REQ USER:", req.user);

  if (
    !title ||
    !full_name ||
    !phone_number ||
    !country ||
    !city ||
    !district ||
    !street ||
    !building_no ||
    !apartment_no ||
    !postal_code
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Please include all required fields" });
  }

  try {
    const newAddress = await pool.query(
      `INSERT INTO addresses 
      (user_id, title, full_name, phone_number, country, city, district, neighborhood, street, building_no, apartment_no, postal_code, additional_info)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        user_id,
        title,
        full_name,
        phone_number,
        country,
        city,
        district,
        neighborhood,
        street,
        building_no,
        apartment_no,
        postal_code,
        additional_info || "",
      ]
    );

    res.status(200).json({
      success: true,
      message: "Address added successfully",
      address: newAddress.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Get all addresses of user
router.get("/", auth, async (req, res, next) => {
  try {
    const addresses = await pool.query(
      "SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.status(200).json({ success: true, addresses: addresses.rows });
  } catch (error) {
    next(error);
  }
});

// Update an address
router.put("/update/:id", auth, async (req, res, next) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const {
    title,
    full_name,
    phone_number,
    country,
    city,
    district,
    neighborhood,
    street,
    building_no,
    apartment_no,
    postal_code,
    additional_info,
  } = req.body;

  try {
    const updatedAddress = await pool.query(
      `UPDATE addresses 
       SET title=$1, full_name=$2, phone_number=$3, country=$4, city=$5, 
           district=$6, neighborhood=$7, street=$8, building_no=$9, 
           apartment_no=$10, postal_code=$11, additional_info=$12
       WHERE id=$13 AND user_id=$14
       RETURNING *`,
      [
        title,
        full_name,
        phone_number,
        country,
        city,
        district,
        neighborhood,
        street,
        building_no,
        apartment_no,
        postal_code,
        additional_info,
        id,
        user_id,
      ]
    );

    if (!updatedAddress.rows[0])
      return res
        .status(404)
        .json({ success: false, message: "Address not found or unauthorized" });

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Delete an address
router.delete("/delete/:id", auth, async (req, res, next) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const deletedAddress = await pool.query(
      "DELETE FROM addresses WHERE id=$1 AND user_id=$2 RETURNING *",
      [id, user_id]
    );

    if (!deletedAddress.rows[0])
      return res
        .status(404)
        .json({ success: false, message: "Address not found or unauthorized" });

    // Eğer silinen adres primary id ise users tablosunu güncelle
    await pool.query(
      "UPDATE users SET primary_address_id=NULL WHERE id=$1 AND primary_address_id=$2",
      [user_id, id]
    );

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      address: deletedAddress.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Set primary address (users table)
router.post("/primary/:id", auth, async (req, res, next) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    // Adresin kullanıcıya ait olup olmadığını kontrol et
    const addressCheck = await pool.query(
      "SELECT * FROM addresses WHERE id=$1 AND user_id=$2",
      [id, user_id]
    );

    if (!addressCheck.rows[0])
      return res
        .status(404)
        .json({ success: false, message: "Address not found or unauthorized" });

    // users tablosuna primary_address_id olarak set et
    const updatedUser = await pool.query(
      "UPDATE users SET primary_address_id=$1 WHERE id=$2 RETURNING *",
      [id, user_id]
    );

    res.status(200).json({
      success: true,
      message: "Primary address set successfully",
      user: updatedUser.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

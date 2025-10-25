const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { supabase } = require("../supabaseClient");

// ======================== ADD ADDRESS ========================
router.post("/add", auth, async (req, res, next) => {
  try {
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
        .json({
          success: false,
          message: "Please include all required fields",
        });
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert([
        {
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
          additional_info: additional_info || "",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Address added successfully",
      address: data,
    });
  } catch (error) {
    console.error("Error in POST /add:", error);
    next(error);
  }
});

// ======================== GET USER ADDRESSES ========================
router.get("/", auth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, addresses: data });
  } catch (error) {
    console.error("Error in GET /addresses:", error);
    next(error);
  }
});

// ======================== UPDATE ADDRESS ========================
router.put("/update/:id", auth, async (req, res, next) => {
  try {
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

    const { data, error } = await supabase
      .from("addresses")
      .update({
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
      })
      .eq("id", id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) throw error;

    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Address not found or unauthorized" });

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: data,
    });
  } catch (error) {
    console.error("Error in PUT /update/:id:", error);
    next(error);
  }
});

// ======================== DELETE ADDRESS ========================
router.delete("/delete/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Adres sil
    const { data: deletedAddress, error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) throw error;

    if (!deletedAddress)
      return res
        .status(404)
        .json({ success: false, message: "Address not found or unauthorized" });

    // Eğer silinen adres primary id ise users tablosunu güncelle
    await supabase
      .from("users")
      .update({ primary_address_id: null })
      .eq("id", user_id)
      .eq("primary_address_id", id);

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      address: deletedAddress,
    });
  } catch (error) {
    console.error("Error in DELETE /delete/:id:", error);
    next(error);
  }
});

// ======================== SET PRIMARY ADDRESS ========================
router.post("/primary/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Adresin kullanıcıya ait olup olmadığını kontrol et
    const { data: addressCheck, error: checkError } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") throw checkError;

    if (!addressCheck)
      return res
        .status(404)
        .json({ success: false, message: "Address not found or unauthorized" });

    // users tablosuna primary_address_id olarak set et
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({ primary_address_id: id })
      .eq("id", user_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Primary address set successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in POST /primary/:id:", error);
    next(error);
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");
const auth = require("../middleware/auth");
const { onlineUsers, getIO } = require("../config/socket");
require("../middleware/error");

// ======================== CREATE NOTIFICATION ========================
router.post("/", auth, async (req, res, next) => {
  try {
    const { receiver_id, type, message, metadata } = req.body;
    const sender_id = req.user.id;

    let meta = null;
    if (metadata) {
      meta = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          sender_id,
          receiver_id,
          type,
          message,
          metadata: meta,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const notification = data;

    // Socket.io ile anlık bildirim gönder
    const io = getIO();
    const targetSocketId = onlineUsers.get(String(receiver_id));
    if (targetSocketId) {
      io.to(targetSocketId).emit("notification", notification);
    }

    res.status(201).json({
      success: true,
      notification,
      message: "Notification sent successfully",
    });
  } catch (err) {
    console.error("Error in POST /notifications:", err);
    next(err);
  }
});

// ======================== GET USER NOTIFICATIONS ========================
router.get("/", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { count, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId);

    if (countError) throw countError;

    res.json({
      success: true,
      notifications,
      total: count,
    });
  } catch (err) {
    console.error("Error in GET /notifications:", err);
    next(err);
  }
});

// ======================== MARK AS READ ========================
router.put("/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, notification: data });
  } catch (err) {
    console.error("Error in PUT /notifications/:id:", err);
    next(err);
  }
});

// ======================== DELETE NOTIFICATION ========================
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      notification: data,
      message: "Notification deleted",
    });
  } catch (err) {
    console.error("Error in DELETE /notifications/:id:", err);
    next(err);
  }
});

module.exports = router;

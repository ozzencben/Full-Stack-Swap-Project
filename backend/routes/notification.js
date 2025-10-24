const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const auth = require("../middleware/auth");
const { onlineUsers, getIO } = require("../config/socket");
require("../middleware/error");

// Bildirim oluştur ve gönder
router.post("/", auth, async (req, res, next) => {
  try {
    const { receiver_id, type, message, metadata } = req.body;
    const sender_id = req.user.id;

    // Metadata JSON parse (eğer string gelirse)
    let meta = null;
    if (metadata) {
      meta = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    }

    const newNotification = await pool.query(
      `INSERT INTO notifications (sender_id, receiver_id, type, message, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sender_id, receiver_id, type, message, meta]
    );

    const notification = newNotification.rows[0];

    // Socket.io ile anlık bildirim
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

// Kullanıcının bildirimlerini getir
router.get("/", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const notifications = await pool.query(
      `SELECT * FROM notifications
       WHERE receiver_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Toplam sayıyı da dönebilirsin, optional
    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE receiver_id = $1`,
      [userId]
    );
    const total = parseInt(totalRes.rows[0].count);

    res.json({ success: true, notifications: notifications.rows, total });
  } catch (err) {
    console.error("Error in GET /notifications:", err);
    next(err);
  }
});

// Bildirimi okundu olarak işaretle
router.put("/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, notification: result.rows[0] });
  } catch (err) {
    console.error("Error in PUT /notifications/:id:", err);
    next(err);
  }
});

// Bildirimi sil
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      notification: result.rows[0],
      message: "Notification deleted",
    });
  } catch (err) {
    console.error("Error in DELETE /notifications/:id:", err);
    next(err);
  }
});

module.exports = router;

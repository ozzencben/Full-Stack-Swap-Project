const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const auth = require("../middleware/auth");
const { getIO, onlineUsers } = require("../config/socket");

// 🔹 Kullanıcıya Gelen Trade Tekliflerini Getir
router.get("/received", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const trades = await pool.query(
      `SELECT 
         t.id,
         t.sender_id,
         t.receiver_id,
         t.offered_products,
         t.requested_products,
         t.offered_cash,
         t.requested_cash,
         t.status,
         t.message,
         t.created_at,
         u.username AS sender_username,
         u.profile_image AS sender_avatar
       FROM trades t
       JOIN users u ON t.sender_id = u.id
       WHERE t.receiver_id = $1
       ORDER BY t.created_at DESC`,
      [user_id]
    );

    res.json({
      success: true,
      count: trades.rowCount,
      trades: trades.rows,
    });
  } catch (err) {
    console.error("Error in GET /trades/received:", err);
    next(err);
  }
});

// 🔹 Trade Teklifi Oluştur
router.post("/", auth, async (req, res, next) => {
  try {
    const sender_id = req.user.id;
    const {
      receiver_id,
      offered_products,
      requested_products,
      offered_cash,
      requested_cash,
      message,
    } = req.body;

    const trade = await pool.query(
      `INSERT INTO trades
       (sender_id, receiver_id, offered_products, requested_products, offered_cash, requested_cash, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        sender_id,
        receiver_id,
        offered_products || [],
        requested_products || [],
        offered_cash || 0,
        requested_cash || 0,
        message || null,
      ]
    );

    const newTrade = trade.rows[0];

    // 📩 Bildirim oluştur ve gönder
    const notification = await pool.query(
      `INSERT INTO notifications (sender_id, receiver_id, type, message, metadata)
       VALUES ($1,$2,'trade_offer',$3,$4) RETURNING *`,
      [
        sender_id,
        receiver_id,
        "You have received a new trade offer.",
        { tradeId: newTrade.id },
      ]
    );

    const io = getIO();
    const targetSocketId = onlineUsers.get(String(receiver_id));
    if (targetSocketId) {
      io.to(targetSocketId).emit("notification", notification.rows[0]);
    }

    res.status(201).json({
      success: true,
      trade: newTrade,
      message: "Trade offer sent successfully",
    });
  } catch (err) {
    console.error("Error in POST /trades:", err);
    next(err);
  }
});

// 🔹 Teklif Detayı Getir
router.get("/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const tradeRes = await pool.query("SELECT * FROM trades WHERE id=$1", [id]);
    const trade = tradeRes.rows[0];
    if (!trade) {
      return res
        .status(404)
        .json({ success: false, message: "Trade not found" });
    }

    if (trade.sender_id !== user_id && trade.receiver_id !== user_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const usersRes = await pool.query(
      "SELECT id, username, profile_image FROM users WHERE id = $1 OR id = $2",
      [trade.sender_id, trade.receiver_id]
    );
    const sender = usersRes.rows.find((u) => u.id === trade.sender_id);
    const receiver = usersRes.rows.find((u) => u.id === trade.receiver_id);

    res.json({
      success: true,
      trade: { ...trade, sender, receiver },
    });
  } catch (err) {
    console.error("Error in GET /trades/:id:", err);
    next(err);
  }
});

// 🔹 Teklif Kabul Et
router.post("/:id/accept", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const receiver_id = req.user.id;

    const tradeRes = await pool.query("SELECT * FROM trades WHERE id=$1", [id]);
    const trade = tradeRes.rows[0];
    if (!trade)
      return res
        .status(404)
        .json({ success: false, message: "Trade not found" });
    if (trade.receiver_id !== receiver_id)
      return res
        .status(403)
        .json({ success: false, message: "You cannot accept this trade" });

    await pool.query("UPDATE trades SET status='accepted' WHERE id=$1", [id]);

    const notification = await pool.query(
      `INSERT INTO notifications (sender_id, receiver_id, type, message, metadata)
       VALUES ($1,$2,'trade_accepted',$3,$4) RETURNING *`,
      [
        receiver_id,
        trade.sender_id,
        "Your trade offer has been accepted!",
        { tradeId: id },
      ]
    );

    const io = getIO();
    const senderSocketId = onlineUsers.get(String(trade.sender_id));
    if (senderSocketId)
      io.to(senderSocketId).emit("notification", notification.rows[0]);

    res.json({ success: true, message: "Trade accepted successfully" });
  } catch (err) {
    console.error("Error in POST /trades/:id/accept:", err);
    next(err);
  }
});

// 🔹 Teklif Reddet
router.post("/:id/reject", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const receiver_id = req.user.id;

    const tradeRes = await pool.query("SELECT * FROM trades WHERE id=$1", [id]);
    const trade = tradeRes.rows[0];
    if (!trade)
      return res
        .status(404)
        .json({ success: false, message: "Trade not found" });
    if (trade.receiver_id !== receiver_id)
      return res
        .status(403)
        .json({ success: false, message: "You cannot reject this trade" });

    await pool.query("UPDATE trades SET status='rejected' WHERE id=$1", [id]);

    const notification = await pool.query(
      `INSERT INTO notifications (sender_id, receiver_id, type, message, metadata)
       VALUES ($1,$2,'trade_rejected',$3,$4) RETURNING *`,
      [
        receiver_id,
        trade.sender_id,
        "Your trade offer was rejected.",
        { tradeId: id },
      ]
    );

    const io = getIO();
    const senderSocketId = onlineUsers.get(String(trade.sender_id));
    if (senderSocketId)
      io.to(senderSocketId).emit("notification", notification.rows[0]);

    res.json({ success: true, message: "Trade rejected successfully" });
  } catch (err) {
    console.error("Error in POST /trades/:id/reject:", err);
    next(err);
  }
});

module.exports = router;

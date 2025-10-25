const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");
const auth = require("../middleware/auth");
const { getIO, onlineUsers } = require("../config/socket");

// 🔹 Kullanıcıya Gelen Trade Tekliflerini Getir
router.get("/received", auth, async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const { data: trades, error } = await supabase
      .from("trades")
      .select(
        `
        id,
        sender_id,
        receiver_id,
        offered_products,
        requested_products,
        offered_cash,
        requested_cash,
        status,
        message,
        created_at,
        users!trades_sender_id_fkey (
          username,
          profile_image
        )
        `
      )
      .eq("receiver_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = trades.map((t) => ({
      id: t.id,
      sender_id: t.sender_id,
      receiver_id: t.receiver_id,
      offered_products: t.offered_products,
      requested_products: t.requested_products,
      offered_cash: t.offered_cash,
      requested_cash: t.requested_cash,
      status: t.status,
      message: t.message,
      created_at: t.created_at,
      sender_username: t.users?.username,
      sender_avatar: t.users?.profile_image,
    }));

    res.json({ success: true, count: formatted.length, trades: formatted });
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

    const { data: trade, error } = await supabase
      .from("trades")
      .insert([
        {
          sender_id,
          receiver_id,
          offered_products: offered_products || [],
          requested_products: requested_products || [],
          offered_cash: offered_cash || 0,
          requested_cash: requested_cash || 0,
          message: message || null,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    // 📩 Bildirim oluştur ve gönder
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .insert([
        {
          sender_id,
          receiver_id,
          type: "trade_offer",
          message: "You have received a new trade offer.",
          metadata: { tradeId: trade.id },
        },
      ])
      .select("*")
      .single();

    if (notifError) throw notifError;

    const io = getIO();
    const targetSocketId = onlineUsers.get(String(receiver_id));
    if (targetSocketId) {
      io.to(targetSocketId).emit("notification", notification);
    }

    res.status(201).json({
      success: true,
      trade,
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

    const { data: trade, error } = await supabase
      .from("trades")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!trade)
      return res
        .status(404)
        .json({ success: false, message: "Trade not found" });

    if (trade.sender_id !== user_id && trade.receiver_id !== user_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, profile_image")
      .in("id", [trade.sender_id, trade.receiver_id]);

    if (usersError) throw usersError;

    const sender = users.find((u) => u.id === trade.sender_id);
    const receiver = users.find((u) => u.id === trade.receiver_id);

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

    const { data: trade, error } = await supabase
      .from("trades")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!trade)
      return res
        .status(404)
        .json({ success: false, message: "Trade not found" });
    if (trade.receiver_id !== receiver_id)
      return res
        .status(403)
        .json({ success: false, message: "You cannot accept this trade" });

    await supabase.from("trades").update({ status: "accepted" }).eq("id", id);

    const { data: notification } = await supabase
      .from("notifications")
      .insert([
        {
          sender_id: receiver_id,
          receiver_id: trade.sender_id,
          type: "trade_accepted",
          message: "Your trade offer has been accepted!",
          metadata: { tradeId: id },
        },
      ])
      .select("*")
      .single();

    const io = getIO();
    const senderSocketId = onlineUsers.get(String(trade.sender_id));
    if (senderSocketId)
      io.to(senderSocketId).emit("notification", notification);

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

    const { data: trade, error } = await supabase
      .from("trades")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!trade)
      return res
        .status(404)
        .json({ success: false, message: "Trade not found" });
    if (trade.receiver_id !== receiver_id)
      return res
        .status(403)
        .json({ success: false, message: "You cannot reject this trade" });

    await supabase.from("trades").update({ status: "rejected" }).eq("id", id);

    const { data: notification } = await supabase
      .from("notifications")
      .insert([
        {
          sender_id: receiver_id,
          receiver_id: trade.sender_id,
          type: "trade_rejected",
          message: "Your trade offer was rejected.",
          metadata: { tradeId: id },
        },
      ])
      .select("*")
      .single();

    const io = getIO();
    const senderSocketId = onlineUsers.get(String(trade.sender_id));
    if (senderSocketId)
      io.to(senderSocketId).emit("notification", notification);

    res.json({ success: true, message: "Trade rejected successfully" });
  } catch (err) {
    console.error("Error in POST /trades/:id/reject:", err);
    next(err);
  }
});

module.exports = router;

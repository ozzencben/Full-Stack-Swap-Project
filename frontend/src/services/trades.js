import api from "../api/api";

// Yeni trade oluştur
export const createTrade = async (data) => {
  const res = await api.post("/trades", data);
  return res.data;
};

// Teklifi kabul et
export const acceptTrade = async (tradeId) => {
  const res = await api.post(`/trades/${tradeId}/accept`);
  return res.data;
};

// Teklifi reddet
export const rejectTrade = async (tradeId) => {
  const res = await api.post(`/trades/${tradeId}/reject`);
  return res.data;
};

// Teklif detayını getir
export const getTradeById = async (tradeId) => {
  const res = await api.get(`/trades/${tradeId}`);
  return res.data;
};

// Kullanıcıya gelen trade tekliflerini getir
export const getReceivedTrades = async () => {
  const res = await api.get("/trades/received");
  return res.data;
};

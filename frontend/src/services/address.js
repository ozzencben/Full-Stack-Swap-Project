import api from "../api/api";

// 📦 Yeni adres ekle
export const addAddress = async (addressData) => {
  try {
    const res = await api.post("/addresses/add", addressData);
    return res.data;
  } catch (err) {
    throw err.response?.data || { success: false, message: "Error adding address" };
  }
};

// 📋 Kullanıcının tüm adreslerini getir
export const getAddresses = async () => {
  try {
    const res = await api.get("/addresses");
    return res.data;
  } catch (err) {
    throw err.response?.data || { success: false, message: "Error fetching addresses" };
  }
};

// ✏️ Adres güncelle
export const updateAddress = async (id, updatedData) => {
  try {
    const res = await api.put(`/addresses/update/${id}`, updatedData);
    return res.data;
  } catch (err) {
    throw err.response?.data || { success: false, message: "Error updating address" };
  }
};

// ❌ Adres sil
export const deleteAddress = async (id) => {
  try {
    const res = await api.delete(`/addresses/delete/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { success: false, message: "Error deleting address" };
  }
};

// 🌟 Bir adresi varsayılan (primary) yap
export const setPrimaryAddress = async (id) => {
  try {
    const res = await api.post(`/addresses/primary/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { success: false, message: "Error setting primary address" };
  }
};

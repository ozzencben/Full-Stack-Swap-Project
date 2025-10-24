import api from "../api/api";

// Yeni bildirim oluştur
export const sendNotification = async (notificationData) => {
  try {
    const res = await api.post("/notifications", notificationData);
    return res.data;
  } catch (err) {
    throw (
      err.response?.data || {
        success: false,
        message: "Error sending notification",
      }
    );
  }
};

// Tüm bildirimleri getir
export const getNotifications = async (page = 1, limit = 10) => {
  try {
    const res = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return res.data.notifications;
  } catch (err) {
    throw (
      err.response?.data || {
        success: false,
        message: "Error fetching notifications",
      }
    );
  }
};

// Bildirimi okundu yap
export const markNotificationAsRead = async (notificationId) => {
  try {
    const res = await api.put(`/notifications/${notificationId}`);
    return res.data;
  } catch (err) {
    throw (
      err.response?.data || {
        success: false,
        message: "Error marking notification as read",
      }
    );
  }
};

// Bildirimi sil
export const deleteNotification = async (notificationId) => {
  try {
    const res = await api.delete(`/notifications/${notificationId}`);
    return res.data;
  } catch (err) {
    throw (
      err.response?.data || {
        success: false,
        message: "Error deleting notification",
      }
    );
  }
};

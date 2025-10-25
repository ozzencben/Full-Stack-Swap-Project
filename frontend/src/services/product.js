import api from "../api/api";

// ======================== CREATE PRODUCT ========================
export const createProduct = async (formData) => {
  try {
    const res = await api.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Create product error:", error);
    throw error;
  }
};

// ======================== GET ALL PRODUCTS (Explore) ========================
export const getAllProducts = async (params = {}) => {
  try {
    // params: { page, limit, category_id, condition_id, status_id, search, favorite }
    const res = await api.get("/products", { params });
    return res.data;
  } catch (err) {
    // Hata detayını console'a bas
    console.error("Get all products error:", err.response?.data || err.message);

    // Hata mesajını frontend'de kullanmak için fırlat
    throw new Error(err.response?.data?.message || "Failed to fetch products");
  }
};

// ======================== GET MY PRODUCTS ========================
export const getMyProducts = async () => {
  const res = await api.get("/products/my-products");
  return res.data;
};

// ======================== GET SINGLE PRODUCT ========================
export const getProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

// ======================== UPDATE PRODUCT ========================
export const updateProduct = async (id, productData, images = []) => {
  const formData = new FormData();
  formData.append("title", productData.title);
  formData.append("description", productData.description);
  formData.append("price", productData.price);
  formData.append("category_id", productData.category_id);
  formData.append("condition_id", productData.condition_id);
  formData.append("status_id", productData.status_id);

  images.forEach((img) => {
    formData.append("images", img);
  });

  const res = await api.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ======================== DELETE PRODUCT ========================
export const deleteProduct = async (id) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};

// ======================== FAVORITE PRODUCT ========================
export const favoriteProduct = async (id) => {
  const res = await api.post(`/products/${id}/favorite`);
  return res.data;
};

// ======================== UNFAVORITE PRODUCT ========================
export const unfavoriteProduct = async (id) => {
  const res = await api.delete(`/products/${id}/favorite`);
  return res.data;
};

// ======================== Check FAVORITES ========================
export const checkFavorite = async (productId) => {
  try {
    const res = await api.get(`/products/meta/${productId}/is-favorite`);
    return res.data; // { success: true, isFavorite: true/false }
  } catch (err) {
    console.error("Check favorite error:", err);
    return { success: false, isFavorite: false };
  }
};

// ======================== GET USER FAVORITES ========================
export const getUserFavorites = async () => {
  const res = await api.get("/products/favorites");
  return res.data;
};

// ======================== GET ALL CATEGORIES ========================
export const getCategories = async () => {
  try {
    const res = await api.get("/products/meta/categories");
    return res.data.categories; // sadece categories array dönüyor
  } catch (err) {
    console.error("Error fetching categories:", err);
    throw err;
  }
};

// ======================== GET ALL CONDITIONS ========================
export const getConditions = async () => {
  try {
    const res = await api.get("/products/meta/conditions");
    return res.data.conditions;
  } catch (err) {
    console.error("Error fetching conditions:", err);
    throw err;
  }
};

// ======================== GET ALL STATUSES ========================
export const getStatuses = async () => {
  try {
    const res = await api.get("/products/meta/statuses");
    return res.data.statuses;
  } catch (err) {
    console.error("Error fetching statuses:", err);
    throw err;
  }
};

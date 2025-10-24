import api from "../api/api";

export const myProfile = async () => {
  try {
    const { data } = await api.get("/users/me");
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const { data } = await api.get(`/users/${id}`);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// FormData ile profil resmi değiştir
export const changeProfileImage = async (formData) => {
  try {
    const res = await api.put("/users/change-profile-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Profili güncelle
export const updateProfile = async ({
  username,
  firstname,
  lastname,
  email,
}) => {
  try {
    const res = await api.put("/users/update-profile", {
      username,
      firstname,
      lastname,
      email,
    });
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const checkUsername = async (username) => {
  try {
    const response = await api.post("/users/check-username", { username });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const checkEmail = async (email) => {
  try {
    const response = await api.post("/users/check-email", { email });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

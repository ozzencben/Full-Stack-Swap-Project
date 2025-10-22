import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/api";
import AuthContext from "./AuthContext";

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [accessToken, setAccessToken] = useState(() => {
    const storedAccessToken = localStorage.getItem("accessToken");
    return storedAccessToken || null;
  });

  const login = async (identifier, password) => {
    if (!identifier || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      const res = await api.post("/users/login", { identifier, password });
      const { accessToken, refreshToken, user } = res.data;

      setUser(user);
      setAccessToken(accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      navigate("/");
      toast.success("Login successful! Welcome!");
      return res.data;
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Login failed");
      return null;
    }
  };

  // -------------------- REGISTER --------------------
  const register = async (formData) => {
    const { email, password, firstname, lastname, username } = formData;
    if (!email || !password || !firstname || !lastname || !username) {
      toast.error("Please enter all required fields");
      return;
    }

    try {
      const res = await api.post("/users/register", formData);
      const { accessToken, refreshToken, user } = res.data;

      setUser(user);
      setAccessToken(accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      navigate("/login");
      if (res.data.success) toast.success(res.data.message);
      return res.data;
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration failed");
      return null;
    }
  };

  // -------------------- LOGOUT --------------------
  const logout = async () => {
    try {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      navigate("/login");
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Logout failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        accessToken,
        setAccessToken,
        navigate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

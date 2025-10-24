import { Route, Routes } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";

import Login from "../pages/login/Login";
import Register from "../pages/register/Register";

import Home from "../pages/home/Home";
import AddProduct from "../pages/product/add/AddProduct";
import ExplorePage from "../pages/product/explore/ExplorePage";
import MyProfile from "../pages/profile/my-profile/MyProfile";
import UserProfile from "../pages/profile/user-profile/UserProfile";
import Notification from "../pages/notifications/Notification";
import ProductDetail from "../pages/product/detail/ProductDetail";
import UpdateProduct from "../pages/product/update/UpdateProduct";

const AppRoute = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/user-profile/:id" element={<UserProfile />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/update-product/:id" element={<UpdateProduct />} />
      </Routes>
    </>
  );
};

export default AppRoute;

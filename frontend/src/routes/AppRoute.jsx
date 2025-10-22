import { Route, Routes } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";

import Login from "../pages/login/Login";
import Register from "../pages/register/Register";

import Home from "../pages/home/Home";
import AddProduct from "../pages/product/add/AddProduct";
import ExplorePage from "../pages/product/explore/ExplorePage";
import MyProfile from "../pages/profile/my-profile/MyProfile";

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
        <Route path="/add-product" element={<AddProduct />} />
      </Routes>
    </>
  );
};

export default AppRoute;

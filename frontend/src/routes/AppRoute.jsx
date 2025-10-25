import { Route, Routes } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";

import Login from "../pages/login/Login";
import Register from "../pages/register/Register";

import Home from "../pages/home/Home";
import Notification from "../pages/notifications/Notification";
import AddProduct from "../pages/product/add/AddProduct";
import ProductDetail from "../pages/product/detail/ProductDetail";
import ExplorePage from "../pages/product/explore/ExplorePage";
import MakeOffer from "../pages/product/offer/makeOffer/MakeOffer";
import OfferDetail from "../pages/product/offer/offerDetail/OfferDetail";
import UpdateProduct from "../pages/product/update/UpdateProduct";
import MyProfile from "../pages/profile/my-profile/MyProfile";
import UserProfile from "../pages/profile/user-profile/UserProfile";

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
        <Route path="/make-offer/:id" element={<MakeOffer />} />
        <Route path="/offer-detail/:id" element={<OfferDetail />} />
      </Routes>
    </>
  );
};

export default AppRoute;

import { useContext, useEffect, useState } from "react";
import { FaBookmark } from "react-icons/fa";
import { toast } from "sonner";
import AuthContext from "../../context/auth/AuthContext";
import {
  checkFavorite,
  favoriteProduct,
  unfavoriteProduct,
} from "../../services/product";
import SignIn from "../signIp/SignIn";
import "./ProductCard.css";

const ProductCard = ({ product, isAuthenticated }) => {
  const { user } = useContext(AuthContext);

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    const fetchFavorite = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await checkFavorite(product.id);
        if (res.success && res.isFavorite) setChecked(true);
      } catch (err) {
        console.error("Check favorite error:", err);
      }
    };
    fetchFavorite();
  }, [product.id, isAuthenticated]);

  const toggleFavoriteProduct = async () => {
    if (!isAuthenticated) {
      setShowSignIn(true);
      return;
    }

    if (product.user_id === user.id) {
      toast.error("You cannot favorite your own product");
      return;
    }

    if (loading) return;
    setLoading(true);
    try {
      if (checked) {
        await unfavoriteProduct(product.id);
      } else {
        await favoriteProduct(product.id);
      }
      setChecked((prev) => !prev);
    } catch (error) {
      console.error("Favorite product error:", error);
    } finally {
      setLoading(false);
    }
  };
  console.log("product", product);

  return (
    <div className="product-card-container">
      <img
        src={product.images[0]}
        alt={product.title}
        className="product-card-image"
        loading="lazy"
      />
      <div className="content-container">
        <div className="product-content">
          <p className="title">{product.title}</p>
          <p className="price">{product.price}</p>
        </div>
        <div className="bookmark-container">
          <label className="ui-bookmark">
            <input
              type="checkbox"
              checked={checked}
              onChange={toggleFavoriteProduct}
              disabled={loading}
            />
            <div className={`bookmark ${checked ? "active" : ""}`}>
              <FaBookmark size={24} />
            </div>
          </label>
        </div>
      </div>

      {showSignIn && <SignIn onClose={() => setShowSignIn(false)} />}
    </div>
  );
};

export default ProductCard;

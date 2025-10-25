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
  const { user, navigate } = useContext(AuthContext);

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

  return (
    <div className="swap-product-card">
      <div className="swap-image-box">
        <div className="swap-image-overlay">
          <p onClick={() => navigate(`/product/${product.id}`)}>View Details</p>
        </div>
        <img
          src={product.images[0]}
          alt={product.title}
          className="swap-product-card-image"
          loading="lazy"
        />
      </div>
      <div className="swap-content-container">
        <div className="swap-product-content">
          <p className="swap-title">{product.title}</p>
          <p className="swap-price">{product.price}</p>
        </div>
        <div className="swap-ui-bookmark">
          <label>
            <input
              type="checkbox"
              checked={checked}
              onChange={toggleFavoriteProduct}
              disabled={loading}
            />
            <div className={`swap-bookmark ${checked ? "active" : ""}`}>
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

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../../../components/loader/Loader";
import { getAllProducts } from "../../../services/product";
import { getUserById } from "../../../services/user";
import "./UserProfile.css";

const UserProfile = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userProducts, setUserProducts] = useState([]);

  // Kullanıcı bilgisini çek
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await getUserById(id);
        setUserProfile(response.user);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [id]);

  // Kullanıcının ürünlerini çek
  useEffect(() => {
    const fetchUserProducts = async () => {
      try {
        setLoading(true);
        const allProductsResponse = await getAllProducts();
        const allProducts = allProductsResponse.products || [];
        const filtered = allProducts.filter(
          (product) => product.user_id === id
        );
        setUserProducts(filtered);
      } catch (error) {
        console.error("Error fetching user products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProducts();
  }, [id]);

  if (loading) return <Loader />;
  if (!userProfile)
    return <div className="userprofile-container">User not found</div>;

  return (
    <div className="userprofile-container">
      <div className="userprofile-card">
        <div className="userprofile-header">
          <div className="userprofile-avatar">
            {userProfile.profile_image ? (
              <img src={userProfile.profile_image} alt={userProfile.username} />
            ) : (
              <div className="userprofile-avatar-placeholder">
                {userProfile.firstname[0]}
                {userProfile.lastname[0]}
              </div>
            )}
          </div>
          <div className="userprofile-info">
            <h2 className="userprofile-name">
              {userProfile.firstname} {userProfile.lastname}
            </h2>
            <p className="userprofile-username">@{userProfile.username}</p>
            <p className="userprofile-email">{userProfile.email}</p>
          </div>
        </div>

        <div className="userprofile-details">
          <h3>User Details</h3>
          <p>
            <strong>Registered:</strong>{" "}
            {new Date(userProfile.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="userprofile-actions">
          <Link to={`/message/${userProfile.id}`} className="userprofile-btn">
            Send Message
          </Link>
        </div>
      </div>

      <div className="userprofile-products">
        <h3>{userProfile.firstname}'s Products</h3>
        {userProducts.length === 0 ? (
          <p>No products to display yet.</p>
        ) : (
          <div className="products-grid">
            {userProducts.map((product) => (
              <Link
                to={`/product/${product.id}`}
                key={product.id}
                className="product-card"
              >
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="product-card-img"
                />
                <p className="product-card-title">{product.title}</p>
                <p className="product-card-price">${product.price}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

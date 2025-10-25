import { useContext, useEffect, useState } from "react";
import { CiCircleInfo } from "react-icons/ci";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import Loader from "../../../../components/loader/Loader";
import AuthContext from "../../../../context/auth/AuthContext";
import { getMyProducts, getProductById } from "../../../../services/product";
import { createTrade } from "../../../../services/trades";
import "./MakeOffer.css";

const MakeOffer = () => {
  const { id } = useParams();
  const { navigate } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState({});
  const [myProducts, setMyProducts] = useState([]);
  const [offeredProducts, setOfferedProducts] = useState([]);
  const [offeredCash, setOfferedCash] = useState("");
  const [requestedCash, setRequestedCash] = useState("");
  const [message, setMessage] = useState("");

  const handleToggleSelectProduct = (id) => {
    if (offeredProducts.includes(id)) {
      setOfferedProducts((prev) => prev.filter((item) => item !== id));
    } else {
      setOfferedProducts((prev) => [...prev, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      receiver_id: productData.user_id,
      offered_products: offeredProducts,
      requested_products: [id],
      offered_cash: Number(offeredCash) || 0,
      requested_cash: Number(requestedCash) || 0,
      message,
    };

    try {
      const res = await createTrade(data);
      console.log(res);
      toast.success("Trade offer sent successfully!");
      navigate(`/product/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create trade offer.");
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await getProductById(id);
        setProductData(res.product);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchMyProducts = async () => {
      try {
        setLoading(true);
        const res = await getMyProducts();
        setMyProducts(res.products);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchMyProducts();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="make-offer-container">
      <div
        className="requested-product-container"
        onClick={() => navigate(`/product/${id}`)}
      >
        <p className="requested-product-title">Requested Product</p>
        <img
          src={productData?.images?.[0] || "/placeholder.jpg"}
          alt="Product"
          className="requested-product-image"
          loading="lazy"
        />
        <div className="requested-product-content">
          <p className="product-title">{productData.title}</p>
          <p className="product-price">${productData.price}</p>
        </div>
      </div>

      <form className="make-offer-form" onSubmit={handleSubmit}>
        {/* Select product section */}
        <div className="make-form-item">
          <div className="form-info">
            <CiCircleInfo className="info-icon" />
            <p className="form-desc">
              Select one or more of your products to offer in this trade.
            </p>
          </div>

          <div className="my-products-container">
            {myProducts.map((product) => (
              <div
                key={product.id}
                className={`my-product-item ${
                  offeredProducts.includes(product.id) ? "selected" : ""
                }`}
                onClick={() => handleToggleSelectProduct(product.id)}
              >
                <img
                  src={product?.images?.[0] || "/placeholder.jpg"}
                  alt={product.title}
                  className="my-product-img"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Requested cash */}
        <div className="make-form-item">
          <div className="form-info">
            <CiCircleInfo className="info-icon" />
            <p className="form-desc">
              Enter the amount you are requesting in addition to the trade.
            </p>
          </div>
          <input
            type="number"
            placeholder="Requested Cash ($)"
            onChange={(e) => setRequestedCash(e.target.value)}
            value={requestedCash}
            className="input-field"
          />
        </div>

        {/* Offered cash */}
        <div className="make-form-item">
          <div className="form-info">
            <CiCircleInfo className="info-icon" />
            <p className="form-desc">
              Enter the amount you are offering in addition to the trade.
            </p>
          </div>
          <input
            type="number"
            placeholder="Offered Cash ($)"
            onChange={(e) => setOfferedCash(e.target.value)}
            value={offeredCash}
            className="input-field"
          />
        </div>

        {/* Message */}
        <div className="make-form-item">
          <div className="form-info">
            <CiCircleInfo className="info-icon" />
            <p className="form-desc">
              Add a message to personalize your offer (optional).
            </p>
          </div>
          <textarea
            rows="5"
            placeholder="Message..."
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            className="textarea-field"
          />
        </div>

        <div className="make-form-item">
          <button type="submit" className="offer-button">
            Send Offer
          </button>
        </div>
      </form>
    </div>
  );
};

export default MakeOffer;

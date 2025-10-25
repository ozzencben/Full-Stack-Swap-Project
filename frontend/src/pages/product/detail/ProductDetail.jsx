import { useContext, useEffect, useState } from "react";
import { MdModeEditOutline } from "react-icons/md";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import Loader from "../../../components/loader/Loader";
import AuthContext from "../../../context/auth/AuthContext";
import { getProductById } from "../../../services/product";
import { getUserById } from "../../../services/user";
import "./ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const { user, navigate } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [productDetail, setProductDetail] = useState({ images: [] });
  const [selectedImage, setSelectedImage] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [ownerData, setOwnerData] = useState({});

  const handleImageClick = (image, openOverlay = false) => {
    setSelectedImage(image);
    setOverlayOpen(openOverlay);
  };

  useEffect(() => {
    const fetchUserById = async () => {
      try {
        if (!productDetail?.user_id) return;
        const res = await getUserById(productDetail.user_id);
        setOwnerData(res.user);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserById();
  }, [productDetail]);

  useEffect(() => {
    const fetchProductById = async () => {
      try {
        setLoading(true);
        const res = await getProductById(id);
        setProductDetail(res.product);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchProductById();
  }, [id]);

  // Product geldiğinde selectedImage ilk resim olsun
  useEffect(() => {
    if (productDetail.images.length > 0 && !selectedImage) {
      setSelectedImage(productDetail.images[0]);
    }
  }, [productDetail, selectedImage]);

  if (loading) return <Loader />;

  return (
    <div className="product-detail-container">
      {user && user.id === productDetail.user_id && (
        <div className="edit-button-container">
          <button
            className="edit-button"
            onClick={() =>
              navigate(`/update-product/${id}`, {
                state: { product: productDetail },
              })
            }
          >
            <MdModeEditOutline className="edit-svgIcon" />
          </button>
        </div>
      )}
      <div className="detail-wrapper">
        <div className="detail-images-gallery">
          {/* Overlay büyük resim */}
          {overlayOpen && selectedImage && (
            <div
              className="big-image-overlay"
              onClick={() => setOverlayOpen(false)}
            >
              <img
                src={selectedImage}
                alt="Big Image"
                className="big-image"
                loading="lazy"
              />
            </div>
          )}

          {/* Büyük resim kutusu */}
          {selectedImage && (
            <div className="big-image-box">
              <img
                src={selectedImage}
                alt="Big Image"
                className="big-image"
                onClick={() => setOverlayOpen(true)}
                loading="lazy"
              />
            </div>
          )}

          {/* Thumbnail önizlemeleri */}
          <div className="detail-image-previews">
            {productDetail.images.map((image, index) => (
              <div
                className="preview-item"
                key={index}
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image}
                  alt={`Image ${index}`}
                  className={`detail-preview ${
                    image === selectedImage ? "active" : ""
                  }`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Ürün Detayları */}
        <div className="detail-content">
          <h2 className="detail-title">{productDetail.title}</h2>
          <p className="detail-description">{productDetail.description}</p>
          <p className="detail-price">${productDetail.price}</p>

          {user && user.id !== productDetail.user_id && (
            <>
              <div
                className="product-owner-card"
                onClick={() => navigate(`/user-profile/${ownerData.id}`)}
              >
                <div className="product-owner-left">
                  <div className="owner-avatar">
                    {ownerData?.profile_image ? (
                      <img
                        src={ownerData.profile_image}
                        alt="Owner"
                        loading="lazy"
                      />
                    ) : (
                      <div className="owner-avatar-placeholder">
                        <span>{ownerData.firstname?.[0] || "?"}</span>
                        <span>{ownerData.lastname?.[0] || ""}</span>
                      </div>
                    )}
                  </div>
                  <div className="owner-text">
                    <h4 className="owner-fullname">
                      {ownerData.firstname} {ownerData.lastname}
                    </h4>
                    <p className="owner-username">@{ownerData.username}</p>
                  </div>
                </div>

                <div className="product-owner-actions">
                  <button
                    className="owner-message-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info("Messaging feature coming soon!");
                    }}
                  >
                    Message
                  </button>
                </div>
              </div>

              <div className="make-offer-container">
                <button
                  className="button"
                  onClick={() => navigate(`/make-offer/${id}`)}
                >
                  <span className="button_lg">
                    <span className="button_sl"></span>
                    <span className="button_text">Make an offer</span>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

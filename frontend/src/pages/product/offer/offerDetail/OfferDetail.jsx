import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../../../../components/loader/Loader";
import { getProductById } from "../../../../services/product";
import {
  acceptTrade,
  getTradeById,
  rejectTrade,
} from "../../../../services/trades";
import "./OfferDetail.css";

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [tradeData, setTradeData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchTradeData = async () => {
      try {
        setLoading(true);
        const res = await getTradeById(id);
        const trade = res.trade;

        const offeredProducts = await Promise.all(
          (trade.offered_products || []).map((pid) => getProductById(pid))
        );

        const requestedProducts = await Promise.all(
          (trade.requested_products || []).map((pid) => getProductById(pid))
        );

        setTradeData({
          ...trade,
          offered_products_details: offeredProducts,
          requested_products_details: requestedProducts,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeData();
  }, [id]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      await acceptTrade(id);
      setTradeData({ ...tradeData, status: "accepted" });
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await rejectTrade(id);
      setTradeData({ ...tradeData, status: "rejected" });
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !tradeData) return <Loader />;

  const {
    sender,
    receiver,
    offered_products_details,
    requested_products_details,
    offered_cash,
    requested_cash,
    status,
    message,
  } = tradeData;

  return (
    <div className="offer-detail-container">
      <h2 className="offer-detail-title">Trade Offer Details</h2>

      <div className="trade-info">
        <div className="trade-users">
          <p
            className="sender-name"
            onClick={() => navigate(`/user-profile/${sender.id}`)}
          >
            <strong>Sender:</strong> {sender?.username}
          </p>
          <p>
            <strong>Receiver:</strong> {receiver?.username}
          </p>
        </div>
        <p className="trade-message">{message || "No message"}</p>
      </div>

      <div className="trade-products">
        {/* Offered Products */}
        <div className="product-section">
          <h3>Offered Products</h3>
          {offered_products_details?.length > 0 ? (
            <div className="product-list">
              {offered_products_details.map((p, idx) => (
                <div
                  onClick={() => navigate(`/product/${p.product.id}`)}
                  className="product-card"
                  key={idx}
                >
                  {p.product.images && (
                    <img src={p.product.images[0]} alt={p.product.title} />
                  )}
                  <p className="product-name">{p.product.title}</p>
                  <p className="product-price">${p.product.price}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No products offered</p>
          )}
          {offered_cash > 0 && (
            <p className="cash-info">Cash Offered: ${offered_cash}</p>
          )}
        </div>

        {/* Requested Products */}
        <div className="product-section">
          <h3>Requested Products</h3>
          {requested_products_details?.length > 0 ? (
            <div className="product-list">
              {requested_products_details.map((p, idx) => (
                <div
                  className="product-card"
                  key={idx}
                  onClick={() => navigate(`/product/${p.product.id}`)}
                >
                  {p.product.images && (
                    <img src={p.product.images[0]} alt={p.product.title} />
                  )}
                  <p className="product-name">{p.product.title}</p>
                  <p className="product-price">${p.product.price}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No products requested</p>
          )}
          {requested_cash > 0 && (
            <p className="cash-info">Cash Requested: ${requested_cash}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="trade-actions">
        {status === "pending" ? (
          <>
            <button
              className="accept-btn"
              onClick={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Accept"}
            </button>
            <button
              className="reject-btn"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Reject"}
            </button>
          </>
        ) : (
          <p className={`trade-status ${status}`}>Trade {status}</p>
        )}
      </div>
    </div>
  );
};

export default OfferDetail;

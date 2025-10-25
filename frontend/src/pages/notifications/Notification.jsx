import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { useEffect, useState } from "react";
import { CiUser } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/loader/Loader";
import {
  getNotifications,
  markNotificationAsRead,
} from "../../services/notification";
import { getUserById } from "../../services/user";
import "./Notification.css";

const Notification = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 10; // sayfa başına gösterilecek bildirim sayısı

  const fetchNotificationsPage = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await getNotifications(pageNumber, PAGE_SIZE); // backend page & limit destekli

      const notificationsWithSender = await Promise.all(
        res.map(async (notification) => {
          const sender = await getUserById(notification.sender_id);

          // metadata parse
          const metadata =
            typeof notification.metadata === "string"
              ? JSON.parse(notification.metadata)
              : notification.metadata;

          return {
            ...notification,
            senderUser: sender,
            metadata,
          };
        })
      );

      if (notificationsWithSender.length < PAGE_SIZE) setHasMore(false);

      setNotifications((prev) =>
        pageNumber === 1
          ? notificationsWithSender
          : [...prev, ...notificationsWithSender]
      );

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleClick = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);

      const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      );

      setNotifications(updatedNotifications);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotificationsPage(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotificationsPage(nextPage);
  };

  if (loading && page === 1) return <Loader />;

  return (
    <div className="notification-container">
      <div className="notifications">
        {notifications?.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <div
                className={`notification-item ${
                  notification.is_read ? "" : "unread"
                }`}
                onClick={() => handleClick(notification.id)}
                key={notification.id}
              >
                <div className="item-box">
                  <div className="sender-box">
                    <div className="sender-profile-image">
                      {notification.senderUser.user?.profile_image ? (
                        <img
                          src={notification.senderUser.user.profile_image}
                          alt="Profile"
                          className="sender-user-img"
                        />
                      ) : (
                        <CiUser className="sender-user-icon" />
                      )}
                    </div>
                    <p
                      className="sender-username"
                      onClick={() =>
                        navigate(
                          `/user-profile/${notification.senderUser.user.id}`
                        )
                      }
                    >
                      {notification.senderUser.user?.username}
                    </p>
                  </div>

                  {notification.type === "favorite" ? (
                    <p
                      className="notification-message"
                      onClick={() =>
                        navigate(`/product/${notification.metadata.productId}`)
                      }
                    >
                      {notification.message}
                    </p>
                  ) : notification.metadata?.tradeId ? (
                    <p
                      className="notification-message"
                      onClick={() =>
                        navigate(
                          `/offer-detail/${notification.metadata.tradeId}`
                        )
                      }
                    >
                      {notification.message}
                    </p>
                  ) : (
                    <p className="notification-message">
                      {notification.message}
                    </p>
                  )}
                </div>

                <p className="notification-time">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    locale: enUS,
                    addSuffix: true,
                  })}
                </p>
              </div>
            ))}

            {hasMore && (
              <div className="load-more-container">
                <button onClick={handleLoadMore} disabled={loading}>
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="notification-item">
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useSocket } from "../context/SocketContext/SocketContext";
import { Card, Spinner, Alert, Button } from "react-bootstrap";
import { BellFill } from "react-bootstrap-icons";
import { useAuth } from "../context/AuthContext";
import "./NotificationDropdown.css";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import notificationSound from '/notification-sound.mp3'; // Assuming you have a notification sound file
import notificationIcon from '/notification-icon.png'; // Assuming you have a notification icon
const API_URL = "http://localhost:5000/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const { token } = useAuth();
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const { socket } = useSocket() || {};

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        setNotifications(res.data.notifications);
      } else {
        console.error("Failed to fetch notifications:", res.data.message);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (!socket) return;

  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);

    // 🔊 Play notification sound
    const sound = new Audio(notificationSound); // assuming this is imported or defined
    sound.play().catch(err => console.warn("Sound play failed", err));

    // 🔔 Show browser push-style notification
    if (Notification.permission === "granted") {
      const nativeNotification = new Notification("📢 New Notification", {
        body: notification.message,
        icon: notificationIcon, // Customize your icon path here
        tag: notification.id, // unique tag to prevent duplicates
      });

      nativeNotification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        window.location.href = "/dashboard"; // or use a dynamic route if needed
      };
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("📢 New Notification", {
            body: notification.message,
            icon:notificationIcon,
            tag: notification.id,
          });
        }
      });
    }
  };

  socket.on("newNotification", handleNewNotification);

  return () => {
    socket.off("newNotification", handleNewNotification);
  };
}, [socket]);



  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const toggleNotificationList = () => setShowList((prev) => !prev);

  const markAllAsRead = async () => {
    try {
      const res = await axios.put(`${API_URL}/notifications/read-all`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(res.data.message);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/read/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
      navigate("/dashboard"); // Redirect to dashboard after marking as read
      setShowList(false); // Close the dropdown
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(
    (n) => n.is_read === "unread"
  ).length;

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <Button className="notify-button" onClick={toggleNotificationList}>
        <BellFill size={20} />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </Button>

      {showList && (
        <div className="notification-dropdown">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="dropdown-title m-0">Notifications</h6>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="link"
                className="p-0 text-decoration-none"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>

          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : notifications.length === 0 ? (
            <Alert variant="info" className="p-2 m-0">
              No notifications yet.
            </Alert>
          ) : (
            notifications.map((n) => (
              <Card
                key={n.id}
                className={`notification-card ${
                  n.is_read === "unread" ? "unread" : "read"
                }`}
                onClick={() => markAsRead(n.id)}
                style={{ cursor: "pointer" }}
              >
                <Card.Text className="mb-1">{n.message}</Card.Text>
                <small className="textmuted">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                  })}
                </small>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;

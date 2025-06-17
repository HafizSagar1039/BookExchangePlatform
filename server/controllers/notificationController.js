import db from "../config/db.js";

// Get all notifications for the authenticated user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const [notifications] = await db.query(
      `SELECT id, message, is_read, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      notifications: notifications,
      message: "Notifications fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Mark a single notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const notificationId = req.params.id;

    const [result] = await db.query(
      `UPDATE notifications 
       SET is_read = 'read' 
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await db.query(
      `UPDATE notifications 
       SET is_read = 'read' 
       WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, message: "All notifications marked as read" });

  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};

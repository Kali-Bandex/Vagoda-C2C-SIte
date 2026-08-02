const Notification = require("../models/Notification");

// Helper used by other controllers to create a notification
const createNotification = async ({ userId, type, title, body, fromUser, link }) => {
  try {
    await Notification.create({ userId, type, title, body, fromUser, link: link || "" });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};

// @desc  Get all notifications for current user (unread first)
// @route GET /api/notifications
// @access Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ read: 1, createdAt: -1 })
      .limit(40)
      .populate("fromUser", "name avatar companyName")
      .lean();

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark a notification as read
// @route PATCH /api/notifications/:id/read
// @access Private
const markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true }
    );
    res.json({ message: "Marked as read" });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark all notifications as read
// @route PATCH /api/notifications/read-all
// @access Private
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createNotification, getNotifications, markRead, markAllRead };

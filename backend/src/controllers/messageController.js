const Message = require("../models/Message");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

// @desc  Send a message
// @route POST /api/messages
// @access Private
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text, productId } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ message: "receiverId and text are required" });
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      productId: productId || undefined,
      text: text.trim(),
    });

    const populated = await Message.findById(message._id)
      .populate("senderId", "name avatar role companyName")
      .populate("receiverId", "name avatar role companyName")
      .lean();

    // Create notification for the receiver (works for both Buyer -> Seller and Seller -> Buyer)
    const senderName = req.user.companyName || req.user.name;
    await createNotification({
      userId: receiverId,
      type: "message",
      title: `New message from ${senderName}`,
      body: text.trim().slice(0, 100),
      fromUser: req.user._id,
      link: `/app/message?userId=${req.user._id.toString()}&userName=${encodeURIComponent(senderName)}&userAvatar=${encodeURIComponent(req.user.avatar || "")}`,
    });

    res.status(201).json({ message: populated });
  } catch (error) {
    next(error);
  }
};

// @desc  Get chat thread with a specific user
// @route GET /api/messages/thread/:userId
// @access Private
const getThread = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name avatar companyName")
      .populate("receiverId", "name avatar companyName")
      .lean();

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all active chat conversations for current user
// @route GET /api/messages/conversations
// @access Private
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Find all messages involving current user
    const messages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "name avatar role companyName")
      .populate("receiverId", "name avatar role companyName")
      .lean();

    // Group by the other participant
    const conversationMap = new Map();

    for (const msg of messages) {
      const isSender = msg.senderId._id.toString() === currentUserId.toString();
      const otherUser = isSender ? msg.receiverId : msg.senderId;

      if (!otherUser) continue;
      const otherId = otherUser._id.toString();

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          user: {
            id: otherUser._id.toString(),
            name: otherUser.companyName || otherUser.name,
            avatar: otherUser.avatar || "",
            role: otherUser.role,
          },
          lastMessage: msg.text,
          updatedAt: msg.createdAt,
        });
      }
    }

    const conversations = Array.from(conversationMap.values());
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getThread,
  getConversations,
};

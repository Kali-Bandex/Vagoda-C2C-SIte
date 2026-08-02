const express = require("express");
const {
  sendMessage,
  getThread,
  getConversations,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/conversations", protect, getConversations);
router.get("/thread/:userId", protect, getThread);

module.exports = router;

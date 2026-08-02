const express = require("express");
const { signup, login, refresh, logout, getMe, updateProfile, getUserById } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.get("/users/:id", getUserById);

module.exports = router;

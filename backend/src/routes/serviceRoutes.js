const express = require("express");
const multer = require("multer");
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  uploadServiceImage,
} = require("../controllers/serviceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for service images"), false);
    }
  },
});

router.get("/", getServices);
router.get("/:id", getServiceById);
router.post("/", protect, createService);
router.put("/:id", protect, updateService);
router.delete("/:id", protect, deleteService);
router.post("/upload-image", protect, upload.single("file"), uploadServiceImage);

module.exports = router;

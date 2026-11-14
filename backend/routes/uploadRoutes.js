const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect, adminOnly } = require("../middleware/auth");

// POST /api/uploads  (admin only) → { urls: ["/uploads/....jpg", ...] }
router.post("/", protect, adminOnly, (req, res) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Each image must be 5MB or smaller"
          : err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT"
          ? "You can upload at most 5 images at a time"
          : err.message;
      return res.status(400).json({ message });
    }
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No images uploaded" });

    res.status(201).json({ urls: req.files.map((f) => `/uploads/${f.filename}`) });
  });
});

module.exports = router;
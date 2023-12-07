const express = require("express");

const router = express.Router();
const ShareController = require("../app/controllers/User/ShareController");

// Lấy những bài viết của user theo id
router.get("/:userId/post", ShareController.getSharesByUserId);

// Lấy thông tin chi tiết của 1 bài viết
router.get("/:shareId", ShareController.getShareDetailsByPostId);

// Tạo bài viết
router.post("/create", ShareController.createShareByUser);

// Xóa bài viết
router.put("/delete/:shareId", ShareController.deleteShareByUser);

// Cập nhật bài viết
router.put("/update/:shareId", ShareController.updatePostByUser);

module.exports = router;

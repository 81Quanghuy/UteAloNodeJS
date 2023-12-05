const express = require("express");

const router = express.Router();
const LikePostController = require("../app/controllers/User/LikePostController");

// Lấy danh sách yêu thích của 1 bài viết
router.get("/:postId", LikePostController.getLikesOfPost);

// Thích và bỏ thích bài viết
router.post("/toggleLike/:postId", LikePostController.toggleLikePost);

// Kiểm tra xem user đã thích bài viết chưa
router.get("/checkUser/:postId", LikePostController.checkUserLikePost);

module.exports = router;

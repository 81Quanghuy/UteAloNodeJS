const express = require("express");

const router = express.Router();
const LikeCommentController = require("../app/controllers/User/LikeCommentController");

// Lấy danh sách yêu thích của 1 bài viết
router.get("/:commentId", LikeCommentController.getLikesOfComment);

// Thích và bỏ thích bài viết
router.post("/toggleLike/:commentId", LikeCommentController.toggleLikeComment);

// Kiểm tra xem user đã thích bài viết chưa
router.get("/checkUser/:commentId", LikeCommentController.checkUserLikeComment);

module.exports = router;

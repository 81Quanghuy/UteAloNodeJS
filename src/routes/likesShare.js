const express = require("express");

const router = express.Router();
const LikeShareController = require("../app/controllers/User/LikeShareController");

// Lấy danh sách yêu thích của 1 bài share
router.get("/:shareId", LikeShareController.getLikesOfShare);

// Thích và bỏ thích bài share
router.post("/toggleLike/:shareId", LikeShareController.toggleLikeShare);

// Kiểm tra xem user đã thích bài share chưa
router.get("/checkUser/:shareId", LikeShareController.checkUserLikeShare);

module.exports = router;

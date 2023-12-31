const express = require("express");

const router = express.Router();
const PostController = require("../app/controllers/User/PostController");

// Lấy những bài viết của user theo id
router.get("/user/:userId", PostController.getPostsByUserId);

// Lấy những bài viết của user and friend theo id
router.get("/get/timeLine", PostController.getPostsOfUserAndFriends);

// Lấy thông tin chi tiết của 1 bài viết
router.get("/:postId", PostController.getPostDetailsByPostId);

// Tạo bài viết
router.post("/create", PostController.createPostByUser);

// Xóa bài viết
router.put("/delete/:postId", PostController.deletePostByUser);

// Cập nhật bài viết
router.put("/update/:postId", PostController.updatePostByUser);

// Lấy 9 ảnh mới nhất từ bài viết của người dùng
router.get(
  "/user/:userId/latest-photos",
  PostController.getLatestUserPostImages
);

module.exports = router;

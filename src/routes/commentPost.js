const express = require("express");

const router = express.Router();
const CommentPostController = require("../app/controllers/User/CommentPostController");

// Lấy tất cả comment của 1 bài viết
router.get("/:postId", CommentPostController.getCommentsByPostId);

// Lấy danh sách phản hồi của 1 bình luận
router.get(
  "/:commentId/commentReply",
  CommentPostController.getCommentReplyOfComment
);

// Thêm bình luận cho bài viết
router.post("/create", CommentPostController.createCommentForPost);

// Phản hồi bình luận
router.post("/reply", CommentPostController.replyCommentForPost);

// Cập nhật bình luận
router.put("/update/:commentId", CommentPostController.updateCommentPostByUser);

// Xóa bình luận
router.put("/delete/:commentId", CommentPostController.deleteCommentPostByUser);

module.exports = router;

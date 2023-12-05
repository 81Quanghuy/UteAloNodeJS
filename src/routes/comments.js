const express = require("express");

const router = express.Router();
const CommentController = require("../app/controllers/User/CommentController");

// Lấy tất cả comment của 1 bài viết
router.get("/:postId", CommentController.getCommentsByPostId);

// Lấy danh sách phản hồi của 1 bình luận
router.get(
  "/:commentId/commentReply",
  CommentController.getCommentReplyOfComment
);

// Thêm bình luận cho bài viết
router.post("/create", CommentController.createCommentForPost);

// Phản hồi bình luận
router.post("/reply", CommentController.replyCommentForPost);

// Cập nhật bình luận
router.put("/update/:commentId", CommentController.updateCommentPostByUser);

// Xóa bình luận
router.put("/delete/:commentId", CommentController.deleteCommentPostByUser);

module.exports = router;

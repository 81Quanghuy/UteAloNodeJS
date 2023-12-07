const express = require("express");

const router = express.Router();
const CommentShareController = require("../app/controllers/User/CommentShareController");

// Lấy tất cả comment của 1 bài share
router.get("/:shareId", CommentShareController.getCommentsByShareId);

// Lấy danh sách phản hồi của 1 bình luận
router.get(
  "/:commentId/commentReply",
  CommentShareController.getCommentReplyOfComment
);

// Thêm bình luận cho bài share
router.post("/create", CommentShareController.createCommentForShare);

// Phản hồi bình luận
router.post("/reply", CommentShareController.replyCommentForShare);

// Cập nhật bình luận
router.put(
  "/update/:commentId",
  CommentShareController.updateCommentShareByUser
);

// Xóa bình luận
router.put(
  "/delete/:commentId",
  CommentShareController.deleteCommentShareByUser
);

module.exports = router;

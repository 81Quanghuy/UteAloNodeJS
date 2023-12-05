/* eslint-disable no-await-in-loop */
const { log } = require("console");
const mongoose = require("mongoose");
const Post = require("../../models/Post");
const User = require("../../models/User");
const Like = require("../../models/Like");
const Profile = require("../../models/Profile");
const Comment = require("../../models/Comment");
const PostsResponse = require("../../../utils/DTO/PostsResponse");
const CommentsResponse = require("../../../utils/DTO/CommentsResponse");
const LikePostResponse = require("../../../utils/DTO/LikePostResponse");
const LikeCommentResponse = require("../../../utils/DTO/LikeCommentResponse");
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const Cloudinary = require("../../../configs/cloudinary");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class LikeCommentController {
  // Lấy danh sách yêu thích của bình luận theo commentId
  async getLikesOfComment(req, res, next) {
    const commentId = req.params;
    try {
      const likes = await Like.find({ comment: commentId.commentId }).populate(
        "user"
      );
      const comment = await Comment.findById(commentId.commentId);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

      if (likes.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "This comment has no like" });
      }

      console.log(likes);
      console.log("comment", comment);

      const formattedLikes = likes.map(
        (like) =>
          new LikeCommentResponse({
            likeId: like._id,
            commentId: comment._id,
            userName: like.user.userName,
          })
      );

      // Trả về danh sách likes của bình luận
      return res.status(200).json({
        success: true,
        message: "Retrieving likes of comment successfully",
        result: formattedLikes,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  // Thích và bỏ thích bình luận
  async toggleLikeComment(req, res, next) {
    try {
      const { authorization } = req.headers;
      const { commentId } = req.params;
      const comment = await Comment.findById(commentId);
      const token = authorization.split(" ")[1];
      const userId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

      console.log(comment);
      console.log(user);

      // Kiểm tra xem user đã like bình luận này chưa
      const existingLike = await Like.findOne({
        user: userId,
        comment: commentId,
      });
      console.log("existingLike", existingLike);

      if (existingLike) {
        await Like.findOneAndDelete({ user: userId, comment: commentId });

        return res
          .status(200)
          .json({ message: "Like comment removed successfully" });
      }

      // Tạo like mới và thêm vào bảng Like và trường likes của bình luận
      const newLike = new Like({ user: userId, comment: commentId });
      await newLike.save();
      comment.likes.push(newLike._id);
      const formattedLikePost = new LikeCommentResponse({
        likeId: newLike._id,
        commentId: comment._id,
        userName: user.userName,
      });
      await comment.save();
      return res.status(200).json({
        success: true,
        message: "Like Comment Successfully",
        result: formattedLikePost,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(400)
        .json({ success: false, message: "Error toggling like" });
    }
  }

  // Kiểm tra xem user đã like bình luận này chưa
  async checkUserLikeComment(req, res, next) {
    try {
      const { authorization } = req.headers;
      const { commentId } = req.params;
      const comment = await Comment.findById(commentId);
      const token = authorization.split(" ")[1];
      const userId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

      console.log(comment);
      console.log(user);

      // Kiểm tra xem user đã like bình luận này chưa
      const existingLike = await Like.findOne({
        user: userId,
        comment: commentId,
      });
      console.log("existingLike", existingLike);

      if (existingLike) {
        return res.status(200).json({
          success: true,
          message: "Is Liked",
          result: true,
          statusCode: 200,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Not Like",
        result: false,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(400)
        .json({ success: false, message: "Error check user like" });
    }
  }
}

module.exports = new LikeCommentController();

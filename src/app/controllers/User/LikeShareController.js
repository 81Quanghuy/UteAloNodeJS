/* eslint-disable no-await-in-loop */
const { log } = require("console");
const mongoose = require("mongoose");
const Post = require("../../models/Post");
const User = require("../../models/User");
const Like = require("../../models/Like");
const Profile = require("../../models/Profile");
const Comment = require("../../models/Comment");
const Share = require("../../models/Share");
const PostsResponse = require("../../../utils/DTO/PostsResponse");
const CommentsResponse = require("../../../utils/DTO/CommentsResponse");
const LikePostResponse = require("../../../utils/DTO/LikePostResponse");
const LikeShareResponse = require("../../../utils/DTO/LikeShareResponse");
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const Cloudinary = require("../../../configs/cloudinary");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class LikeShareController {
  // Lấy danh sách yêu thích của bài share theo shareId
  async getLikesOfShare(req, res, next) {
    const shareId = req.params;
    try {
      const likes = await Like.find({ share: shareId.shareId }).populate(
        "user"
      );

      console.log("likes", likes);
      const share = await Share.findById(shareId.shareId);
      if (!share) {
        return res
          .status(404)
          .json({ success: false, message: "Share not found" });
      }

      if (likes.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "This share has no like" });
      }

      const formattedLikes = likes.map(
        (like) =>
          new LikeShareResponse({
            likeId: like._id,
            shareId: like.share,
            userName: like.user.userName,
          })
      );

      // Trả về danh sách likes của bài share
      return res.status(200).json({
        success: true,
        message: "Retrieving likes of share successfully",
        result: formattedLikes,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  // Thích và bỏ thích bài share
  async toggleLikeShare(req, res, next) {
    try {
      const { authorization } = req.headers;
      const { shareId } = req.params;
      const share = await Share.findById(shareId);
      const token = authorization.split(" ")[1];
      const userId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      if (!share) {
        return res
          .status(404)
          .json({ success: false, message: "Share not found" });
      }

      console.log(share);
      console.log(user);

      // Kiểm tra xem user đã like bài viết này chưa
      const existingLike = await Like.findOne({ user: userId, share: shareId });
      console.log("existingLike", existingLike);

      if (existingLike) {
        await Like.findOneAndDelete({ user: userId, share: shareId });

        return res
          .status(200)
          .json({ message: "Like post removed successfully" });
      }

      // Tạo like mới và thêm vào bảng Like và trường likes của bài viết
      const newLike = new Like({ user: userId, share: shareId });
      await newLike.save();
      share.likes.push(newLike._id);
      const formattedLikePost = new LikeShareResponse({
        likeId: newLike._id,
        shareId: share._id,
        userName: user.userName,
      });
      await share.save();
      return res.status(200).json({
        success: true,
        message: "Like share successfully",
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

  // Kiểm tra xem user đã like bài share này chưa
  async checkUserLikeShare(req, res, next) {
    try {
      const { authorization } = req.headers;
      const { shareId } = req.params;
      const share = await Share.findById(shareId);
      const token = authorization.split(" ")[1];
      const userId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      if (!share) {
        return res
          .status(404)
          .json({ success: false, message: "Share not found" });
      }

      console.log(share);
      console.log(user);

      // Kiểm tra xem user đã like bài viết này chưa
      const existingLike = await Like.findOne({ user: userId, share: shareId });
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

module.exports = new LikeShareController();

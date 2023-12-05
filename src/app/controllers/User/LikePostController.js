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
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const Cloudinary = require("../../../configs/cloudinary");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class LikePostController {
  // Lấy danh sách yêu thích của bài viết theo postId
  async getLikesOfPost(req, res, next) {
    const postId = req.params;
    try {
      const likes = await Like.find({ post: postId.postId }).populate("user");
      const post = await Post.findById(postId.postId);
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      if (likes.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "This post has no like" });
      }

      const formattedLikes = likes.map(
        (like) =>
          new LikePostResponse({
            likeId: like._id,
            postId: like.post,
            userName: like.user.userName,
          })
      );

      // Trả về danh sách likes của bài post
      return res.status(200).json({
        success: true,
        message: "Retrieving likes of post successfully",
        result: formattedLikes,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  // Thích và bỏ thích bài viết
  async toggleLikePost(req, res, next) {
    try {
      const { authorization } = req.headers;
      const { postId } = req.params;
      const post = await Post.findById(postId);
      const token = authorization.split(" ")[1];
      const userId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      console.log(post);
      console.log(user);

      // Kiểm tra xem user đã like bài viết này chưa
      const existingLike = await Like.findOne({ user: userId, post: postId });
      console.log("existingLike", existingLike);

      if (existingLike) {
        await Like.findOneAndDelete({ user: userId, post: postId });

        return res
          .status(200)
          .json({ message: "Like post removed successfully" });
      }

      // Tạo like mới và thêm vào bảng Like và trường likes của bài viết
      const newLike = new Like({ user: userId, post: postId });
      await newLike.save();
      post.likes.push(newLike._id);
      const formattedLikePost = new LikePostResponse({
        likeId: newLike._id,
        postId: post._id,
        userName: user.userName,
      });
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Like post successfully",
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

  // Kiểm tra xem user đã like bài viết này chưa
  async checkUserLikePost(req, res, next) {
    try {
      const { authorization } = req.headers;
      const { postId } = req.params;
      const post = await Post.findById(postId);
      const token = authorization.split(" ")[1];
      const userId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      console.log(post);
      console.log(user);

      // Kiểm tra xem user đã like bài viết này chưa
      const existingLike = await Like.findOne({ user: userId, post: postId });
      console.log("existingLike", existingLike);

      if (existingLike) {
        return res
          .status(200)
          .json({
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

module.exports = new LikePostController();

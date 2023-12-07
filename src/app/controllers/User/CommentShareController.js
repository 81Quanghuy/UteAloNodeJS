/* eslint-disable no-await-in-loop */
const { log } = require("console");
const mongoose = require("mongoose");
const Post = require("../../models/Post");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Share = require("../../models/Share");
const Comment = require("../../models/Comment");
const PostsResponse = require("../../../utils/DTO/PostsResponse");
const CommentsResponse = require("../../../utils/DTO/CommentsResponse");
const CommentsShareResponse = require("../../../utils/DTO/CommentsShareResponse");
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const Cloudinary = require("../../../configs/cloudinary");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class CommentShareController {
  // Lấy những bình luận của bài viết theo postId
  async getCommentsByShareId(req, res, next) {
    const shareId = req.params;
    try {
      const share = await Share.findById(shareId.shareId);
      if (!share) {
        return res
          .status(404)
          .json({ success: false, message: "Share not found" });
      }

      const comments = await Comment.aggregate([
        {
          $match: {
            share: mongoose.Types.ObjectId(shareId.shareId), // Ánh xạ postId với ObjectId của MongoDB
            commentReply: null, // Kiểm tra commentReply là null
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "user",
            foreignField: "user",
            as: "userProfile",
          },
        },
        {
          $addFields: {
            userProfile: { $arrayElemAt: ["$userProfile", 0] },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userProfile.user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $addFields: {
            userDetails: { $arrayElemAt: ["$userDetails", 0] },
          },
        },
        {
          $project: {
            _id: 1,
            content: 1,
            photos: 1,
            createTime: 1,
            updateAt: 1,
            share: 1,
            commentReply: 1,
            post: 1,
            userProfile: {
              $mergeObjects: [
                "$userProfile",
                {
                  userName: "$userDetails.userName",
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "comment",
            as: "likes",
          },
        },
        { $sort: { createTime: -1 } }, // Sắp xếp theo createTime giảm dần
      ]);

      if (comments.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "This post has no comment" });
      }

      // Chuyển đổi kết quả sang dạng CommentsResponse
      const formattedComments = comments.map((comment) => {
        const userProfile = comment.userProfile || {};
        const likeIds = comment.likes?.map((like) => like._id) || []; // Sử dụng optional chaining và gán một mảng rỗng nếu likes không tồn tại

        return new CommentsShareResponse({
          commentId: comment._id,
          content: comment.content,
          createTime: comment.createTime,
          photos: comment.photos,
          userName: userProfile.userName || "",
          userAvatar: userProfile.avatar || "",
          userId: userProfile.user,
          likes: likeIds,
          shareId: comment.share ? comment.share._id : null,
        });
      });

      return res.status(200).json({
        success: true,
        message: "Retrieving comment of share post successfully",
        result: formattedComments,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  // Lấy danh sách phản hồi bình luận
  async getCommentReplyOfComment(req, res, next) {
    const { commentId } = req.params;
    console.log("commentId", commentId);
    try {
      const comment = await Comment.findById(commentId).populate(
        "user",
        "userName"
      );
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

      const userOwnerShare = comment.user.userName;

      // const commentIdObj = mongoose.Types.ObjectId(commentId);
      // console.log("commentIdObj", commentIdObj);
      // const commentReplies = await Comment.find({ commentReply: commentIdObj });

      const commentReplies = await Comment.aggregate([
        {
          $match: {
            commentReply: mongoose.Types.ObjectId(commentId), // Ánh xạ postId với ObjectId của MongoDB
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "user",
            foreignField: "user",
            as: "userProfile",
          },
        },
        {
          $addFields: {
            userProfile: { $arrayElemAt: ["$userProfile", 0] },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userProfile.user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $addFields: {
            userDetails: { $arrayElemAt: ["$userDetails", 0] },
          },
        },
        {
          $project: {
            _id: 1,
            content: 1,
            photos: 1,
            createTime: 1,
            updateAt: 1,
            share: 1,
            commentReply: 1,
            post: 1,
            userProfile: {
              $mergeObjects: [
                "$userProfile",
                {
                  userName: "$userDetails.userName",
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "comment",
            as: "likes",
          },
        },
        { $sort: { createTime: -1 } }, // Sắp xếp theo createTime giảm dần
      ]);

      console.log("commentReplies", commentReplies);

      if (commentReplies.length === 0) {
        return res.status(403).json({
          success: false,
          message: "This comment has no commentReply",
        });
      }

      const formattedComments = commentReplies.map((comment) => {
        const userProfile = comment.userProfile || {};
        const likeIds = comment.likes?.map((like) => like._id) || []; // Sử dụng optional chaining và gán một mảng rỗng nếu likes không tồn tại

        return new CommentsShareResponse({
          commentId: comment._id,
          content: comment.content,
          createTime: comment.createTime,
          photos: comment.photos,
          userName: userProfile.userName || "",
          userAvatar: userProfile.avatar || "",
          userId: userProfile.user,
          likes: likeIds,
          shareId: comment.share ? comment.share._id : null,
          userOwner: userOwnerShare,
        });
      });

      return res.status(200).json({
        success: true,
        message: "Retrieving comment of post successfully",
        result: formattedComments,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  // Thêm bình luận cho bài viết
  async createCommentForShare(req, res) {
    try {
      const { authorization } = req.headers;
      const { shareId, content } = req.body;
      // Lấy thông tin user từ token
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(currentUserId);

      // Kiểm tra xem user có tồn tại không
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Kiểm tra xem bài viết có tồn tại không
      const share = await Share.findById(shareId);
      if (!share) {
        return res
          .status(404)
          .json({ success: false, message: "Share not found" });
      }

      // Tạo mới comment
      const comment = new Comment({
        user: currentUserId,
        content,
        share: shareId,
      });

      await comment.save();

      // Thêm comment mới vào danh sách comment của bài viết
      share.comments.push(comment._id);
      await share.save();

      console.log("comment", comment);

      const currentUserIdObj = mongoose.Types.ObjectId(currentUserId);
      const profile = await Profile.findOne({ user: currentUserIdObj }).exec();

      const { avatar } = profile || {};
      const likeIds = comment.likes?.map((like) => like._id) || [];

      const formattedComment = new CommentsShareResponse({
        commentId: comment._id,
        content: comment.content || null,
        createTime: comment.createTime || null,
        photos: comment.photos || null,
        userName: user.userName || null,
        userId: user._id || null,
        userAvatar: avatar || null,
        likes: likeIds,
        share: comment.share ? comment.share._id : null,
      });

      return res.status(200).json({
        success: true,
        message: "Comment Share Successfully",
        result: formattedComment,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Xóa bình luận
  async deleteCommentShareByUser(req, res, next) {
    const { commentId } = req.params;
    try {
      const { authorization } = req.headers;
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(currentUserId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      const commentIdObj = mongoose.Types.ObjectId(commentId);

      // Xóa bài Post dựa trên postId và userId
      const deletedComment = await Comment.findOneAndDelete({
        _id: commentIdObj,
      });

      if (!deletedComment) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Delete Successful!",
        result: null,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error); // Xử lý lỗi nếu có
    }
  }

  // Phản hồi bình luận
  async replyCommentForShare(req, res) {
    try {
      const { authorization } = req.headers;
      const { shareId, commentId, content } = req.body;
      // Lấy thông tin user từ token
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);

      // Kiểm tra xem user có tồn tại không
      const user = await getUserWithRole(currentUserId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      // Kiểm tra xem bài viết có tồn tại không
      const share = await Share.findById(shareId);
      if (!share) {
        return res
          .status(404)
          .json({ success: false, message: "Share not found" });
      }

      // Kiểm tra xem bình luận có tồn tại không
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

      // Tạo mới comment
      const commentReply = new Comment({
        user: currentUserId,
        content,
        share: shareId,
        commentReply: commentId,
      });

      console.log("commentReply", commentReply);

      await commentReply.save();
      // Thêm comment mới vào danh sách comment của bài viết
      share.comments.push(commentReply._id);
      await share.save();

      const currentUserIdObj = mongoose.Types.ObjectId(currentUserId);
      const profile = await Profile.findOne({ user: currentUserIdObj }).exec();
      console.log("profile", profile);

      const { avatar } = profile || {};
      const likeIds = commentReply.likes?.map((like) => like._id) || [];

      const formattedComment = new CommentsShareResponse({
        commentId: commentReply._id,
        content: commentReply.content || null,
        createTime: commentReply.createTime || null,
        photos: commentReply.photos || null,
        userName: user.userName || null,
        userId: user._id || null,
        userAvatar: avatar || null,
        likes: likeIds,
        shareId: commentReply.share ? commentReply.share._id : null,
      });

      return res.status(200).json({
        success: true,
        message: "Reply Comment Share Post Successfully",
        result: formattedComment,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Cập nhật bình luận
  async updateCommentShareByUser(req, res, next) {
    const { authorization } = req.headers;
    const { commentId } = req.params;
    const { content } = req.body;
    const token = authorization.split(" ")[1];
    const currentUserId = await authMethod.getUserIdFromJwt(token);
    const user = await getUserWithRole(currentUserId);
    const commentIdObj = mongoose.Types.ObjectId(commentId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    try {
      const comment = await Comment.findById(commentIdObj).populate(
        "user",
        "userId"
      );

      const userIdObj = comment.user._id.toString();
      if (!comment) {
        return { success: false, message: "Comment not found" };
      }

      if (currentUserId !== userIdObj) {
        return res.status(403).json({
          success: false,
          message: "Update denied",
          statusCode: 403,
        });
      }

      // Cập nhật các trường thông tin bài viết nếu có trong updateFields
      if (content !== null) {
        comment.content = content;
      }

      // Lưu thông tin bình luận đã cập nhật
      await comment.save();

      return res.status(200).json({
        success: true,
        message: "Update successfully",
        result: null,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error); // Xử lý lỗi nếu có
    }
  }
}

module.exports = new CommentShareController();

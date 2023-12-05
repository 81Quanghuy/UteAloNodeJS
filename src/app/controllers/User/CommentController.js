/* eslint-disable no-await-in-loop */
const { log } = require("console");
const mongoose = require("mongoose");
const Post = require("../../models/Post");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Comment = require("../../models/Comment");
const PostsResponse = require("../../../utils/DTO/PostsResponse");
const CommentsResponse = require("../../../utils/DTO/CommentsResponse");
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const Cloudinary = require("../../../configs/cloudinary");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class CommentController {
  // Lấy những bình luận của bài viết theo postId
  async getCommentsByPostId(req, res, next) {
    const postId = req.params;
    try {
      const post = await Post.findById(postId.postId);
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      const comments = await Comment.aggregate([
        {
          $match: {
            post: mongoose.Types.ObjectId(postId.postId), // Ánh xạ postId với ObjectId của MongoDB
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

        return new CommentsResponse({
          commentId: comment._id,
          content: comment.content,
          createTime: comment.createTime,
          photos: comment.photos,
          userName: userProfile.userName || "",
          userAvatar: userProfile.avatar || "",
          userId: userProfile.user,
          likes: likeIds,
          postId: comment.post ? comment.post._id : null,
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

  // Lấy danh sách phản hồi bình luận
  async getCommentReplyOfComment(req, res, next) {
    const { commentId } = req.params;
    console.log("commentId", commentId);
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

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

        return new CommentsResponse({
          commentId: comment._id,
          content: comment.content,
          createTime: comment.createTime,
          photos: comment.photos,
          userName: userProfile.userName || "",
          userAvatar: userProfile.avatar || "",
          userId: userProfile.user,
          likes: likeIds,
          postId: comment.post ? comment.post._id : null,
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
  async createCommentForPost(req, res) {
    try {
      const { authorization } = req.headers;
      const { postId, content } = req.body;
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
      const post = await Post.findById(postId);
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      if (!content && req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Content or photos is required",
          statusCode: 400,
        });
      }

      // Tạo mới comment
      const comment = new Comment({
        user: currentUserId,
        content,
        post: postId,
      });

      if (req.files && req.files.length > 0) {
        let photoURL = null;
        let photoUploaded = false; // Biến để kiểm soát việc upload ảnh

        for (const file of req.files) {
          if (!photoUploaded && file.fieldname === "photos") {
            photoURL = await Cloudinary.uploadPhotosToCloudinary(file.buffer);
            photoUploaded = true; // Đã upload ảnh, đặt cờ thành true để không upload ảnh nữa
          }

          // Kiểm tra nếu cả hai đã được upload thì thoát khỏi vòng lặp
          if (photoUploaded) {
            break;
          }
        }

        if (photoURL) {
          comment.photos = photoURL;
        }
      }

      await comment.save();

      // Thêm comment mới vào danh sách comment của bài viết
      post.comments.push(comment._id);
      await post.save();

      console.log("comment", comment);

      const currentUserIdObj = mongoose.Types.ObjectId(currentUserId);
      const profile = await Profile.findOne({ user: currentUserIdObj }).exec();

      const { avatar } = profile || {};
      const likeIds = comment.likes?.map((like) => like._id) || [];

      const formattedComment = new CommentsResponse({
        commentId: comment._id,
        content: comment.content || null,
        createTime: comment.createTime || null,
        photos: comment.photos || null,
        userName: user.userName || null,
        userId: user._id || null,
        userAvatar: avatar || null,
        likes: likeIds,
        postId: comment.post ? comment.post._id : null,
      });

      return res.status(200).json({
        success: true,
        message: "Comment created successfully",
        result: formattedComment,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Xóa bình luận
  async deleteCommentPostByUser(req, res, next) {
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
  async replyCommentForPost(req, res) {
    try {
      const { authorization } = req.headers;
      const { postId, commentId, content } = req.query;
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
      const post = await Post.findById(postId);
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      // Kiểm tra xem bình luận có tồn tại không
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

      if (!content && req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Content or photos is required",
          statusCode: 400,
        });
      }

      // Tạo mới comment
      const commentReply = new Comment({
        user: currentUserId,
        content,
        post: postId,
        commentReply: commentId,
      });

      if (req.files && req.files.length > 0) {
        let photoURL = null;
        let photoUploaded = false; // Biến để kiểm soát việc upload ảnh

        for (const file of req.files) {
          if (!photoUploaded && file.fieldname === "photos") {
            photoURL = await Cloudinary.uploadPhotosToCloudinary(file.buffer);
            photoUploaded = true; // Đã upload ảnh, đặt cờ thành true để không upload ảnh nữa
          }

          // Kiểm tra nếu cả hai đã được upload thì thoát khỏi vòng lặp
          if (photoUploaded) {
            break;
          }
        }

        if (photoURL) {
          commentReply.photos = photoURL;
        }
      }

      console.log("commentReply", commentReply);

      await commentReply.save();
      // Thêm comment mới vào danh sách comment của bài viết
      post.comments.push(commentReply._id);
      await post.save();

      const currentUserIdObj = mongoose.Types.ObjectId(currentUserId);
      const profile = await Profile.findOne({ user: currentUserIdObj }).exec();
      console.log("profile", profile);

      const { avatar } = profile || {};
      const likeIds = commentReply.likes?.map((like) => like._id) || [];

      const formattedComment = new CommentsResponse({
        commentId: commentReply._id,
        content: commentReply.content || null,
        createTime: commentReply.createTime || null,
        photos: commentReply.photos || null,
        userName: user.userName || null,
        userId: user._id || null,
        userAvatar: avatar || null,
        likes: likeIds,
        postId: commentReply.post ? commentReply.post._id : null,
      });

      return res.status(200).json({
        success: true,
        message: "Reply Comment Post Successfully",
        result: formattedComment,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Cập nhật bài viết
  async updateCommentPostByUser(req, res, next) {
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

      if (!content && req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Content or photos is required",
          statusCode: 400,
        });
      }

      // Cập nhật các trường thông tin bài viết nếu có trong updateFields
      if (content !== null) {
        comment.content = content;
      }
      if (req.files && req.files.length > 0) {
        let photoURL = null;
        let photoUploaded = false; // Biến để kiểm soát việc upload ảnh

        for (const file of req.files) {
          if (!photoUploaded && file.fieldname === "photos") {
            photoURL = await Cloudinary.uploadPhotosToCloudinary(file.buffer);
            photoUploaded = true; // Đã upload ảnh, đặt cờ thành true để không upload ảnh nữa
          }

          // Kiểm tra nếu cả hai đã được upload thì thoát khỏi vòng lặp
          if (photoUploaded) {
            break;
          }
        }

        if (photoURL) {
          comment.photos = photoURL;
        }
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

module.exports = new CommentController();

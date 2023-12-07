/* eslint-disable no-await-in-loop */
const { log } = require("console");
const mongoose = require("mongoose");
const Post = require("../../models/Post");
const User = require("../../models/User");
const Share = require("../../models/Share");
const PostsResponse = require("../../../utils/DTO/PostsResponse");
const SharesResponse = require("../../../utils/DTO/SharesResponse");
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const Cloudinary = require("../../../configs/cloudinary");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class ShareController {
  // Lấy những bài share của user theo id
  async getSharesByUserId(req, res, next) {
    const userId = req.params;
    const { authorization } = req.headers;
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      if (currentUserId !== userId.userId) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          statusCode: 404,
        });
      }
      const shares = await Share.find({ userId: userId.userId })
        .populate({
          path: "userId",
          select: "userName role",
          populate: {
            path: "role",
            model: "Role",
            select: "roleName",
          },
        })
        .populate("likes", "_id")
        .populate("comments", "_id")
        .sort({ createAt: -1 });

      if (!shares) {
        return res.status(404).json({
          success: false,
          message: "No shares found for this user",
          statusCode: 404,
        });
      }

      const formattedShares = shares.map((share) => {
        const likeIds = share.likes?.map((like) => like._id) || [];
        const commentIds = share.comments?.map((comment) => comment._id) || [];

        return new SharesResponse({
          shareId: share._id,
          createAt: share.createAt,
          updateAt: share.updateAt,
          content: share.content,
          postId: share.postId,
          userId: userId.userId,
          comments: commentIds,
          likes: likeIds,
        });
      });

      if (userId.userId !== currentUserId) {
        return res.status(200).json({
          success: true,
          message:
            "Retrieved share posts successfully and access update denied",
          result: formattedShares,
          statusCode: 200,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Retrieved share posts successfully and access update",
        result: formattedShares,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  //  Lấy thông tin chi tiết của 1 bài share
  async getShareDetailsByPostId(req, res, next) {
    const shareId = req.params;
    const { authorization } = req.headers;
    log("shareId", shareId);
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      const share = await Share.findById(shareId.shareId)
        .populate({
          path: "userId",
          select: "userName role",
          populate: {
            path: "role",
            model: "Role",
            select: "roleName",
          },
        })
        .populate("likes", "_id")
        .populate("comments", "_id");

      if (!share) {
        return res.status(404).json({
          success: false,
          message: "Share not found",
          statusCode: 404,
        });
      }

      const likeIds = share.likes?.map((like) => like._id) || [];
      const commentIds = share.comments?.map((comment) => comment._id) || [];

      const formattedShare = new SharesResponse({
        shareId: share._id,
        createAt: share.createAt,
        updateAt: share.updateAt,
        content: share.content,
        postId: share.postId,
        userId: share.userId._id,
        comments: commentIds,
        likes: likeIds,
      });
      console.log(share.userId._id.toString());
      if (share.userId._id.toString() !== currentUserId) {
        return res.status(200).json({
          success: true,
          message:
            "Retrieving share post successfully and access update denied",
          result: formattedShare,
          statusCode: 200,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Retrieving share post successfully and access update",
        result: formattedShare,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  // Tạo bài share
  async createShareByUser(req, res) {
    const { authorization } = req.headers;
    const requestDTO = req.body;
    const token = authorization.split(" ")[1];
    const currentUserId = await authMethod.getUserIdFromJwt(token);
    const user = await getUserWithRole(currentUserId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    try {
      const share = new Share({
        content: requestDTO.content,
        postGroupId: requestDTO.postGroupId,
        postId: requestDTO.postId,
        userId: currentUserId,
      });

      await share.save();

      const shareData = await Share.findById(share._id)
        .populate({
          path: "userId",
          select: "userName role",
          populate: {
            path: "role",
            model: "Role",
            select: "roleName",
          },
        })
        .populate("likes", "_id")
        .populate("comments", "_id");

      const likeIds = shareData.likes?.map((like) => like._id) || [];
      const commentIds =
        shareData.comments?.map((comment) => comment._id) || [];

      const formattedShare = new SharesResponse({
        shareId: shareData._id,
        createAt: shareData.createAt,
        updateAt: shareData.updateAt,
        content: shareData.content,
        postId: requestDTO.postId,
        userId: currentUserId,
        comments: commentIds,
        likes: likeIds,
      });

      const response = {
        success: true,
        message: "Share Post Successfully",
        result: formattedShare,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Xóa bài share
  async deleteShareByUser(req, res, next) {
    const { shareId } = req.params;
    const { id } = req.body;
    const userIdObj = id
      .substring(1, id.length - 1)
      .trim()
      .replace(/"$/, "");
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
      const shareIdObj = mongoose.Types.ObjectId(shareId);
      if (userIdObj !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "Delete denied",
          statusCode: 403,
        });
      }
      // Xóa bài Share dựa trên shareId và userId
      const deletedShare = await Share.findOneAndDelete({
        _id: shareIdObj,
      });

      if (!deletedShare) {
        return res
          .status(404)
          .json({ success: false, message: "Share not found" });
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

  // Cập nhật bài share
  async updatePostByUser(req, res, next) {
    const { authorization } = req.headers;
    const { shareId } = req.params;
    const requestDTO = req.body;
    const token = authorization.split(" ")[1];
    const currentUserId = await authMethod.getUserIdFromJwt(token);
    const user = await getUserWithRole(currentUserId);
    const shareIdObj = mongoose.Types.ObjectId(shareId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    try {
      const share = await Share.findById(shareIdObj);

      const userIdObj = share.userId.toString();

      if (!share) {
        return { success: false, message: "Share not found" };
      }

      if (userIdObj !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "Update denied",
          statusCode: 403,
        });
      }

      // Cập nhật các trường thông tin bài share nếu có trong updateFields
      if (requestDTO.content) {
        share.content = requestDTO.content;
      }

      // Lưu thông tin bài viết đã cập nhật
      await share.save();

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

module.exports = new ShareController();

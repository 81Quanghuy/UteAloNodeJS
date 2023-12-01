const mongoose = require("mongoose");
const Post = require("../../models/Post"); // Import Post model
const Like = require("../../models/Like"); // Import Like model
const Comment = require("../../models/Comment"); // Import Comment model
const User = require("../../models/User"); // Import User model
const Profile = require("../../models/Profile"); // Import Profile model
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const PostsResponse = require("../../../utils/DTO/PostsResponse");
const Cloudinary = require("../../../configs/cloudinary");
const CommentsResponse = require("../../../utils/DTO/CommentsResponse");

function handleInternalServerError(req, res, next, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class CommentManagerController {
  async getListComments(req, res, next) {
    const { page = 1, items = 10 } = req.query;
    const { authorization } = req.headers;

    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(currentUserId);
      if (!user || (user.role && user.role.roleName !== "Admin")) {
        return res
          .status(403)
          .json({ success: false, message: "Access Denied" });
      }
      // const comment = await Comment.find()
      //   .populate("user", "userName")
      //   .populate("likes", "_id")
      //   .populate("post", "_id");

      const comments = await Comment.aggregate([
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

      const result = {
        content: formattedComments,
        pageable: {
          pageNumber: parseInt(page),
          pageSize: parseInt(items),
          sort: { empty: true, sorted: false, unsorted: true },
          offset: (parseInt(page) - 1) * parseInt(items),
          unpaged: false,
          paged: true,
        },
        last: true,
        totalElements: comments.length,
        totalPages: 1,
        size: parseInt(items),
        number: parseInt(page),
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: comments.length,
        empty: false,
      };

      res.status(200).json({
        success: true,
        message: "Retrieved List Posts Successfully",
        result,
        statusCode: 200,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(comments.length / parseInt(items)),
          count: comments.length,
          itemsPerPage: parseInt(items),
        },
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error); // Sử dụng hàm xử lý lỗi tùy chỉnh
    }
  }

  async deleteComment(req, res, next) {
    const { commentId } = req.params; // Lấy commentId từ request params

    try {
      const { authorization } = req.headers;
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      const user = await getUserWithRole(currentUserId);

      if (!user || (user.role && user.role.roleName !== "Admin")) {
        return res
          .status(403)
          .json({ success: false, message: "Access Denied" });
      }

      const commentIdObj = mongoose.Types.ObjectId(commentId);

      // Xóa bài Post dựa trên postId và userId
      const deletedComment = await Comment.findOneAndDelete({
        _id: commentIdObj,
      });

      if (!deletedComment) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      // Sau khi xóa thành công, lấy danh sách tất cả Comment còn lại
      const comments = await Comment.aggregate([
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
        {
          $addFields: {
            createTime: { $ifNull: ["$createTime", "$updateAt"] }, // Tạo trường createTime nếu nó chưa tồn tại hoặc tính toán từ trường khác
          },
        },
        { $sort: { createTime: -1 } }, // Sắp xếp theo createTime giảm dần
      ]);

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
        message: "Comment deleted successfully",
        posts: formattedComments, // Trả về danh sách bài Comment còn lại sau khi xóa
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error); // Xử lý lỗi nếu có
    }
  }

  async countComments(req, res) {
    const today = new Date();
    const intervals = [
      {
        label: "countToday",
        start: new Date(today).setHours(0, 0, 0, 0),
        end: new Date(),
      },
      {
        label: "countInWeek",
        start: new Date(today.setDate(today.getDate() - 7)).setHours(
          0,
          0,
          0,
          0
        ),
        end: new Date(),
      },
      {
        label: "countIn1Month",
        start: new Date(today.setMonth(today.getMonth() - 1)).setHours(
          0,
          0,
          0,
          0
        ),
        end: new Date(),
      },
      {
        label: "countIn3Month",
        start: new Date(today.setMonth(today.getMonth() - 3)).setHours(
          0,
          0,
          0,
          0
        ),
        end: new Date(),
      },
      {
        label: "countIn6Month",
        start: new Date(today.setMonth(today.getMonth() - 6)).setHours(
          0,
          0,
          0,
          0
        ),
        end: new Date(),
      },
      {
        label: "countIn9Month",
        start: new Date(today.setMonth(today.getMonth() - 9)).setHours(
          0,
          0,
          0,
          0
        ),
        end: new Date(),
      },
      {
        label: "countIn1Year",
        start: new Date(today.setFullYear(today.getFullYear() - 1)).setHours(
          0,
          0,
          0,
          0
        ),
        end: new Date(),
      },
    ];
    try {
      const counts = await Promise.all(
        intervals.map(async (interval) => {
          const count = await Comment.countDocuments({
            createTime: { $gte: interval.start, $lte: interval.end },
          });
          return { [interval.label]: count };
        })
      );
      const result1 = Object.assign({}, ...counts);
      res.status(200).json({
        success: true,
        message: "Retrieved comment counts successfully",
        result: result1,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error counting comments",
        error: error.message,
      });
    }
  }

  async countCommentsBy12Month(req, res, next) {
    const currentDate = new Date();
    const twelveMonthsAgo = new Date(currentDate);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    try {
      const result = await Comment.aggregate([
        {
          $match: {
            createTime: { $gte: twelveMonthsAgo, $lte: currentDate },
          },
        },
        {
          $group: {
            _id: { $month: "$createTime" },
            count: { $sum: 1 },
          },
        },
      ]);

      const monthlyCounts = {
        JANUARY: 0,
        FEBRUARY: 0,
        MARCH: 0,
        APRIL: 0,
        MAY: 0,
        JUNE: 0,
        JULY: 0,
        AUGUST: 0,
        SEPTEMBER: 0,
        OCTOBER: 0,
        NOVEMBER: 0,
        DECEMBER: 0,
      };

      result.forEach((item) => {
        const monthIndex = item._id - 1; // MongoDB months are 1-indexed
        const monthName = new Date(currentDate.getFullYear(), monthIndex, 1)
          .toLocaleString("default", { month: "long" })
          .toUpperCase();
        monthlyCounts[monthName] = item.count;
      });

      res.status(200).json({
        success: true,
        message: "Retrieved comment counts by month",
        result: monthlyCounts,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error counting comments by month",
        error: error.message,
      });
    }
  }
}

module.exports = new CommentManagerController();

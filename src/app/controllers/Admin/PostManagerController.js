/* eslint-disable no-await-in-loop */
const mongoose = require("mongoose");
const { log } = require("console");
const Post = require("../../models/Post"); // Import Post model
const Like = require("../../models/Like"); // Import Like model
const User = require("../../models/User"); // Import User model
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const PostsResponse = require("../../../utils/DTO/PostsResponse");
const Cloudinary = require("../../../configs/cloudinary");

function handleInternalServerError(req, res, next, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class PostManagerController {
  // Lấy danh sách bài viết trong hệ thống
  async getListPosts(req, res, next) {
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
      // const posts = await Post.find()
      //   .populate("userId", "userName")
      //   .populate("postGroupId", "postGroupName")
      //   .populate("likes", "_id")
      //   .populate("comments", "_id")
      //   .sort({ postTime: -1 }); // Sắp xếp theo postTime giảm dần (-1 là desc)
      const posts = await Post.find()
        .populate({
          path: "userId",
          select: "userName role",
          populate: {
            path: "role",
            model: "Role",
            select: "roleName",
          },
        })
        .populate("postGroupId", "postGroupName")
        .populate("likes", "_id")
        .populate("comments", "_id")
        .sort({ postTime: -1 });

      console.log("posts", posts);
      const formattedPosts = posts.map((post) => {
        const likeIds = post.likes?.map((like) => like._id) || [];
        const commentIds = post.comments?.map((comment) => comment._id) || [];
        const roleNameP = post.userId.role ? post.userId.role.roleName : null;

        return new PostsResponse({
          postId: post._id,
          postTime: post.postTime,
          updateAt: post.updateAt,
          content: post.content,
          photos: post.photos,
          files: post.files,
          location: post.location,
          userId: post.userId._id,
          userName: post.userId.userName,
          postGroupId: post.postGroupId,
          postGroupName: post.postGroupId
            ? post.postGroupId.postGroupName
            : null,
          comments: commentIds,
          likes: likeIds,
          roleName: roleNameP,
          privacyLevel: post.privacyLevel,
        });
      });

      const result = {
        content: formattedPosts,
        pageable: {
          pageNumber: parseInt(page),
          pageSize: parseInt(items),
          sort: { empty: true, sorted: false, unsorted: true },
          offset: (parseInt(page) - 1) * parseInt(items),
          unpaged: false,
          paged: true,
        },
        last: true,
        totalElements: posts.length,
        totalPages: 1,
        size: parseInt(items),
        number: parseInt(page),
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: posts.length,
        empty: false,
      };

      res.status(200).json({
        success: true,
        message: "Retrieved List Posts Successfully",
        result,
        statusCode: 200,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(posts.length / parseInt(items)),
          count: posts.length,
          itemsPerPage: parseInt(items),
        },
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error); // Sử dụng hàm xử lý lỗi tùy chỉnh
    }
  }

  // Xóa bài viết
  async deletePost(req, res, next) {
    const { postId } = req.params; // Lấy postId từ request params

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

      const postIdObj = mongoose.Types.ObjectId(postId);

      // Xóa bài Post dựa trên postId và userId
      const deletedPost = await Post.findOneAndDelete({
        _id: postIdObj,
      });

      if (!deletedPost) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      // Sau khi xóa thành công, lấy danh sách tất cả bài Post còn lại
      const posts = await Post.find()
        .populate("userId", "userName")
        .populate("postGroupId", "postGroupName")
        .populate({
          path: "likes", // Tên trường chứa danh sách likeId trong PostSchema
          model: "likes", // Sử dụng tên model "likes" cho LikeSchema
          select: "_id", // Chọn chỉ trường _id trong LikeSchema
        });
      console.log("posts", posts);
      const formattedPosts = posts.map(
        (post) =>
          new PostsResponse({
            postId: post._id,
            postTime: post.postTime,
            updateAt: post.updateAt,
            content: post.content,
            photos: post.photos,
            files: post.files,
            location: post.location,
            userId: post.userId._id,
            userName: post.userId.userName,
            postGroupId: post.postGroupId,
            postGroupName: post.postGroupId
              ? post.postGroupId.postGroupName
              : null,
            comments: post.comments,
            likes: post.likes,
            roleName: post.roleName,
            privacyLevel: post.privacyLevel,
          })
      );

      return res.status(200).json({
        success: true,
        message: "Post deleted successfully",
        posts: formattedPosts, // Trả về danh sách bài Post còn lại sau khi xóa
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error); // Xử lý lỗi nếu có
    }
  }

  // Tạo bài viết
  async createPost(req, res) {
    const { authorization } = req.headers;
    const requestDTO = req.body;
    const token = authorization.split(" ")[1];
    const currentUserId = await authMethod.getUserIdFromJwt(token);
    const user = await getUserWithRole(currentUserId);
    if (!user || (user.role && user.role.roleName !== "Admin")) {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!requestDTO.content && req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Content or photo is required" });
    }

    try {
      const post = new Post({
        content: requestDTO.content,
        privacyLevel: requestDTO.privacyLevel,
        postGroupId: requestDTO.postGroupId,
        location: requestDTO.location,
        userId: currentUserId,
      });

      if (req.files && req.files.length > 0) {
        let photoURL = null;
        let fileURL = null;
        let photoUploaded = false; // Biến để kiểm soát việc upload ảnh
        let fileUploaded = false; // Biến để kiểm soát việc upload file

        for (const file of req.files) {
          if (!photoUploaded && file.fieldname === "photos") {
            photoURL = await Cloudinary.uploadPhotosToCloudinary(file.buffer);
            photoUploaded = true; // Đã upload ảnh, đặt cờ thành true để không upload ảnh nữa
          }
          if (!fileUploaded && file.fieldname === "files") {
            fileURL = await Cloudinary.uploadFilesToCloudinary(file.buffer);
            fileUploaded = true; // Đã upload file, đặt cờ thành true để không upload file nữa
          }

          // Kiểm tra nếu cả hai đã được upload thì thoát khỏi vòng lặp
          if (photoUploaded && fileUploaded) {
            break;
          }
        }

        if (photoURL) {
          post.photos = photoURL;
        }

        if (fileURL) {
          post.files = fileURL;
        }
      }

      await post.save();

      const postData = await Post.findById(post._id)
        .populate({
          path: "userId",
          select: "userName role",
          populate: {
            path: "role",
            model: "Role",
            select: "roleName",
          },
        })
        .populate("postGroupId", "postGroupName")
        .populate("likes", "_id")
        .populate("comments", "_id");

      const likeIds = postData.likes?.map((like) => like._id) || [];
      const commentIds = postData.comments?.map((comment) => comment._id) || [];
      const roleNameP = postData.userId.role
        ? postData.userId.role.roleName
        : null;

      const formattedPost = new PostsResponse({
        postId: postData._id,
        postTime: postData.postTime,
        updateAt: postData.updateAt,
        content: postData.content,
        photos: postData.photos,
        files: postData.files,
        location: postData.location,
        userId: postData.userId._id,
        userName: postData.userId.userName,
        postGroupId: postData.postGroupId,
        postGroupName: postData.postGroupId
          ? postData.postGroupId.postGroupName
          : null,
        comments: commentIds,
        likes: likeIds,
        roleName: roleNameP,
        privacyLevel: postData.privacyLevel,
      });

      const response = {
        success: true,
        message: "Post Created Successfully",
        result: formattedPost,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Đếm số lượng bài viết theo ngày, tuần, tháng, năm
  async countPosts(req, res) {
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
          const count = await Post.countDocuments({
            postTime: { $gte: interval.start, $lte: interval.end },
          });
          return { [interval.label]: count };
        })
      );
      const result = Object.assign({}, ...counts);
      res.status(200).json({
        success: true,
        message: "Retrieved post counts successfully",
        result,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error counting posts",
        error: error.message,
      });
    }
  }

  // Đếm số lượng bài viết theo tháng trong 12 tháng gần nhất
  async countPostsBy12Month(req, res, next) {
    const currentDate = new Date();
    const twelveMonthsAgo = new Date(currentDate);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    try {
      const result = await Post.aggregate([
        {
          $match: {
            postTime: { $gte: twelveMonthsAgo, $lte: currentDate },
          },
        },
        {
          $group: {
            _id: { $month: "$postTime" },
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
        message: "Retrieved post counts by month",
        result: monthlyCounts,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error counting posts by month",
        error: error.message,
      });
    }
  }
}

module.exports = new PostManagerController();

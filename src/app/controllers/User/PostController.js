/* eslint-disable no-await-in-loop */
const { log } = require("console");
const mongoose = require("mongoose");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const PostsResponse = require("../../../utils/DTO/PostsResponse");
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const Cloudinary = require("../../../configs/cloudinary");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class PostController {
  // Lấy những bài viết của user theo id
  async getPostsByUserId(req, res, next) {
    const userId = req.params;
    const { authorization } = req.headers;
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      if (currentUserId !== userId.userId) {
        return res.status(403).json({
          success: false,
          message: "User not found",
          statusCode: 403,
        });
      }
      const posts = await Post.find({ userId: userId.userId })
        .populate({
          path: "userId",
          select: "userName role",
          populate: [
            {
              path: "role",
              model: "Role",
              select: "roleName",
            },
          ],
        })
        .populate("postGroupId", "postGroupName")
        .populate("likes", "_id")
        .populate("comments", "_id")
        .sort({ postTime: -1 });

      // Khởi tạo mảng formattedPosts trước vòng lặp
      const formattedPosts = [];

      for (const post of posts) {
        // Truy vấn thông tin profile cho mỗi bài đăng
        const profile = await Profile.findOne({ user: post.userId }).exec();

        // Xử lý thông tin của từng bài đăng
        const likeIds = post.likes?.map((like) => like._id) || [];
        const commentIds = post.comments?.map((comment) => comment._id) || [];
        const roleNameP = post.userId.role ? post.userId.role.roleName : null;
        const avatar = profile ? profile.avatar : null;

        // Tạo đối tượng mới cho từng bài đăng và đẩy vào mảng formattedPosts
        const formattedPost = new PostsResponse({
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
          avatarUser: avatar,
        });

        formattedPosts.push(formattedPost);
      }

      if (formattedPosts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No posts found for this user",
          statusCode: 404,
        });
      }

      if (!posts) {
        return res.status(404).json({
          success: false,
          message: "No posts found for this user",
          statusCode: 404,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Retrieved user posts successfully and access update",
        result: formattedPosts,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  //  Lấy thông tin chi tiết của 1 bài viết
  async getPostDetailsByPostId(req, res, next) {
    const postId = req.params;
    const { authorization } = req.headers;
    log("postId", postId);
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      const post = await Post.findById(postId.postId)
        .populate({
          path: "userId",
          select: "userName role",
          populate: [
            {
              path: "role",
              model: "Role",
              select: "roleName",
            },
          ],
        })
        .populate("postGroupId", "postGroupName")
        .populate("likes", "_id")
        .populate("comments", "_id");

      if (!post) {
        return { success: false, message: "Post not found" };
      }

      const profile = await Profile.findOne({ user: post.userId }).exec();

      const likeIds = post.likes?.map((like) => like._id) || [];
      const commentIds = post.comments?.map((comment) => comment._id) || [];
      const roleNameP = post.userId.role ? post.userId.role.roleName : null;

      const formattedPost = new PostsResponse({
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
        postGroupName: post.postGroupId ? post.postGroupId.postGroupName : null,
        comments: commentIds,
        likes: likeIds,
        roleName: roleNameP,
        privacyLevel: post.privacyLevel,
        avatarUser: profile ? profile.avatar : null,
      });
      console.log(post.userId._id.toString());
      if (post.userId._id.toString() !== currentUserId) {
        return res.status(200).json({
          success: true,
          message: "Retrieving post successfully and access update denied",
          result: formattedPost,
          statusCode: 200,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Retrieving post successfully and access update",
        result: formattedPost,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  // Tạo bài viết
  async createPostByUser(req, res) {
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

    if (!requestDTO.content && req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Content or photo is required" });
    }

    let postGroupIdObj = null;
    if (
      requestDTO.postGroupId === undefined &&
      requestDTO.postGroupId === null &&
      requestDTO.postGroupId === "0"
    ) {
      postGroupIdObj = 0;
    }
    console.log("postGroupIdObj", postGroupIdObj);
    try {
      const post = new Post({
        content: requestDTO.content,
        privacyLevel: requestDTO.privacyLevel,
        postGroupId: postGroupIdObj,
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

  // Xóa bài viết
  async deletePostByUser(req, res, next) {
    const { postId } = req.params;
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
      const postIdObj = mongoose.Types.ObjectId(postId);
      if (userIdObj !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "Delete denied",
          statusCode: 403,
        });
      }
      // Xóa bài Post dựa trên postId và userId
      const deletedPost = await Post.findOneAndDelete({
        _id: postIdObj,
      });

      if (!deletedPost) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
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

  // Cập nhật bài viết
  async updatePostByUser(req, res, next) {
    const { authorization } = req.headers;
    const { postId } = req.params;
    const requestDTO = req.body;
    const token = authorization.split(" ")[1];
    const currentUserId = await authMethod.getUserIdFromJwt(token);
    const user = await getUserWithRole(currentUserId);
    const postIdObj = mongoose.Types.ObjectId(postId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    try {
      const post = await Post.findById(postIdObj);

      const userIdObj = post.userId.toString();

      if (!post) {
        return { success: false, message: "Post not found" };
      }

      if (userIdObj !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "Update denied",
          statusCode: 403,
        });
      }

      // Cập nhật các trường thông tin bài viết nếu có trong updateFields
      if (requestDTO.content) {
        post.content = requestDTO.content;
      }
      if (requestDTO.location) {
        post.location = requestDTO.location;
      }
      if (requestDTO.privacyLevel) {
        post.privacyLevel = requestDTO.privacyLevel;
      }
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

      // Lưu thông tin bài viết đã cập nhật
      await post.save();

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

  // Lấy 9 ảnh mới nhất từ bài viết của người dùng
  async getLatestUserPostImages(req, res, next) {
    const userId = req.params;
    try {
      const latestPostWithPhotos = await Post.find({
        userId: userId.userId,
        photos: { $ne: null },
      })
        .populate("photos")
        .select("photos")
        .sort({ postTime: -1 })
        .limit(9);

      console.log("latestPost", latestPostWithPhotos);
      const photosArray = latestPostWithPhotos.map((post) => post.photos);

      return res.status(200).json({
        success: true,
        message: "Retrieved photos successfully",
        content: photosArray,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error); // Xử lý lỗi nếu có
    }
  }
}

module.exports = new PostController();

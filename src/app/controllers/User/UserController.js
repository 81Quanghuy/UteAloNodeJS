/* eslint-disable no-await-in-loop */
const mongoose = require("mongoose");
const { log } = require("console");
const { User } = require("../../models/User");
const authMethod = require("../../../auth/auth.method");
const Profile = require("../../models/Profile");
const UserResponse = require("../../../utils/DTO/UserResponse");
const Cloudinary = require("../../../configs/cloudinary");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class UserManagerController {
  async getProfile(req, res) {
    const { authorization } = req.headers;
    const userId = req.params;
    const userIdObj = mongoose.Types.ObjectId(userId.userId);
    console.log("userId", userId.userId);
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      const user = await User.findById(userIdObj)
        .populate("account")
        .populate("role", "roleName")
        .exec();

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      const profile = await Profile.findOne({ user: userIdObj }).exec();

      const {
        _id: userId,
        userName,
        phone,
        address,
        dayOfBirth,
        gender,
        role,
        refreshToken,
        comments,
        isVerified,
        isOnline,
        lockTime,
      } = user;

      const roleName = user.role ? user.role.roleName : null;

      const { email, isActive, createdAt } = user.account || {}; // Lấy giá trị email từ account

      const { avatar, background, bio, updatedAt } = profile || {};

      const userResponseData = {
        userId: userId || null,
        phone: phone || null,
        email: email || null, // Sử dụng giá trị email từ account
        userName: userName || null,
        address: address || null,
        dayOfBirth: dayOfBirth || null,
        gender: gender || null,
        isActive: isActive || null,
        createdAt: createdAt || null,
        updatedAt: updatedAt || null,
        roleName: roleName || null,
        avatar: avatar || null,
        background: background || null,
        about: bio || null,
        friends: [], // Populate friends if needed
        postGroup: [], // Populate postGroup if needed
        accountActive: !!refreshToken && !lockTime,
      };

      const userResponse = new UserResponse(userResponseData);

      if (userIdObj !== currentUserId) {
        return res.status(200).json({
          success: true,
          message: "Retrieving user profile successfully and access update",
          result: userResponse,
          statusCode: 200,
        });
      }
      return res.status(200).json({
        success: true,
        message:
          "Retrieving user profile successfully and access update denied",
        result: userResponse,
        statusCode: 200,
      });
    } catch (error) {
      handleInternalServerError(req, res, error);
    }
  }

  async updateUserProfile(req, res) {
    const { authorization } = req.headers;
    const userData = req.body;
    console.log("userData11", userData);
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      // Update user information
      const updateFields = {};

      if (userData.fullName) {
        updateFields.userName = userData.fullName;
      }
      if (userData.dayOfBirth) {
        updateFields.dayOfBirth = userData.dateOfBirth;
      }
      if (userData.phone) {
        updateFields.phone = userData.phone;
      }
      if (userData.gender) {
        updateFields.gender = userData.gender;
      }
      if (userData.address) {
        updateFields.address = userData.address;
      }

      const userUpdate = await User.findByIdAndUpdate(
        currentUserId,
        updateFields,
        { new: true, runValidators: true }
      )
        .populate("account", "email isActive")
        .populate("role", "roleName");

      const profileUpdate = await Profile.findOneAndUpdate(
        { user: currentUserId },
        { bio: userData.about, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      log("userUpdate", userUpdate);
      log("profileUpdate", profileUpdate);

      const userResponseData = {
        userId: userUpdate._id || null,
        phone: userUpdate.phone || null,
        email: userUpdate.account ? userUpdate.account.email : null,
        userName: userUpdate.userName || null,
        avatar: profileUpdate.avatar || null,
        background: profileUpdate.background || null,
        address: userUpdate.address || null,
        dayOfBirth: userUpdate.dayOfBirth || null,
        about: profileUpdate.bio || null,
        gender: userUpdate.gender || null,
        // eslint-disable-next-line no-nested-ternary
        isActive: userUpdate.account
          ? userUpdate.account.isActive
            ? "Hoạt động"
            : "Bị khóa"
          : null,
        createdAt: profileUpdate.createdAt || null,
        updatedAt: profileUpdate.updatedAt || null,
        roleName: userUpdate.role ? userUpdate.role.roleName : null,
      };

      return res.status(200).json({
        success: true,
        message: "Update successful",
        result: userResponseData,
        statusCode: 200,
      });
    } catch (error) {
      throw new Error("Failed to update user profile");
    }
  }

  async updateAvatar(req, res) {
    const { authorization } = req.headers;
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);

      const profile = await Profile.findOne({ user: currentUserId });
      const avatarOld = profile.avatar;
      console.log("avatarOld", avatarOld);

      let photoURL = null;
      if (req.files && req.files.length > 0) {
        // let photoURL = null;

        for (const file of req.files) {
          if (file.fieldname === "imageFile") {
            photoURL = await Cloudinary.uploadPhotosToCloudinary(file.buffer);
            break;
          }
        }
      }

      //   if (photoURL && avatarOld !== photoURL && avatarOld) {
      //     // Delete the old avatar from Cloudinary
      //     await Cloudinary.deletePhotoFromCloudinary(avatarOld);
      //   }

      const profileUpdate = await Profile.findOneAndUpdate(
        { user: currentUserId },
        { avatar: photoURL, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: "Upload successful",
        result: photoURL,
        statusCode: 200,
      });
    } catch (error) {
      throw new Error("Failed to upload avatar");
    }
  }

  async updateBackground(req, res) {
    const { authorization } = req.headers;
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);

      let photoURL = null;
      if (req.files && req.files.length > 0) {
        // let photoURL = null;

        for (const file of req.files) {
          if (file.fieldname === "imageFile") {
            photoURL = await Cloudinary.uploadPhotosToCloudinary(file.buffer);
            break;
          }
        }
      }

      log("photoURL", photoURL);

      const profileUpdate = await Profile.findOneAndUpdate(
        { user: currentUserId },
        { background: photoURL, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: "Upload successful",
        result: photoURL,
        statusCode: 200,
      });
    } catch (error) {
      throw new Error("Failed to upload avatar");
    }
  }
}

module.exports = new UserManagerController();

/* eslint-disable no-await-in-loop */
const mongoose = require("mongoose");
const Friend = require("../../models/Friend");
const { User } = require("../../models/User");
const Profile = require("../../models/Profile");
const PostGroupMember = require("../../models/PostGroupMember");
const PostGroupPostGroupMember = require("../../models/PostGroupPostGroupMember");
const FriendResponse = require("../../../utils/DTO/FriendResponse");
const FriendRequest = require("../../models/FriendRequest");
const authMethod = require("../../../auth/auth.method");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class FriendController {
  // Danh sách bạn bè theo userId
  async getListFriendByUserId(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      console.log("user", user);

      const friends = await Friend.find({
        $or: [{ user1: userId }, { user2: userId }],
      })
        .populate("user1", "userName")
        .populate("user2", "userName")
        .exec();

      const formattedUsers = [];
      for (const friend of friends) {
        const friendUser =
          friend.user1._id.toString() === userId ? friend.user2 : friend.user1;
        const profile = await Profile.findOne({ user: friendUser._id });
        const formattedUser = new FriendResponse({
          userId: friendUser._id,
          username: friendUser.userName,
          avatar: profile.avatar,
          background: profile.background,
        });
        formattedUsers.push(formattedUser);
      }

      return res.status(200).json({
        success: true,
        message: "Get List Friend Successfully",
        result: formattedUsers,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving user's friends",
        result: null,
        statusCode: 500,
      });
    }
  }

  // Lấy danh sách bạn bè có phân trang
  async getListFriendTop10ByUserId(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      console.log("user", user);

      const options = {
        page,
        limit,
        populate: [
          { path: "user1", select: "userName" },
          { path: "user2", select: "userName" },
        ],
      };

      const { docs: friends, totalDocs: totalFriends } = await Friend.paginate(
        {
          $or: [{ user1: userId }, { user2: userId }],
        },
        options
      );

      const formattedUsers = [];
      for (const friend of friends) {
        const friendUser =
          friend.user1._id.toString() === userId ? friend.user2 : friend.user1;
        const profile = await Profile.findOne({ user: friendUser._id });

        const formattedUser = new FriendResponse({
          userId: friendUser._id,
          username: friendUser.userName,
          avatar: profile ? profile.avatar : null,
          background: profile ? profile.background : null,
        });
        formattedUsers.push(formattedUser);
      }

      return res.status(200).json({
        success: true,
        message: "Get List Friend Successfully",
        result: formattedUsers,
        totalFriends,
        currentPage: page,
        totalPages: Math.ceil(totalFriends / limit),
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving user's friends",
        result: null,
        statusCode: 500,
      });
    }
  }

  // Gửi lời mời kết bạn
  async sendFriendRequest(req, res, next) {
    const { authorization } = req.headers;
    const { userId } = req.params;
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      const user1 = await User.findById(currentUserId);
      const user2 = await User.findById(userId);

      console.log("user1", user1);
      console.log("user2", user2);

      if (!user1 || !user2) {
        return res.status(404).json({
          success: false,
          message: "Cannot found user",
          statusCode: 404,
          result: null,
        });
      }

      const friendRequest = new FriendRequest({
        userFrom: user1,
        userTo: user2,
        isActive: true,
      });

      await friendRequest.save();

      return res.status(200).json({
        success: true,
        message: "Create Successful!",
        result: friendRequest,
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error);
    }
  }

  // Chấp nhận lời mời kết bạn
  async updateUser(req, res) {
    const { authorization } = req.headers;
    const { userId } = req.params;
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      console.log("userId", userId);
      console.log("currentUserId", currentUserId);
      const userTo = await User.findById(currentUserId);
      const userFrom = await User.findById(userId);

      console.log("userFrom", userFrom);
      console.log("userTo", userTo);

      if (!userFrom || !userTo) {
        return res.status(404).json({
          success: false,
          message: "Cannot found user",
          statusCode: 404,
          result: null,
        });
      }

      // Kiểm tra xem có yêu cầu kết bạn từ userFrom đến userTo không
      const friendRequest = await FriendRequest.findOne({
        userFrom: userFrom._id,
        userTo: userTo._id,
      });

      console.log("friendRequest", friendRequest);

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found",
          statusCode: 404,
          result: null,
        });
      }

      const existingFriend = await Friend.findOne({
        $or: [
          { user1: userFrom._id, user2: userTo._id },
          { user1: userTo._id, user2: userFrom._id },
        ],
      });

      console.log("existingFriend", existingFriend);

      if (existingFriend) {
        return res.status(404).json({
          success: false,
          message: "Both was friend before",
          statusCode: 403,
          result: null,
        });
      }

      const newFriend = new Friend({
        user1: userFrom._id,
        user2: userTo._id,
        status: true, // Có thể thêm trạng thái bạn bè tại đây
      });

      console.log("newFriend", newFriend);

      await newFriend.save();

      if (newFriend) {
        await FriendRequest.findOneAndDelete({ _id: friendRequest._id });
      }
      return res.status(200).json({
        success: false,
        message: "Accept Successful!",
        statusCode: 200,
        result: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error",
        result: null,
        statusCode: 500,
      });
    }
  }

  // Xóa bạn
  async deleteFriend(req, res) {
    const { authorization } = req.headers;
    const { userId } = req.params;
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      console.log("userId", userId);
      console.log("currentUserId", currentUserId);
      const userTo = await User.findById(userId);
      const userFrom = await User.findById(currentUserId);

      console.log("userFrom", userFrom);
      console.log("userTo", userTo);

      if (!userFrom || !userTo) {
        return res.status(404).json({
          success: false,
          message: "Cannot found user",
          statusCode: 404,
          result: null,
        });
      }

      const existingFriend = await Friend.findOneAndDelete({
        $or: [
          { user1: userFrom._id, user2: userTo._id },
          { user1: userTo._id, user2: userFrom._id },
        ],
      });

      console.log("existingFriend", existingFriend);

      if (!existingFriend) {
        return res.status(404).json({
          success: false,
          message: "Both wasn't friend before",
          statusCode: 403,
          result: null,
        });
      }

      return res.status(200).json({
        success: false,
        message: "Delete Successful!",
        statusCode: 200,
        result: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error",
        result: null,
        statusCode: 500,
      });
    }
  }

  // Từ chối lời mời kết bạn
  async deleteFriendRequest(req, res) {
    const { authorization } = req.headers;
    const { userIdFrom } = req.params;
    console.log("userIdFrom", userIdFrom);
    try {
      const token = authorization.split(" ")[1];
      const userIdTo = await authMethod.getUserIdFromJwt(token);

      const userTo = await User.findById(userIdTo);
      const userFrom = await User.findById(userIdFrom);

      console.log("userFrom", userFrom);
      console.log("userTo", userTo);

      if (!userFrom || !userTo) {
        return res.status(404).json({
          success: false,
          message: "Cannot found user",
          statusCode: 404,
          result: null,
        });
      }

      // Kiểm tra xem có yêu cầu kết bạn từ userFrom đến userTo không
      const friendRequest = await FriendRequest.findOneAndDelete({
        userFrom: userFrom._id,
        userTo: userTo._id,
      });

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found",
          statusCode: 404,
          result: null,
        });
      }

      return res.status(200).json({
        success: false,
        message: "Delete Successful!",
        statusCode: 200,
        result: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error",
        result: null,
        statusCode: 500,
      });
    }
  }

  // Xóa yêu cầu kết bạn đã gửi
  async cancelRequestFriend(req, res) {
    const { authorization } = req.headers;
    const { userIdTo } = req.params;
    try {
      const token = authorization.split(" ")[1];
      const userIdFrom = await authMethod.getUserIdFromJwt(token);

      const userTo = await User.findById(userIdTo);
      const userFrom = await User.findById(userIdFrom);

      console.log("userFrom", userFrom);
      console.log("userTo", userTo);

      if (!userFrom || !userTo) {
        return res.status(404).json({
          success: false,
          message: "Cannot found user",
          statusCode: 404,
          result: null,
        });
      }

      // Kiểm tra xem có yêu cầu kết bạn từ userFrom đến userTo không
      const friendRequest = await FriendRequest.findOneAndDelete({
        userFrom: userFrom._id,
        userTo: userTo._id,
      });

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found",
          statusCode: 404,
          result: null,
        });
      }
      return res.status(200).json({
        success: false,
        message: "Delete Successful!",
        statusCode: 200,
        result: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error",
        result: null,
        statusCode: 500,
      });
    }
  }

  // Lấy danh sách lời mời đã nhận
  async getRequestList(req, res) {
    const { authorization } = req.headers;
    try {
      const token = authorization.split(" ")[1];
      const userIdTo = await authMethod.getUserIdFromJwt(token);

      const userTo = await User.findById(userIdTo);

      console.log("userTo", userTo);

      if (!userTo) {
        return res.status(404).json({
          success: false,
          message: "Cannot found user",
          statusCode: 404,
          result: null,
        });
      }

      // Kiểm tra xem có yêu cầu kết bạn nhận được không
      const friendRequests = await FriendRequest.find({
        userTo: userTo._id,
      });

      if (!friendRequests) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found",
          statusCode: 404,
          result: null,
        });
      }

      console.log("friendRequests", friendRequests);

      const formattedUsers = [];
      for (const friendRequest of friendRequests) {
        const profile = await Profile.findOne({ user: friendRequest.userFrom });
        const user = await User.findById(friendRequest.userFrom);

        const formattedUser = new FriendResponse({
          userId: friendRequest.userFrom,
          username: user.userName,
          avatar: profile ? profile.avatar : null,
          background: profile ? profile.background : null,
        });
        formattedUsers.push(formattedUser);
      }

      return res.status(200).json({
        success: false,
        message: "Retrieved Successful!",
        statusCode: 200,
        result: formattedUsers,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error",
        result: null,
        statusCode: 500,
      });
    }
  }

  // Lấy danh sách lời mời đã nhận có phân trang
  async getRequestListTop10(req, res) {
    const { authorization } = req.headers;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    try {
      const token = authorization.split(" ")[1];
      const userIdTo = await authMethod.getUserIdFromJwt(token);

      const userTo = await User.findById(userIdTo);

      if (!userTo) {
        return res.status(404).json({
          success: false,
          message: "Cannot found user",
          statusCode: 404,
          result: null,
        });
      }

      // Tính toán số lượng bạn bè
      const totalFriends = await FriendRequest.countDocuments({
        userTo: userTo._id,
      });

      // Lấy danh sách yêu cầu kết bạn cho trang hiện tại
      const friendRequests = await FriendRequest.find({
        userTo: userTo._id,
      })
        .skip((page - 1) * limit)
        .limit(limit);

      if (!friendRequests || friendRequests.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found",
          statusCode: 404,
          result: null,
        });
      }

      const formattedUsers = [];
      for (const friendRequest of friendRequests) {
        const profile = await Profile.findOne({ user: friendRequest.userFrom });
        const user = await User.findById(friendRequest.userFrom);

        const formattedUser = new FriendResponse({
          userId: friendRequest.userFrom,
          username: user.userName,
          avatar: profile ? profile.avatar : null,
          background: profile ? profile.background : null,
        });
        formattedUsers.push(formattedUser);
      }

      return res.status(200).json({
        success: true,
        message: "Retrieved Successful!",
        statusCode: 200,
        result: formattedUsers,
        totalFriends,
        currentPage: page,
        totalPages: Math.ceil(totalFriends / limit),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error",
        result: null,
        statusCode: 500,
      });
    }
  }

  // Lấy danh sách lời mời đã gửi
  async getRequestListFrom(req, res) {
    const { authorization } = req.headers;
    try {
      const token = authorization.split(" ")[1];
      const userIdFrom = await authMethod.getUserIdFromJwt(token);

      const userFrom = await User.findById(userIdFrom);

      console.log("userTo", userFrom);

      if (!userFrom) {
        return res.status(404).json({
          success: false,
          message: "Cannot found user",
          statusCode: 404,
          result: null,
        });
      }

      // Kiểm tra xem có yêu cầu kết bạn nhận được không
      const friendRequests = await FriendRequest.find({
        userFrom: userFrom._id,
      });

      if (!friendRequests) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found",
          statusCode: 404,
          result: null,
        });
      }

      console.log("friendRequests", friendRequests);

      const formattedUsers = [];
      for (const friendRequest of friendRequests) {
        const profile = await Profile.findOne({ user: friendRequest.userTo });
        const user = await User.findById(friendRequest.userTo);

        const formattedUser = new FriendResponse({
          userId: friendRequest.userTo,
          username: user.userName,
          avatar: profile ? profile.avatar : null,
          background: profile ? profile.background : null,
        });
        formattedUsers.push(formattedUser);
      }

      return res.status(200).json({
        success: false,
        message: "Retrieved Successful!",
        statusCode: 200,
        result: formattedUsers,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error",
        result: null,
        statusCode: 500,
      });
    }
  }

  // Lấy danh sách gợi ý kết bạn
  getSuggestionList = async (req, res) => {
    const { authorization } = req.headers;
    try {
      const token = authorization.split(" ")[1];
      const userId = await authMethod.getUserIdFromJwt(token);
      console.log("userId", userId);

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          statusCode: 404,
          result: null,
        });
      }

      console.log("user", user);

      // Tìm danh sách những người chung nhóm
      const commonGroupMembers = await this.findCommonGroupMembers(userId);

      return res.status(200).json({
        success: true,
        message: "Get Suggestion List Successfully!",
        result: commonGroupMembers, // Trả về danh sách những người chung nhóm
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error",
        result: null,
        statusCode: 500,
      });
    }
  };

  findCommonGroupMembers = async (userId) => {
    try {
      // Tìm tất cả các PostGroupMember mà user tham gia
      const userGroupMembers = await PostGroupMember.find({ user: userId });
      const userGroupMemberIds = userGroupMembers.map((member) => member._id);

      // Tìm tất cả các PostGroupMembers khác tham gia vào các nhóm mà user tham gia
      const commonGroupMembers = await PostGroupMember.find({
        _id: { $nin: userGroupMemberIds }, // Tìm các bản ghi mà _id không nằm trong mảng userGroupMemberIds
        postGroup: { $in: userGroupMembers.map((member) => member.postGroup) },
      });

      const formattedUsers = [];
      for (const member of commonGroupMembers) {
        const user = await User.findById(member.user);
        const profile = await Profile.findOne({ user: member.user });
        console.log("profile", profile);
        const formattedUser = new FriendResponse({
          userId: user._id,
          username: user.userName,
          avatar: profile ? profile.avatar : null,
          background: profile ? profile.background : null,
        });
        formattedUsers.push(formattedUser);
      }

      return formattedUsers;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  async getStatusByUserId(req, res) {
    const { authorization } = req.headers;
    const { userId } = req.params;
    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);

      const user = await User.findById(currentUserId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          statusCode: 404,
          result: null,
        });
      }

      const friend = await Friend.findOne({
        $or: [
          { user1: currentUserId, user2: userId },
          { user1: userId, user2: currentUserId },
        ],
      });

      if (friend) {
        return res.status(200).json({
          success: true,
          message: "Bạn bè",
          result: null,
          statusCode: 200,
        });
      }

      const friendRequest1 = await FriendRequest.findOne({
        userFrom: currentUserId,
        userTo: userId,
      });

      if (friendRequest1) {
        return res.status(200).json({
          success: true,
          message: "Đã gửi lời mời!",
          result: null,
          statusCode: 200,
        });
      }

      const friendRequest2 = await FriendRequest.findOne({
        userFrom: userId,
        userTo: currentUserId,
      });

      if (friendRequest2) {
        return res.status(200).json({
          success: true,
          message: "Chấp nhận lời mời",
          result: null,
          statusCode: 200,
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error",
        result: null,
        statusCode: 500,
      });
    }
  }
}

module.exports = new FriendController();

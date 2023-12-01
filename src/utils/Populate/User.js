const moongose = require("mongoose");
const { User } = require("../../app/models/User");
const Account = require("../../app/models/Account");

exports.populateImage = async (userID) => {
  const user = await User.findById(moongose.Types.ObjectId(userID))
    .populate({ path: "profilePicture", select: "_id link" })
    .populate({ path: "coverPicture", select: "_id link" })
    .populate({ path: "role", select: "_id name" });
  return user;
};

exports.populateUser = async (userID) => {
  const user = await User.findById(moongose.Types.ObjectId(userID))
    .populate({ path: "profilePicture", select: "_id link" })
    .populate({ path: "coverPicture", select: "_id link" })
    .populate({
      path: "friends.user",
      select: "_id fullname profilePicture isOnline",
    })
    .populate({
      path: "education.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "education.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "work.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "work.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "contact.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "contact.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "gender.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "gender.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "friendRequests.user",
      select: "_id fullname profilePicture isOnline",
    })
    .populate({
      path: "sentRequests.user",
      select: "_id fullname profilePicture isOnline",
    })
    .populate({ path: "role", select: "_id name" });
  return user;
};

exports.populateUserForOther = async (userId) => {
  const user = await User.findById(moongose.Types.ObjectId(userId))
    .populate({ path: "profilePicture", select: "_id link" })
    .populate({ path: "coverPicture", select: "_id link" })
    .populate({
      path: "friends.user",
      select: "_id fullname profilePicture isOnline",
    })
    .populate({
      path: "education.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "education.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "work.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "work.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "contact.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "contact.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "gender.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .populate({
      path: "gender.privacy.excludes",
      select: "_id fullname profilePicture isOnline",
      populate: {
        path: "profilePicture",
        select: "_id link",
      },
    })
    .select(
      "-password -loginAttempts -sentRequests -friendRequests -role -refreshToken"
    );

  return user;
};

exports.populateUserByEmail = async (email) => {
  const account = await Account.findOne({ email });
  if (!account) {
    return null;
  }
  const user = await User.findById(moongose.Types.ObjectId(account.user._id))
    .populate({
      path: "role",
      select: "_id roleName",
    })
    .populate("account", "isActive");
  // thêm thuộc tính password vào user
  user.password = account.password;
  return user;
};

exports.getUserWithRole = async (userId) => {
  try {
    const user = await User.findById(userId).populate({
      path: "role",
      model: "Role", // Sửa thành tên model tương ứng với role
      select: "roleName",
    });

    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};

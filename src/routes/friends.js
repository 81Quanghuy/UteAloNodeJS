const express = require("express");

const router = express.Router();
const FriendController = require("../app/controllers/User/FriendController");

// Danh sách bạn bè theo userId
router.get("/list/:userId", FriendController.getListFriendByUserId);

// Lấy danh sách bạn bè có phân trang
router.get(
  "/list/pageable/:userId",
  FriendController.getListFriendTop10ByUserId
);

// Gửi lời mời kết bạn
router.post("/request/send/:userId", FriendController.sendFriendRequest);

// Chấp nhận lời mời kết bạn
router.put("/request/accept/:userId", FriendController.updateUser);

// Xóa bạn
router.put("/delete/:userId", FriendController.deleteFriend);

// Từ chối lời mời kết bạn
router.put("/request/delete/:userIdFrom", FriendController.deleteFriendRequest);

// Xóa yêu cầu kết bạn đã gửi
router.put("/request/cancel/:userIdTo", FriendController.cancelRequestFriend);

// Lấy danh sách lời mời đã nhận
router.get("/request/list", FriendController.getRequestList);

// Lấy danh sách lời mời đã nhận có phân trang
router.get("/request/list/pageable", FriendController.getRequestListTop10);

// Lấy danh sách lời mời đã gửi
router.get("/requestFrom/list", FriendController.getRequestListFrom);

// Lấy danh sách gợi ý kết bạn
router.get("/suggestion/list", FriendController.getSuggestionList);

// Lấy trạng thái người dùng dựa vào userId và currentUserId
router.get("/status/:userId", FriendController.getStatusByUserId);

module.exports = router;

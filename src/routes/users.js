const router = require("express").Router();
const UserController = require("../app/controllers/User/UserController");

// Lấy thông tin người dùng
router.get("/profile/:userId", UserController.getProfile);

// Cập nhật thông tin người dùng
router.put("/update", UserController.updateUserProfile);

// Cập nhật ảnh đại diện
router.put("/avatar", UserController.updateAvatar);

// Cập nhật ảnh bìa
router.put("/background", UserController.updateBackground);

module.exports = router;

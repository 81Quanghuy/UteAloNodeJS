const router = require("express").Router();
const PostManagerController = require("../app/controllers/Admin/PostManagerController");
const UserManagerController = require("../app/controllers/Admin/UserManagerController");
const CommentManagerController = require("../app/controllers/Admin/CommentManagerController");
const GroupManagerController = require("../app/controllers/Admin/GroupManagerController");

// Lấy danh sách bài viết trong hệ thống
router.get("/postManager/list", PostManagerController.getListPosts);

// Xóa bài viết trong hệ thống
router.put("/postManager/delete/:postId", PostManagerController.deletePost);

// Tạo bài viết trong hệ thống
router.post("/postManager/create", PostManagerController.createPost);

// Lấy dánh người dùng trong hệ thống
router.get("/userManager/list", UserManagerController.getListUsers);

// Cập nhật trạng thái và quyền của người dùng
router.put("/userManager/update", UserManagerController.updateUser);

// Lấy danh sách bình luận trong hệ thống
router.get("/commentManager/list", CommentManagerController.getListComments);

// Xóa bình luận trong hệ thống
router.put(
  "/commentManager/delete/:commentId",
  CommentManagerController.deleteComment
);

// Lấy danh sách nhóm trong hệ thống
router.get("/groupManager/list", GroupManagerController.getListGroups);

// Đếm số lượng bài viết
router.get("/postManager/countPost", PostManagerController.countPosts);

// Đếm số lượng bài viết theo 12 tháng trong năm
router.get(
  "/postManager/countPostsByMonthInYear",
  PostManagerController.countPostsBy12Month
);

// Đếm số lượng bình luận
router.get(
  "/commentManager/countComment",
  CommentManagerController.countComments
);

// Đếm số bình luận theo 12 tháng trong năm
router.get(
  "/commentManager/countCommentsByMonthInYear",
  CommentManagerController.countCommentsBy12Month
);

// Đếm số lượng người dùng
router.get("/userManager/countUser", UserManagerController.countUsers);

// Đếm số lượng người dùng theo 12 tháng trong năm
router.get(
  "/userManager/countUsersByMonthInYear",
  UserManagerController.countUsersBy12Month
);

// Đếm số lượng bài viết
router.get("/groupManager/countGroup", GroupManagerController.countGroups);

// Đếm số lượng bài viết theo 12 tháng trong năm
router.get(
  "/groupManager/countGroupsByMonthInYear",
  GroupManagerController.countGroupsBy12Month
);

module.exports = router;

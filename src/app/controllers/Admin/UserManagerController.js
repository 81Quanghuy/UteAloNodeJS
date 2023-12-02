const { User } = require("../../models/User");
const Account = require("../../models/Account");
const Role = require("../../models/Role");
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const UsersResponse = require("../../../utils/DTO/UsersResponse");

function handleInternalServerError(req, res, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class UserManagerController {
  async getListUsers(req, res, next) {
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
      const users = await User.find()
        .populate("role", "roleName")
        .populate("account", "isActive email")
        .sort({ dayOfBirth: -1 });
      console.log("users", users);
      const formattedUsers = users.map(
        (user) =>
          new UsersResponse({
            userId: user._id,
            userName: user.userName || null,
            address: user.address || null,
            phone: user.phone || null,
            gender: user.gender || null,
            dayOfBirth: user.dayOfBirth || null,
            isActive: user.account.isActive === true ? "Hoạt động" : "Bị khóa",
            roleName: user.role ? user.role.roleName : null,
            email: user.account ? user.account.email : null,
          })
      );

      const result = {
        content: formattedUsers,
        pageable: {
          pageNumber: parseInt(page),
          pageSize: parseInt(items),
          sort: { empty: true, sorted: false, unsorted: true },
          offset: (parseInt(page) - 1) * parseInt(items),
          unpaged: false,
          paged: true,
        },
        last: true,
        totalElements: users.length,
        totalPages: 1,
        size: parseInt(items),
        number: parseInt(page),
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: users.length,
        empty: false,
      };

      res.status(200).json({
        success: true,
        message: "Retrieved List Users Successfully",
        result,
        statusCode: 200,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(users.length / parseInt(items)),
          count: users.length,
          itemsPerPage: parseInt(items),
        },
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error);
    }
  }

  async updateUser(req, res) {
    const { authorization } = req.headers;
    const { userId, isActive, roleName } = req.body;

    try {
      const token = authorization.split(" ")[1];
      const currentUserId = await authMethod.getUserIdFromJwt(token);
      const userAdmin = await getUserWithRole(currentUserId);

      if (
        !userAdmin ||
        (userAdmin.role && userAdmin.role.roleName !== "Admin")
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Access Denied" });
      }

      const user = await User.findById(userId)
        .populate("role", "roleName")
        .populate("account", "isActive");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          statusCode: 404,
        });
      }

      await Account.findByIdAndUpdate(user.account._id, { isActive });
      await Role.findByIdAndUpdate(user.role._id, { roleName });

      // Lấy lại thông tin người dùng sau khi cập nhật
      const updatedUser = await User.findById(userId)
        .populate("role", "roleName")
        .populate("account", "isActive");

      // Trả về thông tin người dùng đã cập nhật
      return res.status(200).json({
        success: true,
        message: "Update successful",
        result: new UsersResponse({
          userId: updatedUser._id,
          userName: updatedUser.userName || null,
          address: updatedUser.address || null,
          phone: updatedUser.phone || null,
          gender: updatedUser.gender || null,
          dayOfBirth: updatedUser.dayOfBirth || null,
          isActive: updatedUser.account.isActive ? "Hoạt động" : "Bị khóa",
          roleName: updatedUser.role ? updatedUser.role.roleName : null,
          email: updatedUser.account ? updatedUser.account.email : null,
        }),
        statusCode: 200,
      });
    } catch (error) {
      // Xử lý lỗi nếu có
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        statusCode: 500,
      });
    }
  }

  async countUsers(req, res) {
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
          const count = await Account.countDocuments({
            createdAt: { $gte: interval.start, $lte: interval.end },
          });
          return { [interval.label]: count };
        })
      );

      const result = Object.assign({}, ...counts);

      res.status(200).json({
        success: true,
        message: "Retrieved user counts successfully",
        result,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error counting users",
        error: error.message,
      });
    }
  }

  async countUsersBy12Month(req, res) {
    const today = new Date();
    const year = today.getFullYear();
    const months = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];

    try {
      const counts = await Promise.all(
        months.map(async (monthName, index) => {
          // Create start and end dates for each month
          const startDate = new Date(year, index, 1);
          const endDate = new Date(year, index + 1, 0, 23, 59, 59, 999); // Last day of the month

          const count = await Account.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
          });

          return { [monthName]: count };
        })
      );

      const result = Object.assign({}, ...counts);

      res.status(200).json({
        success: true,
        message: "Retrieved user counts by month successfully",
        result,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error counting users by month",
        error: error.message,
      });
    }
  }
}

module.exports = new UserManagerController();

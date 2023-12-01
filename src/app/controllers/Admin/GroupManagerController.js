const mongoose = require("mongoose");
const PostGroup = require("../../models/PostGroup"); // Import PostGroup model
const authMethod = require("../../../auth/auth.method");
const { getUserWithRole } = require("../../../utils/Populate/User");
const GroupsResponse = require("../../../utils/DTO/GroupsResponse");

function handleInternalServerError(req, res, next, error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}

class PostManagerController {
  async getListGroups(req, res, next) {
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
      const groups = await PostGroup.find().sort({ createAt: -1 }); // Sắp xếp theo postTime giảm dần (-1 là desc)
      console.log("groups", groups);
      const formattedGroups = groups.map(
        (group) =>
          new GroupsResponse({
            postGroupId: group._id,
            postGroupName: group.postGroupName || null,
            avatarGroup: group.avatarGroup || null,
            bio: group.bio || null,
            isPublic: group.isPublic || null,
            createAt: group.createAt || null,
          })
      );

      const result = {
        content: formattedGroups,
        pageable: {
          pageNumber: parseInt(page),
          pageSize: parseInt(items),
          sort: { empty: true, sorted: false, unsorted: true },
          offset: (parseInt(page) - 1) * parseInt(items),
          unpaged: false,
          paged: true,
        },
        last: true,
        totalElements: groups.length,
        totalPages: 1,
        size: parseInt(items),
        number: parseInt(page),
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: groups.length,
        empty: false,
      };

      res.status(200).json({
        success: true,
        message: "Retrieved List Groups Successfully",
        result,
        statusCode: 200,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(groups.length / parseInt(items)),
          count: groups.length,
          itemsPerPage: parseInt(items),
        },
      });
    } catch (error) {
      handleInternalServerError(req, res, next, error); // Sử dụng hàm xử lý lỗi tùy chỉnh
    }
  }

  async countGroups(req, res) {
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
          const count = await PostGroup.countDocuments({
            createAt: { $gte: interval.start, $lte: interval.end },
          });
          return { [interval.label]: count };
        })
      );
      const result = Object.assign({}, ...counts);
      res.status(200).json({
        success: true,
        message: "Retrieved group counts successfully",
        result,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error counting groups",
        error: error.message,
      });
    }
  }

  async countGroupsBy12Month(req, res, next) {
    const currentDate = new Date();
    const twelveMonthsAgo = new Date(currentDate);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    try {
      const result = await PostGroup.aggregate([
        {
          $match: {
            createAt: { $gte: twelveMonthsAgo, $lte: currentDate },
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
        message: "Retrieved group counts by month",
        result: monthlyCounts,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error counting groups by month",
        error: error.message,
      });
    }
  }
}

module.exports = new PostManagerController();

const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");

const FriendSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "friends",
  }
);

// soft delete
FriendSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

// paginate
FriendSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Friend", FriendSchema);

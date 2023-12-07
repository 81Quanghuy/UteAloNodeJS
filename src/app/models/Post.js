const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    postGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PostGroup",
    },
    postTime: {
      type: Date,
      default: Date.now,
    },
    updateAt: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: String,
    },
    content: {
      type: String,
    },
    photos: {
      type: String,
    },
    files: {
      type: String,
    },
    privacyLevel: {
      type: String,
      enum: ["PUBLIC", "FRIENDS", "GROUP_MEMBERS", "PRIVATE", "ADMIN"],
    },
    // Mối quan hệ với Like
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Like",
      },
    ],
    // Mối quan hệ với Comment
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

// soft delete
PostSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

// paginate
PostSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Post", PostSchema);

const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
    },
    photos: {
      type: String,
    },
    createTime: {
      type: Date,
      default: Date.now,
    },
    updateAt: {
      type: Date,
      default: Date.now,
    },
    // Mối quan hệ với Share
    share: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Share",
    },
    // Mối quan hệ với chính nó (Comment)
    commentReply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    // Mối quan hệ với Post
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Like",
      },
    ],
  },
  { timestamps: true }
);

// Plugin cho soft delete
CommentSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

// Plugin cho paginate
CommentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Comment", CommentSchema);

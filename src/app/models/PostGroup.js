const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");

const { Schema } = mongoose;

const PostGroupSchema = new Schema({
  postGroupName: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
  avatarGroup: {
    type: String,
  },
  backgroundGroup: {
    type: String,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  isApprovalRequired: {
    type: Boolean,
    default: false,
  },
});
// soft delete
PostGroupSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

// paginate
PostGroupSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("PostGroup", PostGroupSchema);

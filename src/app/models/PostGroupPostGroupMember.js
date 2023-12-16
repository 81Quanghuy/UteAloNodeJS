const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");

const PostGroupPostGroupMemberSchema = new mongoose.Schema({
  postGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PostGroup",
  },
  postGroupMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PostGroupMember",
  },
});
// soft delete
PostGroupPostGroupMemberSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

// paginate
PostGroupPostGroupMemberSchema.plugin(mongoosePaginate);
module.exports = mongoose.model(
  "PostGroupPostGroupMember",
  PostGroupPostGroupMemberSchema
);

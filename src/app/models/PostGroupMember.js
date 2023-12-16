const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");

const PostGroupMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  roleUserGroup: {
    type: String,
    enum: ["Admin", "Member"],
    default: "Member",
  },
});
// soft delete
PostGroupMemberSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

// paginate
PostGroupMemberSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("PostGroupMember", PostGroupMemberSchema);

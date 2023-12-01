const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");

const ProfileSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    background: {
      type: String,
    },
    bio: {
      type: String,
    },
  },
  { timestamps: true }
);

// soft delete
ProfileSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

// paginate
ProfileSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Profile", ProfileSchema);

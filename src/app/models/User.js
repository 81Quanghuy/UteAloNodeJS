const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");
const Joi = require("joi");
const Account = require("./Account");

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      require: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: Number,
    },
    dayOfBirth: {
      type: Date,
    },
    address: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    refreshToken: {
      type: String,
    },
    lockTime: {
      type: Date,
    },
    // Mối quan hệ với Comment
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    friend: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Friend",
      },
    ],
  },
  { timestamps: true, collection: "users" }
);

// soft delete
UserSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

// Validate
const validate = (user) => {
  const schema = Joi.object({
    userName: Joi.string().min(1).max(50),
    dayOfBirth: Joi.date(),
  });

  return schema.validate(user);
};

// paginate
UserSchema.plugin(mongoosePaginate);

const hiddenField = ["refreshToken"];
const User = mongoose.model(
  "User",
  UserSchema.set("toJSON", {
    transform(doc, user) {
      hiddenField.forEach((field) => delete user[field]);
      return user;
    },
  })
);

module.exports = { User, validate };

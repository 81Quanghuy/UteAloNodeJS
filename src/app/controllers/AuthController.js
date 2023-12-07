/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
const crypto = require("crypto");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const authMethod = require("../../auth/auth.method");
const redisClient = require("../../configs/redis/index");
// const randToken = require('rand-Token');
const { populateUserByEmail } = require("../../utils/Populate/User");
const { sendEmail, sendMailOTP } = require("../../utils/Mail/sendMail");
const Token = require("../models/VerificationToken");
const { User } = require("../models/User");
const Account = require("../models/Account");
const Profile = require("../models/Profile");
const PostGroup = require("../models/PostGroup");
const RefreshToken = require("../models/RefreshToken");
const PostGroupMember = require("../models/PostGroupMember");
const { responseError } = require("../../utils/Response/error");
const speakeasy = require("speakeasy");
const Role = require("../models/Role");

const accessTokenLife = process.env.ACCESS_TOKEN_LIFE;
const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE;
const refreshTokenSecret = crypto.randomBytes(32).toString("hex");
class AuthoController {
  // send OTP verify
  async sendOTPverify(req, res, next) {
    console.log(req);
    try {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        fullname: Joi.string().required(),
      }).unknown();
      const { error } = schema.validate(req.body);
      if (error) {
        return responseError(res, 400, error.details[0].message);
      }

      // check email exsit
      const account = await Account.findOne({ email: req.body.email });
      if (account) return responseError(res, 400, "Email đã tồn tại");

      // Tạo một bí mật ngẫu nhiên
      const secret = speakeasy.generateSecret({ length: 20 });

      // Tạo mã OTP
      const otp = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
      });

      // save otp to redis set time expire 5m
      await redisClient.set(`verify:${req.body.email}`, otp, "EX", 60 * 5);

      // Gửi mã OTP đến email

      const status = await sendMailOTP(
        req.body.email,
        "OTP Verify Account",
        otp,
        req.body.fullname
      );
      // check status
      if (!status) {
        // delete in redis
        await redisClient.del(`verify:${req.body.email}`);
        return responseError(res, 400, "Gửi email thất bại!!!");
      }

      res.json("Mã OTP đã được gửi qua email của bạn");
    } catch (error) {
      console.log(error);
      return next(
        createError.InternalServerError(
          `${error.message} in method: ${req.method} of ${req.originalUrl} `
        )
      );
    }
  }

  // send OPT comfirm
  async sendOTP(req, res, next) {
    try {
      // Tạo một bí mật ngẫu nhiên
      const secret = speakeasy.generateSecret({ length: 20 });

      // Tạo mã OTP
      const otp = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
      });

      // save otp to redis set time expire 5m
      const userID = await User.findOne({ userName: req.body.fullName }).select(
        "_id"
      );
      await redisClient.set(`comfirm:${userID}`, otp, "EX", 60 * 5);

      // Gửi mã OTP đến email
      const status = await sendMailOTP(
        req.body.email,
        "OTP Comfirm Set Password",
        otp,
        req.body.fullName
      );
      // check status
      if (!status) {
        // delete in redis
        await redisClient.del(`comfirm:${userID}`);
        return responseError(res, 400, "Gửi email thất bại!!!");
      }

      res.json("Mã OTP đã được gửi qua email của bạn");
    } catch (error) {
      console.log(error);
      return next(
        createError.InternalServerError(
          `${error.message} in method: ${req.method} of ${req.originalUrl} `
        )
      );
    }
  }

  // REGISTER
  async register(req, res, next) {
    try {
      const schema = Joi.object({
        roleName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        confirmPassword: Joi.string().required().valid(Joi.ref("password")),
        fullName: Joi.string().required(),
        gender: Joi.string().required(),
        phone: Joi.string().required(),
      }).unknown();
      const { error } = schema.validate(req.body);

      if (error) {
        return responseError(res, 400, error.details[0].message);
      }
      const checkPhone = await Account.findOne({ phone: req.body.phone });
      if (checkPhone) {
        return responseError(res, 400, "Số điện thoại đã tồn tại!!!");
      }
      // call api send mail verify
      try {
        // check email exsit
        const account = await Account.findOne({ email: req.body.email });
        if (account) return responseError(res, 400, "Email đã tồn tại");

        // Tạo một bí mật ngẫu nhiên
        const secret = speakeasy.generateSecret({ length: 20 });

        // Tạo mã OTP
        const otp = speakeasy.totp({
          secret: secret.base32,
          encoding: "base32",
        });

        // save otp to redis set time expire 5m
        await redisClient.set(`verify:${req.body.email}`, otp, "EX", 60 * 5);

        // Gửi mã OTP đến email

        const status = await sendMailOTP(
          req.body.email,
          "OTP Verify Account",
          otp,
          req.body.fullName
        );
        // check status
        if (!status) {
          // delete in redis
          await redisClient.del(`verify:${req.body.email}`);
          return responseError(res, 400, "Gửi email thất bại!!!");
        }
      } catch (err) {
        console.log(err);
      }

      // generate new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // create new user
      const roleId = await Role.findOne({ roleName: req.body.roleName }).select(
        "_id"
      );

      const newUser = new User({
        userName: req.body.fullName,
        role: roleId,
        gender: req.body.gender,
      });

      // const dataToken = {
      //   userId: newUser._id,
      //   role: "USER",
      // };

      // const accessToken = await authMethod.generateToken(
      //   dataToken,
      //   accessTokenLife
      // );

      // if (!accessToken) {
      //   return responseError(
      //     res,
      //     401,
      //     "Đăng ký không thành công, vui lòng thử lại."
      //   );
      // }

      // const refreshToken = await authMethod.generateToken(
      //   dataToken,
      //   refreshTokenSecret,
      //   refreshTokenLife
      // );
      // newUser.refreshToken = refreshToken;
      // const newRefreshToken = new RefreshToken({
      //   userId: newUser._id,
      //   token: refreshToken,
      //   expired: false,
      //   revoked: false,
      // });
      // await newRefreshToken.save();
      await newUser.save();
      const newAccount = new Account({
        email: req.body.email,
        password: hashedPassword,
        phone: req.body.phone,
        user: newUser,
      });
      await newAccount.save();
      await new Profile({
        user: newUser,
      }).save();

      if (roleId.roleName === "SinhVien") {
        const postGroup = await PostGroup.findOne({
          postGroupName: req.body.groupName,
        });
        const newPostGroupMember = new PostGroupMember({
          user: newUser,
          roleUserGroup: "Member",
        });
        newPostGroupMember.postGroup.push(postGroup._id);
        postGroup.postGroupMember.push(newPostGroupMember._id);
        await postGroup.save();
        await newPostGroupMember.save();
      }

      return res.status(200).json({
        success: true,
        message: "Sign Up Success",
        result: { user: newUser },
        statusCode: 200,
      });
    } catch (err) {
      if (err.code === 11000) {
        return responseError(res, 400, "Email đã tồn tại!");
      }
      return next(
        createError.InternalServerError(
          `${err.message}\nin method: ${req.method} of ${
            req.originalUrl
          }\nwith body: ${JSON.stringify(req.body, null, 2)}`
        )
      );
    }
  }

  // LOGIN
  async login(req, res, next) {
    try {
      // validate
      const schema = Joi.object({
        credentialId: Joi.string().min(6).max(255).required().email(),
        password: Joi.string().min(6).max(1024).required(),
      }).unknown();
      const { error } = schema.validate(req.body);
      if (error) {
        return responseError(res, 400, error.details[0].message);
      }

      // tìm account theo email và password đã hash
      const user = await populateUserByEmail(req.body.credentialId);

      if (!user) {
        return responseError(res, 401, "Email không tồn tại.");
      }

      const isPasswordValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!isPasswordValid) {
        return responseError(res, 401, "Mật khẩu không chính xác.");
      }

      if (!user.isActive) {
        return responseError(res, 401, "Tài khoản bị khóa.");
      }

      if (!user.isVerified) {
        return responseError(res, 401, "Tài khoản chưa được xác thực.");
      }
      const dataToken = {
        userId: user._id,
        role: user.role.roleName,
      };

      const accessToken = await authMethod.generateToken(
        dataToken,
        accessTokenLife
      );

      if (!accessToken) {
        return responseError(
          res,
          401,
          "Đăng nhập không thành công, vui lòng thử lại."
        );
      }
      const refreshToken = await authMethod.generateToken(
        dataToken,
        refreshTokenSecret,
        refreshTokenLife
      );
      RefreshToken.findOneAndUpdate(
        { userId: user._id },
        {
          token: refreshToken,
          expired: false,
          revoked: false,
        },
        { upsert: true, new: true }
      );
      user.refreshToken = refreshToken;
      await user.save();

      // save refresh token to redis and set expire time
      await redisClient.set(user._id, refreshToken);
      await redisClient.expire(user._id, 7 * 24 * 60 * 60);

      return res.status(200).json({
        success: true,
        message: "Sign In Success",
        result: {
          accessToken,
          refreshToken,
          userId: user._id,
          roleName: user.role.roleName,
        },
        statusCode: 200,
      });
    } catch (err) {
      console.log(err);
      return next(
        createError.InternalServerError(
          `${err.message}\nin method: ${req.method} of ${
            req.originalUrl
          }\nwith body: ${JSON.stringify(req.body, null, 2)}`
        )
      );
    }
  }

  // refresh token
  async refreshToken(req, res, next) {
    try {
      // validate token
      const schema = Joi.object({
        refreshToken: Joi.string().required(),
      }).unknown();
      const { error } = schema.validate(req.body);
      if (error) {
        return responseError(res, 400, error.details[0].message);
      }

      // get access token from header
      // const accessTokenFromHeader = req.headers.authorization;
      // if (!accessTokenFromHeader) {
      // 	return res.status(400).send('Không tìm thấy access token.');
      // }

      // get refresh token from body
      const refreshTokenFromBody = req.body.refreshToken;
      if (!refreshTokenFromBody) {
        return responseError(res, 400, "Không tìm thấy refresh token.");
      }

      // const accessToken_ = accessTokenFromHeader?.replace('Bearer ', '');
      // Decode access token đó
      const decoded = await authMethod.decodeToken(
        refreshTokenFromBody,
        refreshTokenSecret
      );
      if (!decoded) {
        return responseError(res, 400, "Refresh token không hợp lệ.");
      }
      const { userId } = decoded.payload;
      // Check refreshToken with redis
      // const refreshToken = await redisClient.get(userId);
      // //check refresh token expired or not
      // if (!refreshToken || refreshToken !== refreshTokenFromBody) {
      // 	console.log(refreshToken, "không hợp lệ");
      // 	return res.status(401).send('Refresh token không hợp lệ hoặc đã hết hạn.');
      // }

      // Check refreshToken with database
      const user = await User.findById(mongoose.Types.ObjectId(userId));
      if (!user) {
        return responseError(res, 400, "Không tìm thấy người dùng.");
      }

      if (user.lockTime - Date.now() > 0) {
        return responseError(
          res,
          401,
          `Tài khoản đã bị khóa.Vui lòng thử lại sau ${moment(user.lockTime)
            .locale("vi")
            .fromNow()} `
        );
      }

      if (user.refreshToken !== refreshTokenFromBody) {
        return responseError(
          res,
          401,
          "Refresh token không hợp lệ hoặc đã hết hạn"
        );
      }

      // Generate new access token
      const dataToken = {
        userId,
        role: user.role.name,
      };
      const accessToken = await authMethod.generateToken(
        dataToken,
        accessTokenLife
      );
      if (!accessToken) {
        return responseError(
          res,
          400,
          "Tạo access token không thành công, vui lòng thử lại."
        );
      }

      return res.json({
        accessToken,
      });
    } catch (err) {
      console.log(err.message);
      return next(
        createError.InternalServerError(
          `${err.message} \nin method: ${req.method} of ${
            req.originalUrl
          } \nwith body: ${JSON.stringify(req.body, null, 2)} `
        )
      );
    }
  }

  // get link forgot password
  async sendLinkForgottenPassword(req, res, next) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required(),
      }).unknown();
      const { error } = schema.validate(req.body);
      if (error) {
        return responseError(res, 400, error.details[0].message);
      }

      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return responseError(res, 400, "Email không tồn tại!!!");
      }

      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
      }

      const link = `${process.env.BASE_URL}?id=${user._id}&token=${token.token}`;
      const status = await sendEmail(user.email, "Password reset", link, user);
      // check status
      if (!status) {
        return responseError(res, 400, "Gửi email thất bại!!!");
      }
      res.send("Link reset mật khẩu đã được gửi qua email của bạn");
    } catch (error) {
      console.log(error);
      return next(
        createError.InternalServerError(
          `${error.message} in method: ${req.method} of ${req.originalUrl} `
        )
      );
    }
  }

  async resetPassword(req, res, next) {
    try {
      const schema = Joi.object({
        password: Joi.string().required(),
      }).unknown();
      const { error } = schema.validate(req.body);
      if (error) {
        return responseError(res, 400, error.details[0].message);
      }

      const user = await User.findById(req.params.userId);
      if (!user) {
        return responseError(res, 400, "Không tìm thấy người dùng");
      }

      const token = await Token.findOne({
        userId: user._id,
        token: req.params.token,
      });
      if (!token) {
        return responseError(res, 400, "Link không đúng hoặc đã hết hạn");
      }

      // hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
      await user.save();
      await token.delete();

      res.send("Reset mật khẩu thành công!!.");
    } catch (err) {
      console.log(err);
      return next(
        createError.InternalServerError(
          `${err.message} \nin method: ${req.method} of ${
            req.originalUrl
          } \nwith body: ${JSON.stringify(req.body, null, 2)} `
        )
      );
    }
  }

  // change password
  async changePassword(req, res, next) {
    try {
      const schema = Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
        confirmPassword: Joi.string().required(),
      }).unknown();
      const { error } = schema.validate(req.body);
      if (error) {
        return responseError(res, 400, error.details[0].message);
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return responseError(res, 400, "Không tìm thấy người dùng");
      }

      const isPasswordValid = bcrypt.compareSync(
        req.body.oldPassword,
        user.password
      );
      if (!isPasswordValid) {
        return responseError(res, 400, "Mật khẩu cũ không đúng");
      }

      // check newPassword and confirmPassword
      if (req.body.newPassword !== req.body.confirmPassword) {
        return responseError(
          res,
          400,
          "Mật khẩu mới và xác nhận mật khẩu không khớp"
        );
      }

      // generate new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
      user.password = hashedPassword;
      await user.save();
      return res.status(200).json("Thay đổi mật khẩu thành công!!");
    } catch (err) {
      console.log(err);
      return next(
        createError.InternalServerError(
          `${err.message} \nin method: ${req.method} of ${
            req.originalUrl
          } \nwith body: ${JSON.stringify(req.body, null, 2)} `
        )
      );
    }
  }

  // set password
  async setPassword(req, res, next) {
    try {
      const schema = Joi.object({
        newPassword: Joi.string().required(),
        confirmPassword: Joi.string().required(),
        otp: Joi.number().required(),
      }).unknown();
      const { error } = schema.validate(req.body);
      if (error) {
        return responseError(res, 400, error.details[0].message);
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return responseError(res, 400, "Không tìm thấy người dùng");
      }

      // check newPassword and confirmPassword
      if (req.body.newPassword !== req.body.confirmPassword) {
        return responseError(
          res,
          400,
          "Mật khẩu mới và xác nhận mật khẩu không khớp"
        );
      }

      // generate new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

      // get opt from redis
      const otp = await redisClient.get(`comfirm:${req.user._id}`);
      if (!otp) {
        return responseError(res, 400, "Mã OTP đã hết hạn");
      }

      // verify opt
      const isVerify = otp.toString() === req.body.otp.toString();
      if (!isVerify) {
        return responseError(res, 400, "Mã OTP không đúng");
      }

      // save new password
      user.password = hashedPassword;
      await user.save();
      redisClient.del(`comfirm:${req.user._id}`); // delete otp

      return res.status(200).json("Đặt mật khẩu thành công!!!");
    } catch (error) {
      console.log(error.message);
      return next(
        createError.InternalServerError(
          `${error.message} \nin method: ${req.method} of ${
            req.originalUrl
          } \nwith body: ${JSON.stringify(req.body, null, 2)} `
        )
      );
    }
  }

  async logout(req, res, next) {
    try {
      const userId = req.user._id;
      await redisClient.del(userId);
      res.send("Đăng xuất thành công!!!");
    } catch (err) {
      console.log(err);
      return next(
        createError.InternalServerError(
          `${err.message} \nin method: ${req.method} of ${
            req.originalUrl
          } \nwith body: ${JSON.stringify(req.body, null, 2)} `
        )
      );
    }
  }

  // xác thực tài khoản
  async verifyAccount(req, res, next) {
    try {
      const schema = Joi.object({
        otp: Joi.number().required(),
        email: Joi.string().email().required(),
      }).unknown();
      const { error } = schema.validate(req.body);
      if (error) {
        return responseError(res, 400, error.details[0].message);
      }
      // get opt from redis
      const otp = await redisClient.get(`verify:${req.body.email}`);
      if (!otp) {
        return responseError(res, 400, "Mã OTP đã hết hạn");
      }

      // verify opt
      const isVerify = otp.toString() === req.body.otp.toString();
      if (!isVerify) {
        return responseError(res, 400, "Mã OTP không đúng");
      }

      // get user
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return responseError(res, 400, "Không tìm thấy người dùng");
      }

      // set isVerified = true
      user.isVerified = true;
      await user.save();
      redisClient.del(`verify:${req.body.email}`); // delete otp

      return res.status(200).json("Xác thực tài khoản thành công!!!");
    } catch (error) {
      console.log(error.message);
      return next(
        createError.InternalServerError(
          `${error.message} \nin method: ${req.method} of ${
            req.originalUrl
          } \nwith body: ${JSON.stringify(req.body, null, 2)} `
        )
      );
    }
  }
}

module.exports = new AuthoController();

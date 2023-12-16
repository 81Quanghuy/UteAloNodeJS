const createError = require("http-errors");
const { v4: uuidv4 } = require("uuid");

// const Conversation = require('./conversations');
const Auth = require("./auth");
const Admin = require("./admin");
const User = require("./users");
const Post = require("./posts");
const CommentPost = require("./commentPost");
const CommentShare = require("./commentShare");
const Share = require("./shares");
const LikePost = require("./likesPost");
const LikeShare = require("./likesShare");
const LikeComment = require("./likesComment");
const Friend = require("./friends");

const logEvents = require("../Helpers/logEvents");
const bot = require("../utils/SlackLogger/bot");

function route(app) {
  // cors handle
  app.use((req, res, next) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://tana.social",
      "https://tana-admin.vercel.app",
      "https://tana.social",
    ];
    const { origin } = req.headers;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    // res.setHeader('Access-Control-Allow-Origin', '*');
    // res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    if (req.method === "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "PUT, POST, PATCH, DELETE, GET"
      );
      return res.status(200).json({});
    }
    next();
  });

  // limit access to 20 requests per 1 minutes
  // app.use(limiter);
  // route
  app.use("/users", User);
  app.use("/api/v1/auth", Auth);
  app.use("/api/v1/admin", Admin);
  app.use("/api/v1/post", Post);
  app.use("/api/v1/share", Share);
  app.use("/api/v1/post/comment", CommentPost);
  app.use("/api/v1/share/comment", CommentShare);
  app.use("/api/v1/post/like", LikePost);
  app.use("/api/v1/share/like", LikeShare);
  app.use("/api/v1/comment/like", LikeComment);
  app.use("/api/v1/user", User);
  app.use("/api/v1/friend", Friend);

  // app.use('/reports', Report);
  // app.use('/hobbies', Hobby);
  // app.use('/list', List);
  // get error 404
  app.use((req, res, next) => {
    next(
      createError(404, `Method: ${req.method} of ${req.originalUrl}  not found`)
    );
  });
  // get all errors
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    logEvents(`idError: ${uuidv4()} - ${error.message}`);
    bot.sendNotificationToBotty(
      `Method: ${req.method} of ${req.originalUrl}  not found\n${error.message}`
    );
    res.status(error.status || 500);
    res.json({
      error: {
        message: error.message,
      },
    });
  });
}

module.exports = route;

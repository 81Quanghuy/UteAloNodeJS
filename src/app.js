/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
const express = require("express"); // dowload express library
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const helmet = require("helmet");
const fs = require("fs");
const methodOverride = require("method-override");
const multer = require("multer");
const HOSTS = require("./configs/cors");
// convert Post to PUT method

const app = express();

app.use(
  cors({
    origin: HOSTS,
  })
);
app.use(helmet());

// Create folder Logs if not exist
if (!fs.existsSync(path.join(__dirname, "./Logs"))) {
  fs.mkdirSync(path.join(__dirname, "./Logs"));
}
app.use(
  morgan("combined", {
    stream: fs.createWriteStream(path.join(__dirname, "./Logs", "access.log"), {
      flags: "a",
    }),
  })
);

// use morgan to log request in console
app.use(morgan("dev"));

// require routes/index.js
const routes = require("./routes");

app.use(express.static(path.join(__dirname, "public")));

// handle send data xmlhttp, fetch, axios,...
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Khởi tạo multer để xử lý form-data
const upload = multer();
// app.use(upload.none()); // Sử dụng multer để xử lý form-data và gửi dữ liệu vào req.body
app.use(upload.any());

// Middleware để log dữ liệu đến từ client
app.use(function (req, res, next) {
  if (req.is("text/*")) {
    let data = "";
    req.on("data", function (chunk) {
      data += chunk.toString();
    });
    req.on("end", function () {
      req.body = { id: data }; // Đặt giá trị id vào req.body
      next();
    });
  } else {
    next();
  }
});

// handle form data of method post html
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(methodOverride("_method"));

app.use(
  session({
    secret: "secrettexthere",
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 60000 * 60 * 24,
    },
  })
);

// use passport
require("./configs/passport")(passport);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Route init
routes(app);

module.exports = app;

const http = require("http");
// eslint-disable-next-line import/no-extraneous-dependencies
const WebSocket = require("ws");
require("dotenv").config();

const app = require("./app");

const server = http.createServer(app);

// Tạo một máy chủ WebSocket liên kết với server HTTP
const wss = new WebSocket.Server({ server });

const Socket = require("./socket/index");

Socket(wss);
// require db
const db = require("./configs/db/index");
// connect to DB
db.connect();

// 127.0.0.1 - localhost
const PORT = process.env.PORT || 8089;
server.listen(PORT, () => {
  console.log(`Backend server is listening on port ${PORT}`);
});

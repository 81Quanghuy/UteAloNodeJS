/* eslint-disable import/newline-after-import */
const AccessController = require('../app/controllers/AccessController');
const { User } = require('../app/models/User');
const SocketManager = require('./SocketManager');
const RoomMagager = require('./RoomManager');
const authMethod = require('../auth/auth.method');
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

function socket(io) {
	io.on('connection', (sk) => {
		sk.on('error', console.error);
		console.log('New WS Connection...', sk.id);
		let userID;
		sk.on('open', async (token) => {
			const verified = await authMethod.verifyToken(token, accessTokenSecret);
			if (!verified) {
				console.log('Invalid token');
				return;
			}
			userID = verified.payload.userId;
			console.log(userID);
			try {
				// data is userID
				await AccessController.updateAccessInDay();

				// Update user isOnline
				const user = await User.findByIdAndUpdate(
					userID,
					{
						isOnline: true,
					},
					{ new: true }
				);

				// Add user to socket manager
				SocketManager.addUser(userID, sk);

				// Send user online
				SocketManager.sendAll(`online:${userID}`, user);
			} catch (err) {
				console.log(err);
			}
		});

		RoomMagager(sk, io);
		// Xử lý khi client đóng kết nối
		sk.on('close', async () => {
			try {
				// Update user isOnline
				const user = await User.findByIdAndUpdate(
					userID,
					{
						isOnline: false,
						lastAccess: Date.now(),
					},
					{ new: true }
				);

				// Remove user from socket manager
				SocketManager.removeUser(userID);
				SocketManager.sendAll(`online:${userID}`, user);
			} catch (err) {
				console.log(err);
			}
		});
	});
}
module.exports = socket;

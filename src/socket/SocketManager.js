class SocketManager {
	constructor() {
		/** @type {Map<string, any>} */
		this._store = new Map();
	}

	addUser(userId, ws) {
		this._store.set(userId.toString(), ws);
	}

	removeUser(userId) {
		this._store.delete(userId.toString());
	}

	getUser(userId) {
		return this._store.get(userId.toString());
	}

	send(userId, event, data) {
		const ws = this.getUser(userId);
		if (ws) {
			ws.send(JSON.stringify({ event, data }));
		}
	}

	sendToList(userIds, event, data) {
		userIds.forEach((userId) => {
			this.send(userId, event, data);
		});
	}

	// send all
	sendAll(event, data) {
		this._store.forEach((ws) => {
			ws.send(JSON.stringify({ event, data }));
		});
	}
}

module.exports = new SocketManager();

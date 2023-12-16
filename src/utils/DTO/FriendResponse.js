class FriendResponse {
  constructor(friend) {
    this.userId = friend.userId;
    this.background = friend.background || null;
    this.avatar = friend.avatar || null;
    this.username = friend.username || null;
    this.isOnline = friend.isOnline || null;
  }
}

module.exports = FriendResponse;

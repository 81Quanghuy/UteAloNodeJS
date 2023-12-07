class LikeShareResponse {
  constructor(like) {
    this.likeId = like.likeId;
    this.shareId = like.shareId || null;
    this.userName = like.userName || null;
  }
}

module.exports = LikeShareResponse;

class LikePostResponse {
  constructor(like) {
    this.likeId = like.likeId;
    this.postId = like.postId || null;
    this.userName = like.userName || null;
  }
}

module.exports = LikePostResponse;

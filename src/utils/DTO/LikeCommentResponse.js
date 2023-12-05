class LikeCommentResponse {
  constructor(like) {
    this.likeId = like.likeId;
    this.commentId = like.commentId || null;
    this.userName = like.userName || null;
  }
}

module.exports = LikeCommentResponse;

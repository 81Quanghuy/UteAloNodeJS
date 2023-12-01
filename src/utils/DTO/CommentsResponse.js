class CommentsResponse {
  constructor(comment) {
    this.commentId = comment.commentId;
    this.content = comment.content || null;
    this.createTime = comment.createTime;
    this.photos = comment.photos || null;
    this.userName = comment.userName || null;
    this.postId = comment.postId;
    this.userAvatar = comment.userAvatar || null;
    this.userId = comment.userId || null;
    this.likes = comment.likes || [];
  }
}

module.exports = CommentsResponse;

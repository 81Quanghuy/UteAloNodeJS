class CommentsShareResponse {
  constructor(comment) {
    this.commentId = comment.commentId;
    this.content = comment.content || null;
    this.createTime = comment.createTime;
    this.photos = comment.photos || null;
    this.userName = comment.userName || null;
    this.shareId = comment.shareId;
    this.userAvatar = comment.userAvatar || null;
    this.userId = comment.userId || null;
    this.likes = comment.likes || [];
    this.userOwner = comment.userOwner || null;
  }
}

module.exports = CommentsShareResponse;

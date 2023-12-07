class SharesResponse {
  constructor(share) {
    this.shareId = share.shareId;
    this.createAt = share.createAt;
    this.updateAt = share.updateAt;
    this.content = share.content || null;
    this.postId = share.postId || null;
    this.userId = share.userId || null;
    this.comments = share.comments || null;
    this.likes = share.likes || null;
  }
}

module.exports = SharesResponse;

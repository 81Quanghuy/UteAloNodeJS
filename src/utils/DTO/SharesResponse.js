const PostsResponse = require("./PostsResponse");

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
    this.privacyLevel = share.privacyLevel || null;
    this.roleName = share.roleName || null;
    this.userName = share.userName || null;
    this.avatarUser = share.avatarUser || null;
    this.postGroupId = share.postGroupId || null;
    this.postGroupName = share.postGroupName || null;
    this.postsResponse = new PostsResponse(share.postsResponse);
  }
}

module.exports = SharesResponse;

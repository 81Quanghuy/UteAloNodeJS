class PostsResponse {
  constructor(post) {
    this.postId = post.postId;
    this.postTime = post.postTime;
    this.updateAt = post.updateAt;
    this.content = post.content || null;
    this.photos = post.photos || null;
    this.files = post.files || null;
    this.location = post.location || null;
    this.userId = post.userId || null;
    this.userName = post.userName || null;
    this.postGroupId = post.postGroupId || null;
    this.postGroupName = post.postGroupName || null;
    this.comments = post.comments || [];
    this.likes = post.likes || [];
    this.roleName = post.roleName || null;
    this.privacyLevel = post.privacyLevel || null;
  }
}

module.exports = PostsResponse;

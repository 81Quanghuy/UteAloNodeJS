class GroupsResponse {
  constructor(group) {
    this.postGroupId = group.postGroupId;
    this.postGroupName = group.postGroupName || null;
    this.avatarGroup = group.avatarGroup || null;
    this.bio = group.bio || null;
    this.isPublic = group.isPublic || null;
    this.createAt = group.createAt || null;
  }
}

module.exports = GroupsResponse;

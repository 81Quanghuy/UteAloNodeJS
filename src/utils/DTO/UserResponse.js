class UserResponse {
  constructor({
    userId,
    phone,
    email,
    userName,
    avatar,
    background,
    address,
    dayOfBirth,
    about,
    gender,
    isActive,
    createdAt,
    updatedAt,
    roleName,
    friends,
    postGroup,
    accountActive,
  }) {
    this.userId = userId;
    this.phone = phone;
    this.email = email;
    this.userName = userName;
    this.avatar = avatar;
    this.background = background;
    this.address = address;
    this.dayOfBirth = dayOfBirth;
    this.about = about;
    this.gender = gender;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.roleName = roleName;
    this.friends = friends;
    this.postGroup = postGroup;
    this.accountActive = accountActive;
  }
}

module.exports = UserResponse;

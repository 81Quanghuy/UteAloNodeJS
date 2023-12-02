class UsersResponse {
  constructor({
    userId,
    userName,
    address,
    phone,
    gender,
    dayOfBirth,
    isActive,
    roleName,
    email,
  }) {
    this.userId = userId;
    this.userName = userName;
    this.address = address;
    this.phone = phone;
    this.gender = gender;
    this.dayOfBirth = dayOfBirth;
    this.isActive = isActive;
    this.roleName = roleName;
    this.email = email;
  }
}

module.exports = UsersResponse;

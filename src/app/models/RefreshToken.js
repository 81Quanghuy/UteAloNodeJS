const mongoose = require('mongoose');

const { Schema } = mongoose;

const RefreshTokenSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'user',
	},
	token: {
		type: String,
		required: true,
	},
	expired: {
		type: Boolean,
		default: false,
	},
	revoked: {
		type: Boolean,
		default: false,
	},
});

module.exports = mongoose.model('refreshToken', RefreshTokenSchema);

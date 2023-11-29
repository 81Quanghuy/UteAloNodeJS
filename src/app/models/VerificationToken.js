const mongoose = require('mongoose');

const { Schema } = mongoose;

const VerificationToken = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'user',
	},
	token: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model('verificationToken', VerificationToken);

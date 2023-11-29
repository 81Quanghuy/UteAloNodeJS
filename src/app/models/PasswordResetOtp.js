const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const PasswordResetOtpSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		otp: {
			type: String,
		},
		expiryDate: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);
// soft delete
PasswordResetOtpSchema.plugin(mongooseDelete, {
	deletedAt: true,
	overrideMethods: 'all',
});

// paginate
PasswordResetOtpSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('PasswordResetOtp', PasswordResetOtpSchema);

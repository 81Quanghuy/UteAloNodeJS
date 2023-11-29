const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const EmailVerificationSchema = new mongoose.Schema(
	{
		email: {
			type: String,
		},
		otp: {
			type: String,
		},
		expirationTime: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
		collection: 'emailVerification',
	}
);

// soft delete
EmailVerificationSchema.plugin(mongooseDelete, {
	deletedAt: true,
	overrideMethods: 'all',
});

// paginate
EmailVerificationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('emailVerification', EmailVerificationSchema);

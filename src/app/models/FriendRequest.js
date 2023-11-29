const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const FriendRequestSchema = new mongoose.Schema(
	{
		userFrom: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		userTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		isActive: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		collection: 'friendRequest',
	}
);

// soft delete
FriendRequestSchema.plugin(mongooseDelete, {
	deletedAt: true,
	overrideMethods: 'all',
});

// paginate
FriendRequestSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('friendRequest', FriendRequestSchema);

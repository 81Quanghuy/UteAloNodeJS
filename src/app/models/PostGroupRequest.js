const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const { Schema } = mongoose;

const PostGroupRequestSchema = new Schema({
	invitedUserId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'user',
	},
	invitingUserId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'user',
	},
	postGroupId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'postGroup',
	},
	isAccepted: {
		type: Boolean,
		default: false,
	},
	createAt: {
		type: Date,
		default: Date.now,
	},
});
// soft delete
PostGroupRequestSchema.plugin(mongooseDelete, {
	deletedAt: true,
	overrideMethods: 'all',
});

// paginate
PostGroupRequestSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('postGroupRequest', PostGroupRequestSchema);

const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const { Schema } = mongoose;

const ShareSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'user',
	},
	content: {
		type: String,
	},
	postId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'post',
	},
	commentId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'comment',
	},
	likeId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'like',
	},
	postGroupId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'postGroup',
	},
	createAt: {
		type: Date,
		default: Date.now,
	},
	updateAt: {
		type: Date,
		default: Date.now,
	},
});
// soft delete
ShareSchema.plugin(mongooseDelete, {
	deletedAt: true,
	overrideMethods: 'all',
});

// paginate
ShareSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('share', ShareSchema);

const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const LikeSchema = new mongoose.Schema(
	{
		postId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Post',
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		shareId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Share',
		},
		status: {
			type: String,
		},
		commentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Comment',
		},
	},
	{
		timestamps: true,
		collection: 'likes',
	}
);

// soft delete
LikeSchema.plugin(mongooseDelete, {
	deletedAt: true,
	overrideMethods: 'all',
});

// paginate
LikeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('likes', LikeSchema);

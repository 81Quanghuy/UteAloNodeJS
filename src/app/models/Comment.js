const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const CommentSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
		},
		content: {
			type: String,
		},

		share: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'Share',
		},
		createTime: {
			type: Date,
			default: Date.now,
		},
		updateAt: {
			type: Date,
			default: Date.now,
		},
		photos: {
			type: String,
		},
		commentReply: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'comments',
		},

		// postid
		post: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'Post',
		},
	},
	{ timestamps: true }
);

// soft delete
CommentSchema.plugin(mongooseDelete, {
	deletedAt: true,
	overrideMethods: 'all',
});

// paginate
CommentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('comments', CommentSchema);

const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const MessageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		groupId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'PostGroup',
		},
		messageType: {
			type: String,
			enum: ['TEXT', 'FILE', 'PHOTO', 'VIDEO'],
			default: 'TEXT',
		},
		content: {
			type: String,
		},
		createAt: {
			type: Date,
			default: Date.now,
		},
		updateAt: {
			type: Date,
			default: Date.now,
		},
		status: {
			type: String,
			enum: ['JOIN', 'MESSAGE', 'LEAVE'],
			default: 'MESSAGE',
		},
	},
	{
		timestamps: true,
		collection: 'messages',
	}
);

// soft delete
MessageSchema.plugin(mongooseDelete, {
	deletedAt: true,
	overrideMethods: 'all',
});

// paginate
MessageSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Message', MessageSchema);

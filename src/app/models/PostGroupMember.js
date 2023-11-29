const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const { Schema } = mongoose;

const PostGroupMemberSchema = new Schema({
	postGroup: [
		{
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'postGroup',
		},
	],
	user: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'user',
	},
	roleUserGroup: {
		type: String,
		enum: ['Admin', 'Member'],
		default: 'Member',
	},
});
// soft delete
PostGroupMemberSchema.plugin(mongooseDelete, {
	deletedAt: true,
	overrideMethods: 'all',
});

// paginate
PostGroupMemberSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('postGroupMember', PostGroupMemberSchema);

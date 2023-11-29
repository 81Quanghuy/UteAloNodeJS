const Joi = require('joi');
const createError = require('http-errors');
const crypto = require('crypto');
const Message = require('../models/Message');
const { getPagination } = require('../../utils/Pagination');
const { getListData } = require('../../utils/Response/listData');
const { openai } = require('../../configs/chatgpt');
const SocketManager = require('../../socket/SocketManager');
const { eventName } = require('../../socket/constant');

const { responseError } = require('../../utils/Response/error');

// set encryption algorithm
const algorithm = 'aes-256-cbc';

// private key
const key = process.env.DECODE_KEY; // must be of 32 characters

class MessageController {
	// [Post] add a new message
	async add(req, res, next) {
		try {
			// Validate request body not empty
			const schema = Joi.object({
				text: Joi.string().min(0),
				media: Joi.array().items(Joi.string()),
			})
				.or('text', 'media')
				.unknown();

			const { error } = schema.validate(req.body);
			if (error) {
				return next(createError(400, error.details[0].message));
			}
		} catch (err) {
			return next(
				createError.InternalServerError(
					`${err.message}\nin method: ${req.method} of ${req.originalUrl}\nwith body: ${JSON.stringify(
						req.body,
						null,
						2
					)}`
				)
			);
		}
	}

	// [PUT] update reader message
	async update(req, res, next) {
		try {
			const message = await Message.findById(req.params.id);
			if (!message.reader.includes(req.user._id)) message.reader.push(req.user._id);
			await message.save();
			res.status(200).json(message);
		} catch (err) {
			console.log(err);
			return next(
				createError.InternalServerError(
					`${err.message}\nin method: ${req.method} of ${req.originalUrl}\nwith body: ${JSON.stringify(
						req.body,
						null,
						2
					)}`
				)
			);
		}
	}

	// [Delete] delete a message
	async delete(req, res, next) {
		try {
			const message = await Message.findById(req.params.id);
			if (message.sender.toString() === req.user._id.toString()) {
				// await Message.delete({ _id: req.params.id });
				await message.delete();
				res.status(200).json(message);
			} else {
				return responseError(res, 401, 'Bạn không có quyền xóa tin nhắn này');
			}
		} catch (err) {
			console.error(err);
			return next(
				createError.InternalServerError(
					`${err.message}\nin method: ${req.method} of ${req.originalUrl}\nwith body: ${JSON.stringify(
						req.body,
						null,
						2
					)}`
				)
			);
		}
	}

	// [Get] get all messages
	async getAll(req, res) {
		const { limit, offset } = getPagination(req.query.page, req.query.size, req.query.offset);

		Message.paginate({}, { offset, limit })
			.then((data) => {
				getListData(res, data);
			})
			.catch((err) => responseError(res, 500, err.message ?? 'Some error occurred while retrieving tutorials.'));
	}
}

module.exports = new MessageController();

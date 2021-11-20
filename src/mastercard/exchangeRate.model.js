const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const exchangeRateSchema = new Schema(
	{
		fromCurrency: {
			type: String,
			required: true,
		},
		toCurrency: {
			type: String,
			required: true,
		},
		rate: {
			type: Number,
			required: true,
		},
		date: {
			type: Date,
			required: true,
			index: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);

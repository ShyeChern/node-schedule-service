const cron = require('node-cron');
const puppeteer = require('puppeteer');
const { format, add, sub, eachDayOfInterval, isAfter } = require('date-fns');
const exchangeRateModel = require('./exchangeRate.model');
const { constants } = require('../utils/constants');
const { infoLog, errorLog } = require('../utils/log');

const getExchangeRate = () => {
	// cron job run every hour
	cron.schedule('0 * * * *', async () => {
		try {
			// get last 7 days date in db
			const availableDate = await exchangeRateModel
				.find()
				.select('date')
				.sort({ date: -1 })
				.limit(7)
				.lean()
				.then((result) => {
					return result.map((value) => format(value.date, 'yyyy-MM-dd'));
				});

			// get last 7 days from now and filter date not exist in db
			const days = eachDayOfInterval({
				start: sub(new Date(), { days: 6 }),
				end: new Date(),
			})
				.map((value) => format(value, 'yyyy-MM-dd'))
				.filter((value) => {
					return !availableDate.includes(value);
				});

			// use peppeteer to open browser and call api
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto(constants.MASTERCARD_CURRENCY_LINK);
			for (const date of days) {
				const api = constants.MASTERCARD_CURRENCY_API(date);
				const rate = await page.evaluate(async (api) => {
					// action in the page
					return await fetch(api)
						.then((response) => response.json())
						.then((response) => {
							return response;
						})
						.catch(() => false);
				}, api);

				if (rate) {
					await exchangeRateModel.findOneAndUpdate(
						{
							// filter document with same date (ignore time)
							date: {
								$gte: new Date(rate.data.fxDate),
								$lt: add(new Date(rate.data.fxDate), { days: 1 }),
							},
						},
						{
							fromCurrency: rate.data.transCurr,
							toCurrency: rate.data.crdhldBillCurr,
							rate: rate.data.conversionRate,
							date: rate.data.fxDate,
						},
						{
							upsert: true,
						}
					);
					infoLog(`Update exchange rate on ${rate.data.fxDate} successfully`);
				}
			}

			await browser.close();
		} catch (err) {
			errorLog(err);
		}
	});
};

// this function is to get the previous date rate
const getPreviousExchangeRate = () => {
	// cron job run every 10 minutes
	cron.schedule('*/10 * * * *', async () => {
		try {
			// get first date in db
			const availableDate = await exchangeRateModel
				.findOne({})
				.select('date')
				.sort({ date: 1 })
				.limit(1)
				.lean();

			let date = sub(availableDate.date, { days: 1 });

			// if date after 31 May 2021
			if (isAfter(date, new Date(2020, 4, 31))) {
				date = format(date, 'yyyy-MM-dd');
				// use peppeteer to open browser and call api
				const browser = await puppeteer.launch();
				const page = await browser.newPage();
				await page.goto(constants.MASTERCARD_CURRENCY_LINK);
				const api = constants.MASTERCARD_CURRENCY_API(date);
				const rate = await page.evaluate(async (api) => {
					// action in the page
					return await fetch(api)
						.then((response) => response.json())
						.then((response) => {
							return response;
						})
						.catch(() => false);
				}, api);

				await browser.close();

				if (rate) {
					await exchangeRateModel.findOneAndUpdate(
						{
							// filter document with same date (ignore time)
							date: {
								$gte: new Date(rate.data.fxDate),
								$lt: add(new Date(rate.data.fxDate), { days: 1 }),
							},
						},
						{
							fromCurrency: rate.data.transCurr,
							toCurrency: rate.data.crdhldBillCurr,
							rate: rate.data.conversionRate,
							date: rate.data.fxDate,
						},
						{
							upsert: true,
						}
					);
					infoLog(`Added exchange rate for ${date}`);
				} else {
					infoLog(`Fail to add exchange rate for ${date}`);
				}
			}
		} catch (err) {
			errorLog(err);
		}
	});
};

module.exports.mastercard = () => {
	getExchangeRate();
	// getPreviousExchangeRate();
};

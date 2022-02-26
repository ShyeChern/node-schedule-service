const fs = require('fs');
const cron = require('node-cron');
const puppeteer = require('puppeteer');
const { format, add, sub, isAfter } = require('date-fns');
const exchangeRateModel = require('./exchangeRate.model');
const { constants } = require('../utils/constants');
const { infoLog, errorLog } = require('../utils/log');

const getExchangeRate = () => {
	// cron job run every hour
	cron.schedule('0 * * * *', async () => {
		try {
			// get the last date in db
			const lastDate = await exchangeRateModel
				.findOne()
				.select('date')
				.sort({ date: -1 })
				.limit(1)
				.lean()
				.then((result) => {
					return format(add(result.date, { days: 1 }), 'yyyy-MM-dd');
				});

			const todayDate = format(new Date(), 'yyyy-MM-dd');
			if (todayDate === lastDate) {
				return;
			}

			// use peppeteer to open browser and call api
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto(constants.MASTERCARD_CURRENCY_LINK);

			const api = constants.MASTERCARD_CURRENCY_API(lastDate);
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

const housekeeping = async () => {
	// cron job run every hour (xx:15) in 1st day of month
	cron.schedule('15 * * * *', async () => {
		try {
			const yearMonth = format(sub(new Date(), { months: 1 }), 'yyyy/MM');
			const folderPath = `./log/${yearMonth}`;
			if (!fs.existsSync(folderPath)) {
				fs.mkdirSync(folderPath, { recursive: true });

				// copy file to backup
				fs.copyFileSync(
					`./log/${constants.ERROR_LOG_FILENAME}`,
					`${folderPath}/${constants.ERROR_LOG_FILENAME}`
				);
				fs.copyFileSync(
					`./log/${constants.INFO_LOG_FILENAME}`,
					`${folderPath}/${constants.INFO_LOG_FILENAME}`
				);
				fs.copyFileSync(
					`./log/${constants.COMBINED_LOG_FILENAME}`,
					`${folderPath}/${constants.COMBINED_LOG_FILENAME}`
				);

				// truncate current file
				fs.truncateSync(`./log/${constants.ERROR_LOG_FILENAME}`);
				fs.truncateSync(`./log/${constants.INFO_LOG_FILENAME}`);
				fs.truncateSync(`./log/${constants.COMBINED_LOG_FILENAME}`);

				// keep only past 3 months
				const prevDate = sub(new Date(), { months: 4 });
				const prevYearMonthPath = `./log/${format(prevDate, 'yyyy/MM')}`;
				if (fs.existsSync(prevYearMonthPath)) {
					fs.rmSync(prevYearMonthPath, { recursive: true, force: true });
					infoLog(`Remove ${prevYearMonthPath} successfully`);
				}
				const prevYearPath = `./log/${format(prevDate, 'yyyy')}`;
				if (fs.existsSync(prevYearPath) && fs.readdirSync(prevYearPath).length === 0) {
					fs.rmdirSync(prevYearPath);
					infoLog(`Remove ${prevYearPath} successfully`);
				}
				infoLog('Housekeeping successfully');
			}
		} catch (err) {
			errorLog(err);
		}
	});
};

module.exports.mastercard = async () => {
	getExchangeRate();
	housekeeping();
	// getPreviousExchangeRate();
};

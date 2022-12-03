const fs = require('fs');
const cron = require('node-cron');
const puppeteer = require('puppeteer-extra');
const userAgent = require('user-agents');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { format } = require('date-fns');
const { constants } = require('../utils/constants');
const { infoLog, errorLog } = require('../utils/log');
puppeteer.use(StealthPlugin());

const login = () => {
	// cron job run every hour
	cron.schedule('0 * * * *', async () => {
		try {
			const todayDate = format(new Date(), 'yyyy-MM-dd');
			const filename = `./log/${constants.LEETCODE_LOG_FILENAME}`;
			// check if already login
			if (fs.existsSync(filename)) {
				const data = fs.readFileSync(filename, 'utf8');
				if (data === todayDate) {
					return;
				}
			}
			const browser = await puppeteer.launch({
				headless: process.env.NODE_ENV === 'production',
			});
			const page = await browser.newPage();
			await page.setUserAgent(userAgent.random().toString());
			await page.goto(constants.LEETCODE_LOGIN_LINK, { waitUntil: 'networkidle0' });
			await page.type('#id_login', process.env.LEETCODE_EMAIL);
			await page.type('#id_password', process.env.LEETCODE_PASSWORD);
			// make sure the page loaded
			setTimeout(async () => {
				await Promise.all([
					page.waitForNavigation({ waitUntil: 'networkidle0' }),
					page.click('#signin_btn'),
				]);
				await browser.close();
				// save last login date to file
				fs.writeFileSync(filename, todayDate);
				infoLog(`Login to ${page.url()} on ${todayDate} successfully`);
			}, 2000);
		} catch (err) {
			errorLog(err);
		}
	});
};

module.exports.leetcode = async () => {
	login();
};

const fs = require('fs');
const cron = require('node-cron');
const puppeteer = require('puppeteer');
const { format } = require('date-fns');
const { constants } = require('../utils/constants');
const { infoLog, errorLog } = require('../utils/log');

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
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto(constants.LEETCODE_LOGIN_LINK, { waitUntil: 'networkidle0' });
			await page.type('#id_login', process.env.LEETCODE_EMAIL);
			await page.type('#id_password', process.env.LEETCODE_PASSWORD);
			await Promise.all([
				page.click('#signin_btn'),
				page.waitForNavigation({ waitUntil: 'networkidle0' }),
			]);
			await browser.close();
			// save last login date to file
			fs.writeFileSync(filename, todayDate);
			infoLog(`Login to ${page.url()} on ${todayDate} successfully`);
		} catch (err) {
			errorLog(err);
		}
	});
};

module.exports.leetcode = async () => {
	login();
};

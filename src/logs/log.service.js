const fs = require('fs');
const cron = require('node-cron');
const { format, sub } = require('date-fns');
const { constants } = require('../utils/constants');
const { infoLog, errorLog } = require('../utils/log');

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

module.exports.logs = async () => {
	housekeeping();
};

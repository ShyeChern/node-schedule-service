require('dotenv').config();
require('./database/database').init();
const { infoLog, errorLog } = require('./src/utils/log');
const { mastercard } = require('./src/mastercard/mastercard.service');
const { leetcode } = require('./src/leetcode/leetcode.service');
const { logs } = require('./src/logs/log.service');

(async () => {
	try {
		mastercard();
		// leetcode();
		logs();
		infoLog('Start service');
	} catch (e) {
		errorLog(e);
	}
})();

require('dotenv').config();
require('./database/database').init();
const { infoLog, errorLog } = require('./src/utils/log');
const { mastercard } = require('./src/mastercard/mastercard.service');

(async () => {
	try {
		mastercard();
		infoLog('Start service');
	} catch (e) {
		errorLog(e);
	}
})();

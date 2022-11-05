module.exports.constants = {
	MASTERCARD_CURRENCY_LINK:
		'https://www.mastercard.us/en-us/personal/get-support/convert-currency.html',
	MASTERCARD_CURRENCY_API: (date) =>
		`https://www.mastercard.us/settlement/currencyrate/conversion-rate?fxDate=${date}&transCurr=USD&crdhldBillCurr=MYR&bankFee=0&transAmt=1`,
	LEETCODE_LOGIN_LINK: 'https://leetcode.com/accounts/login/',
	LEETCODE_LOG_FILENAME: 'leetcode.log',
	ERROR_LOG_FILENAME: 'error.log',
	INFO_LOG_FILENAME: 'info.log',
	COMBINED_LOG_FILENAME: 'combined.log',
};

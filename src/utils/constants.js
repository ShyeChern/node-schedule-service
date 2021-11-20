module.exports.constants = {
	MASTERCARD_CURRENCY_LINK:
		'https://www.mastercard.us/en-us/personal/get-support/convert-currency.html',
	MASTERCARD_CURRENCY_API: (date) =>
		`https://www.mastercard.us/settlement/currencyrate/fxDate=${date};transCurr=USD;crdhldBillCurr=MYR;bankFee=0;transAmt=1/conversion-rate`,
};

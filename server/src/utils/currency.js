/**
 * Currency & Integer Paise Utility
 * Non-negotiable rule: Money in INTEGER PAISE only (1 INR = 100 paise)
 */

/**
 * Format integer paise into Indian Rupee format (e.g. 150050 paise -> "₹1,500.50")
 */
function formatRupees(paise, includeSymbol = true) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;

  // Format integer part using Indian numbering system (e.g. 1,00,000)
  const rupeesStr = rupees.toString();
  let lastThree = rupeesStr.substring(rupeesStr.length - 3);
  const otherNumbers = rupeesStr.substring(0, rupeesStr.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const formattedDecimal = remainderPaise.toString().padStart(2, '0');

  const result = `${formattedInt}.${formattedDecimal}`;
  const prefix = isNegative ? '-' : '';
  return includeSymbol ? `${prefix}₹${result}` : `${prefix}${result}`;
}

/**
 * Convert rupee decimal to integer paise safely
 */
function rupeesToPaise(rupees) {
  if (!rupees || isNaN(rupees)) return 0;
  return Math.round(Number(rupees) * 100);
}

/**
 * Convert integer paise to rupee float (for charts/analytics displays where number format is needed)
 */
function paiseToRupees(paise) {
  if (!paise || isNaN(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Convert integer paise into Words (Indian Currency format)
 * E.g. 125000 paise -> "One Thousand Two Hundred Fifty Rupees Only"
 */
function paiseToWordsINR(paise) {
  if (!paise || paise <= 0) return 'Zero Rupees Only';

  const rupees = Math.floor(paise / 100);
  const remPaise = paise % 100;

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n) {
    if (n < 20) return ones[n];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? ' ' + ones[unit] : '');
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += ones[hundred] + ' Hundred';
      if (rest > 0) res += ' and ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let crore = Math.floor(rupees / 10000000);
  let remainder = rupees % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  let words = '';

  if (crore > 0) {
    words += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertThreeDigits(remainder) + ' ';
  }

  words = words.trim() + ' Rupees';

  if (remPaise > 0) {
    words += ' and ' + convertTwoDigits(remPaise) + ' Paise';
  }

  words += ' Only';
  return words;
}

module.exports = {
  formatRupees,
  rupeesToPaise,
  paiseToRupees,
  paiseToWordsINR
};

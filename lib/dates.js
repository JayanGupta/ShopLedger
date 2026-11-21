// Date utilities for ShopLedger (Indian DD/MM/YYYY format)

function pad2(n) {
  return ('0' + n).slice(-2);
}

exports.today = function () {
  var d = new Date();
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
};

// Added for date-picker filtering (Vikram, Oct 2021)
// Accepts either DD/MM/YYYY or YYYY-MM-DD and normalizes for string comparison
exports.normalizeDateKey = function (str) {
  if (!str) return '';
  var s = String(str).trim();
  var p = s.indexOf('-') !== -1 ? s.split('-') : s.split('/');
  if (p.length !== 3) return '';
  var year = Number(s.indexOf('-') !== -1 ? p[0] : p[2]);
  var month = Number(p[1]);
  var day = Number(s.indexOf('-') !== -1 ? p[2] : p[0]);
  var date = new Date(Date.UTC(year, month - 1, day));
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) ||
      date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  // ISO ordering makes ordinary string comparisons chronological.
  return String(year).padStart(4, '0') + '-' + pad2(month) + '-' + pad2(day);
};

exports.getFiscalYear = function (dateStr) {
  var s = exports.normalizeDateKey(dateStr);
  var parts = s.split('-');
  if (parts.length !== 3) return 'FY21-22';
  var year = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10);
  if (month >= 4) {
    return 'FY' + String(year).slice(-2) + '-' + String(year + 1).slice(-2);
  }
  return 'FY' + String(year - 1).slice(-2) + '-' + String(year).slice(-2);
};

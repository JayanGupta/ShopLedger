// Date utilities for ShopLedger (Indian DD/MM/YYYY format)

function pad2(n) {
  return ('0' + n).slice(-2);
}

exports.today = function () {
  var d = new Date();
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
};

// Accepts stored DD/MM/YYYY dates and date-picker YYYY-MM-DD values, returning
// a zero-padded ISO date that sorts chronologically as a string.
exports.normalizeDateKey = function (str) {
  if (!str) return '';
  var s = String(str).trim();
  var parts;
  var year;
  var month;
  var day;

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    parts = s.split('-');
    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    parts = s.split('/');
    day = Number(parts[0]);
    month = Number(parts[1]);
    year = Number(parts[2]);
  } else {
    return '';
  }

  var date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return '';
  }

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

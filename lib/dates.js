// Date utilities for ShopLedger (Indian DD/MM/YYYY format)

function pad2(n) {
  return ('0' + n).slice(-2);
}

exports.today = function () {
  var d = new Date();
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
};

function parseDateParts(value) {
  var match = String(value || '').trim().match(/^(?:(\d{2})\/(\d{2})\/(\d{4})|(\d{4})-(\d{2})-(\d{2}))$/);
  if (!match) return null;

  var day = Number(match[1] || match[6]);
  var month = Number(match[2] || match[5]);
  var year = Number(match[3] || match[4]);
  var date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return { day: day, month: month, year: year };
}

// Accepts either DD/MM/YYYY or YYYY-MM-DD and returns a sortable YYYYMMDD key.
exports.normalizeDateKey = function (str) {
  var parts = parseDateParts(str);
  if (!parts) return '';
  return String(parts.year) + pad2(parts.month) + pad2(parts.day);
};

exports.getFiscalYear = function (dateStr) {
  var parts = parseDateParts(dateStr);
  if (!parts) return 'FY21-22';
  var month = parts.month;
  var year = parts.year;
  if (month >= 4) {
    return 'FY' + String(year).slice(-2) + '-' + String(year + 1).slice(-2);
  }
  return 'FY' + String(year - 1).slice(-2) + '-' + String(year).slice(-2);
};

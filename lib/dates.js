// Date utilities for ShopLedger (Indian DD/MM/YYYY format)

function pad2(n) {
  return ('0' + n).slice(-2);
}

exports.today = function () {
  var d = new Date();
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
};

// Convert stored dates and date-picker values to a sortable calendar date.
exports.normalizeDateKey = function (str) {
  var s = String(str || '').trim();
  var parts = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (!parts) {
    var dayFirst = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (!dayFirst) return '';
    parts = [s, dayFirst[3], dayFirst[2], dayFirst[1]];
  }

  var key = parts[1] + '-' + pad2(parts[2]) + '-' + pad2(parts[3]);
  var date = new Date(key + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key ? key : '';
};

exports.getFiscalYear = function (dateStr) {
  var s = exports.normalizeDateKey(dateStr);
  var parts = s.split('-');
  if (parts.length !== 3) return 'FY21-22';
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[0], 10);
  if (month >= 4) {
    return 'FY' + String(year).slice(-2) + '-' + String(year + 1).slice(-2);
  }
  return 'FY' + String(year - 1).slice(-2) + '-' + String(year).slice(-2);
};

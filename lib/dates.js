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
  if (s.indexOf('-') !== -1) {
    // HTML5 input[type="date"] sends YYYY-MM-DD; convert to DD/MM/YYYY to match db.json
    var p = s.split('-');
    if (p.length === 3) {
      return p[2] + '/' + p[1] + '/' + p[0];
    }
  }
  return s;
};

// Converts stored DD/MM/YYYY values and date-picker YYYY-MM-DD values to a sortable key.
exports.toSortableDateKey = function (str) {
  if (!str) return '';
  var s = String(str).trim();
  var year;
  var month;
  var day;
  var isoParts = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  var localParts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);

  if (isoParts) {
    year = Number(isoParts[1]);
    month = Number(isoParts[2]);
    day = Number(isoParts[3]);
  } else if (localParts) {
    day = Number(localParts[1]);
    month = Number(localParts[2]);
    year = Number(localParts[3]);
  } else {
    return '';
  }

  var parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return '';
  }

  return year + '-' + pad2(month) + '-' + pad2(day);
};

exports.getFiscalYear = function (dateStr) {
  var s = exports.normalizeDateKey(dateStr);
  var parts = s.split('/');
  if (parts.length !== 3) return 'FY21-22';
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[2], 10);
  if (month >= 4) {
    return 'FY' + String(year).slice(-2) + '-' + String(year + 1).slice(-2);
  }
  return 'FY' + String(year - 1).slice(-2) + '-' + String(year).slice(-2);
};

/**
 * IST Date Formatter & Timezone Utility
 * India Standard Time (UTC+05:30)
 * Standard Display Format: "DD MMM YYYY, hh:mm a"
 */

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Converts any date representation to a Date object in IST
 */
function toISTDate(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  // Offset IST is +5h 30m = 330 minutes
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (330 * 60000));
}

/**
 * Format date to "DD MMM YYYY, hh:mm a" (e.g. "25 Oct 2026, 11:30 pm")
 */
function formatIST(dateInput) {
  const ist = toISTDate(dateInput);
  if (!ist) return '-';

  const day = String(ist.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[ist.getMonth()];
  const year = ist.getFullYear();

  let hours = ist.getHours();
  const minutes = String(ist.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const formattedHours = String(hours).padStart(2, '0');

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Format date to "DD MMM YYYY"
 */
function formatISTDate(dateInput) {
  const ist = toISTDate(dateInput);
  if (!ist) return '-';
  const day = String(ist.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[ist.getMonth()];
  const year = ist.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format time to "hh:mm a"
 */
function formatISTTime(dateInput) {
  const ist = toISTDate(dateInput);
  if (!ist) return '-';
  let hours = ist.getHours();
  const minutes = String(ist.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Get start and end UTC timestamps corresponding to an IST date range
 * E.g. 'today', 'yesterday', 'this_week', 'this_month'
 */
function getISTDateRange(rangeType = 'today') {
  // Current time in IST
  const now = new Date();
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istNow = new Date(utcNow + (330 * 60000));

  const year = istNow.getFullYear();
  const month = istNow.getMonth();
  const date = istNow.getDate();

  // Helper to convert IST Y, M, D, H, M, S to UTC Date
  const istToUTC = (y, m, d, h = 0, min = 0, s = 0, ms = 0) => {
    // Construct UTC timestamp by subtracting 5h 30m
    const targetUTC = Date.UTC(y, m, d, h, min, s, ms) - (330 * 60000);
    return new Date(targetUTC);
  };

  if (rangeType === 'today') {
    return {
      start: istToUTC(year, month, date, 0, 0, 0, 0),
      end: istToUTC(year, month, date, 23, 59, 59, 999)
    };
  }

  if (rangeType === 'yesterday') {
    return {
      start: istToUTC(year, month, date - 1, 0, 0, 0, 0),
      end: istToUTC(year, month, date - 1, 23, 59, 59, 999)
    };
  }

  if (rangeType === 'this_week') {
    const dayOfWeek = istNow.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    return {
      start: istToUTC(year, month, date + diffToMonday, 0, 0, 0, 0),
      end: istToUTC(year, month, date, 23, 59, 59, 999)
    };
  }

  if (rangeType === 'this_month') {
    return {
      start: istToUTC(year, month, 1, 0, 0, 0, 0),
      end: istToUTC(year, month + 1, 0, 23, 59, 59, 999)
    };
  }

  return null;
}

module.exports = {
  toISTDate,
  formatIST,
  formatISTDate,
  formatISTTime,
  getISTDateRange
};

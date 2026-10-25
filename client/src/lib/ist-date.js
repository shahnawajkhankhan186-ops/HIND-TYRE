/**
 * Client IST Date Formatter
 * Standard Display Format: "DD MMM YYYY, hh:mm a"
 */

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function toISTDate(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (330 * 60000));
}

export function formatIST(dateInput) {
  const ist = toISTDate(dateInput);
  if (!ist) return '-';

  const day = String(ist.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[ist.getMonth()];
  const year = ist.getFullYear();

  let hours = ist.getHours();
  const minutes = String(ist.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
}

export function formatISTDate(dateInput) {
  const ist = toISTDate(dateInput);
  if (!ist) return '-';
  const day = String(ist.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[ist.getMonth()];
  const year = ist.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatISTTime(dateInput) {
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

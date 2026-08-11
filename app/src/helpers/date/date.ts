export function getDeviceLocale() {
  return Intl.DateTimeFormat().resolvedOptions().locale || 'vi-VN';
}

export function getDeviceTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
}

export function getLocalDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

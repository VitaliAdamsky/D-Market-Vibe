export function getNearestExpirationTime() {
  const predefinedHours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const now = new Date();
  const currentHour = now.getHours();

  // Find the nearest predefined hour
  let nearestHour = predefinedHours.reduce((prev, curr) =>
    Math.abs(curr - currentHour) < Math.abs(prev - currentHour) ? curr : prev
  );

  // Adjust for the next occurrence if the current time is past the nearest hour
  if (currentHour > nearestHour) {
    const nextHourIndex =
      (predefinedHours.indexOf(nearestHour) + 1) % predefinedHours.length;
    nearestHour = predefinedHours[nextHourIndex];
  }

  // Set the date to the nearest hour
  const expirationDate = new Date(now);
  expirationDate.setHours(nearestHour, 0, 0, 0);

  // If the nearest hour is in the past, set it to the next day
  if (expirationDate <= now) {
    expirationDate.setDate(expirationDate.getDate() + 1);
  }

  // Convert to Unix timestamp (in seconds)
  const expirationTime = Math.floor(expirationDate.getTime() / 1000);

  return expirationTime * 1000;
}

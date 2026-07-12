export function getNorwegianHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat("nb-NO", {
    hour: "numeric",
    hour12: false,
    timeZone: "Europe/Oslo",
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  return Number.isFinite(hour) ? hour : date.getHours();
}

export function getNorwegianGreeting(date = new Date()) {
  const hour = getNorwegianHour(date);

  if (hour >= 0 && hour < 5) return "God natt";
  if (hour >= 5 && hour < 12) return "God morgen";
  if (hour >= 12 && hour < 18) return "God ettermiddag";
  return "God kveld";
}

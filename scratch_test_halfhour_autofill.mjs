function generateHalfHourSessions(year, month, targetEarnings, hourlyRate = 30) {
  // Each half-hour block is 0.5 hrs
  const targetHalfHours = Math.round((targetEarnings / hourlyRate) * 2);

  // Get weekdays (Mon-Fri) in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekdays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      weekdays.push(`${yyyy}-${mm}-${dd}`);
    }
  }

  let remainingHalfHours = targetHalfHours;
  const sessions = [];
  const availableDays = [...weekdays].sort(() => Math.random() - 0.5);

  let dayIdx = 0;
  while (remainingHalfHours > 0 && dayIdx < availableDays.length) {
    const dateStr = availableDays[dayIdx++];

    // Max half hours for a day is 12 (6.0 hours). Min is 1 (0.5 hours).
    let maxForThisDay = Math.min(12, remainingHalfHours);
    
    // Choose random half hours between 1 (0.5h) and maxForThisDay (up to 6.0h)
    let chosenHalfHours = 0;
    if (remainingHalfHours <= 12) {
      chosenHalfHours = remainingHalfHours;
    } else {
      // Pick random half hour count between 3 (1.5h) and 12 (6.0h)
      const options = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      chosenHalfHours = options[Math.floor(Math.random() * options.length)];
    }

    remainingHalfHours -= chosenHalfHours;
    const hours = chosenHalfHours * 0.5;

    sessions.push({
      date: dateStr,
      hours: hours,
      hourly_rate: hourlyRate,
      earned: hours * hourlyRate
    });
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date));

  const totalHours = sessions.reduce((s, x) => s + x.hours, 0);
  const totalEarned = sessions.reduce((s, x) => s + x.earned, 0);

  return { sessionsCount: sessions.length, totalHours, totalEarned, sessions };
}

console.log('Target $1565:');
console.log(generateHalfHourSessions(2026, 9, 1565, 30));

console.log('Target $800:');
console.log(generateHalfHourSessions(2026, 8, 800, 30));

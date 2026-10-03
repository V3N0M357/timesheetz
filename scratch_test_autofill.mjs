function generateMonthSessions(year, month, targetEarnings, hourlyRate) {
  const totalHoursNeeded = targetEarnings / hourlyRate;
  
  // Get weekdays in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekdays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Mon-Fri
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      weekdays.push(`${yyyy}-${mm}-${dd}`);
    }
  }

  let remainingHours = Math.round(totalHoursNeeded * 100) / 100;
  const validSteps = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0];
  const sessions = [];
  
  const availableDays = [...weekdays].sort(() => Math.random() - 0.5);
  
  let dayIdx = 0;
  while (remainingHours >= 0.49 && dayIdx < availableDays.length) {
    const dateStr = availableDays[dayIdx++];
    
    let chunk = 0;
    if (remainingHours <= 6.0) {
      chunk = Math.max(0.5, Math.min(6.0, remainingHours));
      remainingHours = Math.round((remainingHours - chunk) * 100) / 100;
    } else {
      const possibleSteps = validSteps.filter(s => (remainingHours - s) >= 0.5 || (remainingHours - s) === 0);
      if (possibleSteps.length > 0) {
        chunk = possibleSteps[Math.floor(Math.random() * possibleSteps.length)];
      } else {
        chunk = 4.0;
      }
      remainingHours = Math.round((remainingHours - chunk) * 100) / 100;
    }

    sessions.push({ date: dateStr, hours: chunk, earned: chunk * hourlyRate });
  }

  // Sort by date ascending
  sessions.sort((a, b) => a.date.localeCompare(b.date));

  return { sessions, totalEarnings: sessions.reduce((s, x) => s + x.earned, 0) };
}

console.log(generateMonthSessions(2026, 9, 1565, 30));
console.log(generateMonthSessions(2026, 8, 800, 30));

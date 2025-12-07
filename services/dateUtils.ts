
// A simplified Nepali Date utility for the scope of this project.
// In a production environment, a library like 'nepali-date-converter' is recommended.
// Here we implement basic logic to add days to a BS date.

// Nepali Month Data (Sample for 2080-2090 range to cover immediate usage)
// This is a simplified map. Real BS calendars vary yearly.
const BS_MONTH_DAYS = [
  // 2080
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2081
  [31, 32, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2082 (Estimated/Standard)
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
];

const START_BS_YEAR = 2080;

export const getCurrentDateBS = (): string => {
   // Conversion logic is complex without a library. 
   // For now, we return a placeholder or allow user input.
   // This function is mainly used to init the form.
   return "2081-01-01"; // Default fallback
};

export const addDaysToBS = (bsDate: string, daysToAdd: number): string => {
  try {
    const parts = bsDate.split(/[-/.]/);
    if (parts.length !== 3) return bsDate;

    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let day = parseInt(parts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return bsDate;

    // Simple addition logic
    let daysRemaining = daysToAdd;
    
    while (daysRemaining > 0) {
      // Get max days in current month
      // Default to 30 if year is out of our small map range
      const yearIndex = year - START_BS_YEAR;
      const daysInCurrentMonth = (yearIndex >= 0 && yearIndex < BS_MONTH_DAYS.length) 
        ? BS_MONTH_DAYS[yearIndex][month - 1] 
        : 30; 

      const spaceInMonth = daysInCurrentMonth - day;

      if (daysRemaining <= spaceInMonth) {
        day += daysRemaining;
        daysRemaining = 0;
      } else {
        daysRemaining -= (spaceInMonth + 1);
        day = 1;
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
    }

    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  } catch (e) {
    return bsDate;
  }
};

// Validates if a string is roughly in YYYY-MM-DD format for BS
export const isValidBSDate = (date: string): boolean => {
   return /^[2][0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-2])$/.test(date);
};

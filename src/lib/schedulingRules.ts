export interface AutoFillRulesInput {
  rulesText?: string;
  allowedDays?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  maxWeekendHours?: number;
  maxWeekdayHours?: number;
  generalMaxHours?: number;
  minHours?: number;
  excludedDates?: string[];
}

export interface ParsedSchedulingRules {
  allowedDays: number[];
  maxWeekendHours: number;
  maxWeekdayHours: number;
  generalMaxHours: number;
  minHours: number;
  excludedDates: string[];
  rulesText: string;
}

export interface RulePreset {
  id: string;
  label: string;
  text: string;
  allowedDays: number[];
  maxWeekendHours: number;
  maxWeekdayHours: number;
}

export const RULE_PRESETS: RulePreset[] = [
  {
    id: "school-weekends",
    label: "🎓 School on weekdays (Sat & Sun only, max 8h)",
    text: "I had school on the weekdays, so I can only work Sat and Sun. Maximum of 8 hours on weekends.",
    allowedDays: [0, 6],
    maxWeekendHours: 8,
    maxWeekdayHours: 0,
  },
  {
    id: "weekdays-standard",
    label: "💼 Weekdays only (Mon - Fri, max 6h)",
    text: "Weekdays only (Monday to Friday). Maximum of 6 hours per day.",
    allowedDays: [1, 2, 3, 4, 5],
    maxWeekendHours: 0,
    maxWeekdayHours: 6,
  },
  {
    id: "all-days-max8",
    label: "⚡ All 7 days (Mon - Sun, max 8h)",
    text: "Available every day (weekdays and weekends), maximum 8 hours per session.",
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    maxWeekendHours: 8,
    maxWeekdayHours: 8,
  },
  {
    id: "light-part-time",
    label: "🕒 Light shifts (Max 4h / session)",
    text: "Part-time light shifts only, maximum of 4 hours per day across weekdays.",
    allowedDays: [1, 2, 3, 4, 5],
    maxWeekendHours: 4,
    maxWeekdayHours: 4,
  },
];

export function parseSchedulingRules(
  rulesInput?: AutoFillRulesInput | string,
  defaultAllowedDays: number[] = [1, 2, 3, 4, 5],
  defaultMaxHours: number = 8
): ParsedSchedulingRules {
  let rulesText = "";
  let explicitDays: number[] | null = null;
  let explicitMaxWeekend: number | null = null;
  let explicitMaxWeekday: number | null = null;
  let explicitGeneralMax: number | null = null;
  let explicitMinHours: number | null = null;
  let excludedDates: string[] = [];

  if (typeof rulesInput === "string") {
    rulesText = rulesInput;
  } else if (rulesInput && typeof rulesInput === "object") {
    rulesText = rulesInput.rulesText || "";
    if (Array.isArray(rulesInput.allowedDays) && rulesInput.allowedDays.length > 0) {
      explicitDays = rulesInput.allowedDays;
    }
    if (rulesInput.maxWeekendHours && rulesInput.maxWeekendHours > 0) {
      explicitMaxWeekend = rulesInput.maxWeekendHours;
    }
    if (rulesInput.maxWeekdayHours && rulesInput.maxWeekdayHours > 0) {
      explicitMaxWeekday = rulesInput.maxWeekdayHours;
    }
    if (rulesInput.generalMaxHours && rulesInput.generalMaxHours > 0) {
      explicitGeneralMax = rulesInput.generalMaxHours;
    }
    if (rulesInput.minHours && rulesInput.minHours > 0) {
      explicitMinHours = rulesInput.minHours;
    }
    if (Array.isArray(rulesInput.excludedDates)) {
      excludedDates = rulesInput.excludedDates;
    }
  }

  let allowedDays: number[] | null = explicitDays ? [...explicitDays] : null;
  let maxWeekendHours = explicitMaxWeekend || explicitGeneralMax || defaultMaxHours;
  let maxWeekdayHours = explicitMaxWeekday || explicitGeneralMax || (defaultMaxHours <= 6 ? defaultMaxHours : 6);
  let generalMaxHours = explicitGeneralMax || defaultMaxHours;
  let minHours = explicitMinHours || 0.5;

  if (rulesText && rulesText.trim().length > 0) {
    const text = rulesText.toLowerCase();

    // 1. Weekend patterns
    const weekendOnlyPatterns = [
      /school\s+on\s+(?:the\s+)?weekdays/i,
      /only\s+(?:work\s+)?(?:on\s+)?(?:sat(?:urday)?\s*(?:and|&)\s*sun(?:day)?|weekends?)/i,
      /(?:sat(?:urday)?\s*(?:and|&)\s*sun(?:day)?|weekends?)\s+only/i,
      /can\s+only\s+work\s+(?:on\s+)?(?:sat(?:urday)?\s*(?:and|&)\s*sun(?:day)?|weekends?)/i,
      /weekdays?\s+(?:off|unavailable|busy)/i,
    ];

    const weekdayOnlyPatterns = [
      /weekdays?\s+only/i,
      /only\s+(?:work\s+)?(?:on\s+)?weekdays?/i,
      /(?:no|exclude|skip)\s+weekends?/i,
      /weekends?\s+(?:off|unavailable|busy)/i,
    ];

    const allDaysPatterns = [
      /all\s+days/i,
      /any\s+day/i,
      /every\s+day/i,
      /7\s+days/i,
      /weekdays?\s+and\s+weekends?/i,
      /weekends?\s+and\s+weekdays?/i,
    ];

    if (weekendOnlyPatterns.some((p) => p.test(text))) {
      allowedDays = [0, 6]; // Sun, Sat
    } else if (weekdayOnlyPatterns.some((p) => p.test(text))) {
      allowedDays = [1, 2, 3, 4, 5]; // Mon - Fri
    } else if (allDaysPatterns.some((p) => p.test(text))) {
      allowedDays = [0, 1, 2, 3, 4, 5, 6];
    } else {
      const dayMatches: number[] = [];
      if (/\b(sun|sunday)s?\b/i.test(text) && !/no\s+sundays?/i.test(text)) dayMatches.push(0);
      if (/\b(mon|monday)s?\b/i.test(text) && !/no\s+mondays?/i.test(text)) dayMatches.push(1);
      if (/\b(tue|tues|tuesday)s?\b/i.test(text) && !/no\s+tuesdays?/i.test(text)) dayMatches.push(2);
      if (/\b(wed|wednesday)s?\b/i.test(text) && !/no\s+wednesdays?/i.test(text)) dayMatches.push(3);
      if (/\b(thu|thur|thurs|thursday)s?\b/i.test(text) && !/no\s+thursdays?/i.test(text)) dayMatches.push(4);
      if (/\b(fri|friday)s?\b/i.test(text) && !/no\s+fridays?/i.test(text)) dayMatches.push(5);
      if (/\b(sat|saturday)s?\b/i.test(text) && !/no\s+saturdays?/i.test(text)) dayMatches.push(6);

      if (dayMatches.length > 0 && /\bonly\b/i.test(text)) {
        allowedDays = [...new Set(dayMatches)].sort();
      }
    }

    // Check for exclusions: "no fridays", "except mondays"
    if (allowedDays) {
      if (/no\s+fridays?|except\s+fridays?/i.test(text)) allowedDays = allowedDays.filter((d) => d !== 5);
      if (/no\s+mondays?|except\s+mondays?/i.test(text)) allowedDays = allowedDays.filter((d) => d !== 1);
      if (/no\s+saturdays?|except\s+saturdays?/i.test(text)) allowedDays = allowedDays.filter((d) => d !== 6);
      if (/no\s+sundays?|except\s+sundays?/i.test(text)) allowedDays = allowedDays.filter((d) => d !== 0);
    }

    // Weekend max hours: e.g. "maximum of 8 hours on weekends"
    const weekendHoursMatch =
      text.match(/(?:max(?:imum)?|up to|no more than|cap(?:ped)? at)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:on\s*)?(?:the\s*)?(?:weekends?|sat(?:urday)?\s*(?:and|&)\s*sun(?:day)?)/i) ||
      text.match(/(?:weekends?|sat(?:urday)?\s*(?:and|&)\s*sun(?:day)?)\s*(?:max(?:imum)?|up to|no more than|cap(?:ped)? at)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
    if (weekendHoursMatch) {
      const val = parseFloat(weekendHoursMatch[1]);
      if (!isNaN(val) && val > 0) {
        maxWeekendHours = val;
      }
    }

    // Weekday max hours: e.g. "maximum of 4 hours on weekdays"
    const weekdayHoursMatch =
      text.match(/(?:max(?:imum)?|up to|no more than|cap(?:ped)? at)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:on\s*)?(?:the\s*)?weekdays?/i) ||
      text.match(/weekdays?\s*(?:max(?:imum)?|up to|no more than|cap(?:ped)? at)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
    if (weekdayHoursMatch) {
      const val = parseFloat(weekdayHoursMatch[1]);
      if (!isNaN(val) && val > 0) {
        maxWeekdayHours = val;
      }
    }

    // General max hours: e.g. "maximum of 8 hours" or "max 8 hrs"
    const generalHoursMatch = text.match(
      /(?:max(?:imum)?|up to|no more than|cap(?:ped)? at)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)(?!\s*on\s*week)/i
    );
    if (generalHoursMatch) {
      const val = parseFloat(generalHoursMatch[1]);
      if (!isNaN(val) && val > 0) {
        generalMaxHours = val;
        if (!weekendHoursMatch) maxWeekendHours = val;
        if (!weekdayHoursMatch) maxWeekdayHours = val;
      }
    }

    // Min hours: e.g. "minimum of 1 hour" or "at least 1 hour"
    const minHoursMatch = text.match(/(?:min(?:imum)?|at least|no less than)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
    if (minHoursMatch) {
      const val = parseFloat(minHoursMatch[1]);
      if (!isNaN(val) && val > 0) {
        minHours = val;
      }
    }
  }

  if (!allowedDays || allowedDays.length === 0) {
    allowedDays = defaultAllowedDays;
  }

  return {
    allowedDays,
    maxWeekendHours,
    maxWeekdayHours,
    generalMaxHours,
    minHours,
    excludedDates,
    rulesText: rulesText.trim(),
  };
}

export function formatRulesSummary(rules: ParsedSchedulingRules): string {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let daysText = "";
  if (rules.allowedDays.length === 7) {
    daysText = "All 7 Days (Mon-Sun)";
  } else if (
    rules.allowedDays.length === 2 &&
    rules.allowedDays.includes(0) &&
    rules.allowedDays.includes(6)
  ) {
    daysText = "Sat & Sun Only (Weekends)";
  } else if (
    rules.allowedDays.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => rules.allowedDays.includes(d))
  ) {
    daysText = "Mon-Fri Only (Weekdays)";
  } else {
    daysText = rules.allowedDays.map((d) => dayLabels[d]).join(", ");
  }

  const isWeekendOnly = rules.allowedDays.every((d) => d === 0 || d === 6);
  const isWeekdayOnly = rules.allowedDays.every((d) => d >= 1 && d <= 5);

  let hoursText = "";
  if (isWeekendOnly) {
    hoursText = `Max ${rules.maxWeekendHours}h/session`;
  } else if (isWeekdayOnly) {
    hoursText = `Max ${rules.maxWeekdayHours}h/session`;
  } else if (rules.maxWeekendHours !== rules.maxWeekdayHours) {
    hoursText = `Max ${rules.maxWeekdayHours}h weekdays / ${rules.maxWeekendHours}h weekends`;
  } else {
    hoursText = `Max ${rules.generalMaxHours}h/session`;
  }

  return `📅 ${daysText} • ⏱️ ${hoursText} (min ${rules.minHours}h)`;
}

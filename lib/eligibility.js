export const COURSE_TYPES = [
  "1-Day", "3-Day", "10-Day", "Satipatthana Sutta",
  "20-Day", "30-Day", "45-Day", "60-Day", "Special 10-Day", "Teacher Self-Course",
];

export const LONG_TYPES = ["20-Day", "30-Day", "45-Day", "60-Day", "Special 10-Day"];

export const DEFAULT_SETTINGS = {
  regularPractice: false,
  fullCommitment: false,
  silaOneYear: false,
  role: "student", // student | at | seniorAt
};

const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => (new Date(b) - new Date(a)) / 86400000;
const monthsBetween = (a, b) => daysBetween(a, b) / 30.44;
const yearsBetween = (a, b) => daysBetween(a, b) / 365.25;

export function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function getCounts(courses) {
  const cnt = (type, status = "Attended") => courses.filter(c => c.courseType === type && c.status === status).length;
  return {
    tenDay: cnt("10-Day"),
    tenDayServed: cnt("10-Day", "Served"),
    twentyDay: cnt("20-Day"),
    thirtyDay: cnt("30-Day"),
    fortyFiveDay: cnt("45-Day"),
    sixtyDay: cnt("60-Day"),
    satipatthana: cnt("Satipatthana Sutta"),
  };
}

function getFirstCourseDate(courses) {
  return courses.reduce((min, c) => (!min || c.startDate < min ? c.startDate : min), null);
}

function getLastEndDate(courses, types) {
  const list = courses.filter(c => types.includes(c.courseType) && c.status === "Attended");
  return list.reduce((max, c) => (!max || c.endDate > max ? c.endDate : max), null);
}

function hasCourseAfter(courses, courseType, afterDate) {
  if (!afterDate) return false;
  return courses.some(c => c.courseType === courseType && c.status === "Attended" && c.startDate > afterDate);
}

export function buildTiers(courses, settings) {
  const counts = getCounts(courses);
  const firstDate = getFirstCourseDate(courses);
  const yrs = firstDate ? yearsBetween(firstDate, today()) : 0;
  const last20End = getLastEndDate(courses, ["20-Day"]);
  const last30End = getLastEndDate(courses, ["30-Day"]);

  const reqTen = (target) => {
    const rem = target - counts.tenDay;
    return {
      label: "10-Day courses attended",
      met: counts.tenDay >= target,
      detail: `${counts.tenDay} / ${target}`,
      neededLabel: rem > 0 ? `${rem} more 10-Day course${rem === 1 ? "" : "s"} needed` : `${target} / ${target} completed`,
    };
  };

  const reqSatipatthana = {
    label: "Satipatthana Sutta course attended",
    met: counts.satipatthana >= 1,
    detail: `${counts.satipatthana} / 1`,
    neededLabel: counts.satipatthana >= 1 ? "1 / 1 completed" : "1 more Satipatthana Sutta course needed",
  };

  const reqTenServed = {
    label: "10-Day course served (Dhamma service)",
    met: counts.tenDayServed >= 1,
    detail: `${counts.tenDayServed} / 1`,
    neededLabel: counts.tenDayServed >= 1 ? "1 / 1 completed" : "1 more 10-Day course served needed",
  };

  const reqYears = (target) => {
    const rem = target - yrs;
    return {
      label: `Minimum ${target} years on the path`,
      met: yrs >= target,
      detail: firstDate ? `${yrs.toFixed(1)} / ${target} yrs` : "No courses logged",
      neededLabel: yrs >= target ? `${target} yrs completed` : `${rem.toFixed(1)} more year${rem > 1 ? "s" : ""} on path needed`,
    };
  };

  const raw = [
    {
      key: "20day", title: "20-Day Course",
      requirements: [
        reqTen(5),
        reqSatipatthana,
        reqTenServed,
        reqYears(2),
        { label: "Daily sitting: 2×1hr for the past 2 years", met: settings.regularPractice, selfDeclared: true, neededLabel: "Daily sitting practice" },
        { label: "Full & exclusive commitment (no part-time)", met: settings.fullCommitment, selfDeclared: true, neededLabel: "Full & exclusive commitment" },
        { label: "Sīla maintained for the past year", met: settings.silaOneYear, selfDeclared: true, neededLabel: "Sīla maintained for past year" },
      ],
    },
    {
      key: "30day", title: "30-Day Course",
      requirements: [
        reqTen(6),
        {
          label: "20-Day course attended",
          met: counts.twentyDay >= 1,
          detail: `${counts.twentyDay} / 1`,
          neededLabel: counts.twentyDay >= 1 ? "1 / 1 completed" : "1 more 20-Day course needed",
        },
        reqSatipatthana,
        {
          label: "A 10-Day course completed after your 20-Day course",
          met: hasCourseAfter(courses, "10-Day", last20End),
          detail: last20End ? null : "Complete a 20-Day course first",
          neededLabel: hasCourseAfter(courses, "10-Day", last20End)
            ? "10-Day course after 20-Day completed"
            : (last20End ? "1 10-Day course after 20-Day course needed" : "Complete a 20-Day course first"),
        },
        reqYears(2),
        { label: "Daily sitting: 2×1hr for the past 2 years", met: settings.regularPractice, selfDeclared: true, neededLabel: "Daily sitting practice" },
        { label: "Full & exclusive commitment (no part-time)", met: settings.fullCommitment, selfDeclared: true, neededLabel: "Full & exclusive commitment" },
        { label: "Sīla maintained for the past year", met: settings.silaOneYear, selfDeclared: true, neededLabel: "Sīla maintained for past year" },
      ],
    },
    {
      key: "45day", title: "45-Day Course",
      requirements: [
        reqTen(7),
        {
          label: "30-Day courses attended",
          met: counts.thirtyDay >= 2,
          detail: `${counts.thirtyDay} / 2`,
          neededLabel: counts.thirtyDay >= 2 ? "2 / 2 completed" : `${2 - counts.thirtyDay} more 30-Day course${2 - counts.thirtyDay === 1 ? "" : "s"} needed`,
        },
        {
          label: "A 10-Day course completed after your 30-Day course",
          met: hasCourseAfter(courses, "10-Day", last30End),
          detail: last30End ? null : "Complete a 30-Day course first",
          neededLabel: hasCourseAfter(courses, "10-Day", last30End)
            ? "10-Day course after 30-Day completed"
            : (last30End ? "1 10-Day course after 30-Day course needed" : "Complete a 30-Day course first"),
        },
        { label: "Assistant Teacher, or deeply involved in Dhamma service", met: settings.role !== "student", selfDeclared: true, neededLabel: "Assistant Teacher / service involvement" },
        reqYears(3),
        { label: "Daily sitting: 2×1hr for the past 2 years", met: settings.regularPractice, selfDeclared: true, neededLabel: "Daily sitting practice" },
        { label: "Full & exclusive commitment (no part-time)", met: settings.fullCommitment, selfDeclared: true, neededLabel: "Full & exclusive commitment" },
        { label: "Sīla maintained for the past year", met: settings.silaOneYear, selfDeclared: true, neededLabel: "Sīla maintained for past year" },
      ],
    },
    {
      key: "60day", title: "60-Day Course",
      requirements: [
        {
          label: "45-Day courses attended",
          met: counts.fortyFiveDay >= 2,
          detail: `${counts.fortyFiveDay} / 2`,
          neededLabel: counts.fortyFiveDay >= 2 ? "2 / 2 completed" : `${2 - counts.fortyFiveDay} more 45-Day course${2 - counts.fortyFiveDay === 1 ? "" : "s"} needed`,
        },
        { label: "Assistant Teacher, deeply involved in Dhamma service", met: settings.role === "seniorAt", selfDeclared: true, neededLabel: "Senior AT / deep service involvement" },
        reqYears(5),
        { label: "Daily sitting: 2×1hr for the past 2 years", met: settings.regularPractice, selfDeclared: true, neededLabel: "Daily sitting practice" },
        { label: "Full & exclusive commitment (no part-time)", met: settings.fullCommitment, selfDeclared: true, neededLabel: "Full & exclusive commitment" },
        { label: "Sīla maintained for the past year", met: settings.silaOneYear, selfDeclared: true, neededLabel: "Sīla maintained for past year" },
      ],
    },
  ];

  return raw.map(t => {
    const total = t.requirements.length;
    const metCount = t.requirements.filter(r => r.met).length;
    return { ...t, total, metCount, pct: Math.round((metCount / total) * 100), eligible: metCount === total };
  });
}

export function getIntervalWarnings(courses) {
  const warnings = [];
  const lastLongEnd = getLastEndDate(courses, LONG_TYPES);
  const lastAnyEnd = courses.reduce((max, c) => (!max || c.endDate > max ? c.endDate : max), null);
  if (lastLongEnd) {
    const m = monthsBetween(lastLongEnd, today());
    if (m < 6) warnings.push(`6-month gap required between long courses — ${Math.max(0, Math.ceil(6 - m))} month(s) remaining.`);
  }
  if (lastAnyEnd) {
    const d = daysBetween(lastAnyEnd, today());
    if (d < 10) warnings.push(`10-day gap required before your next course — ${Math.max(0, Math.ceil(10 - d))} day(s) remaining.`);
  }
  return warnings;
}

export function getFirstDate(courses) {
  return getFirstCourseDate(courses);
}

export { yearsBetween };

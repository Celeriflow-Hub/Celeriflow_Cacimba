export type HealthAccessScope = {
  unitId: string;
  validFrom: string | null;
  validUntil: string | null;
  weekdays: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type LocalAccessInstant = { date: string; weekday: number; time: string };

export function isHealthAccessScopeValid(scope: HealthAccessScope, instant: LocalAccessInstant) {
  if (!scope.isActive) return false;
  if (scope.validFrom && instant.date < scope.validFrom) return false;
  if (scope.validUntil && instant.date > scope.validUntil) return false;
  if (!scope.weekdays.split(",").includes(String(instant.weekday))) return false;
  return instant.time >= scope.startTime && instant.time <= scope.endTime;
}

export function getHealthAccessAt(date: Date, timeZone = "America/Sao_Paulo"): LocalAccessInstant {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value("weekday"));
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    weekday,
    time: `${value("hour")}:${value("minute")}`,
  };
}

export function getCurrentHealthUnitIds(scopes: HealthAccessScope[], date = new Date()) {
  const instant = getHealthAccessAt(date);
  return scopes.filter(scope => isHealthAccessScopeValid(scope, instant)).map(scope => scope.unitId);
}

export function isStrongHealthPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

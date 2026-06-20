/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period 8.6 timeline math
 *
 * Definering / formål:
 * Gir korrekt plassering av tidslinjeelementer mot valgt årsskala.
 *
 * Kritisk regel:
 * En periode som starter før valgt minYear skal clippes til minYear.
 * En periode som slutter etter valgt maxYear skal clippes til maxYear.
 */

export type Period86TimelineItem = {
  start_year?: number | string | null;
  end_year?: number | string | null;
};

export type Period86TimelinePosition = {
  isVisible: boolean;
  visibleStartYear: number;
  visibleEndYear: number;
  leftPct: number;
  widthPct: number;
};

function toYear(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value).trim();
  if (!/^-?\d+$/.test(cleaned)) return null;

  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getPeriod86TimelinePosition(
  item: Period86TimelineItem,
  minYear: number,
  maxYear: number
): Period86TimelinePosition {
  const startYear = toYear(item.start_year);
  const rawEndYear = toYear(item.end_year);

  if (startYear === null) {
    return {
      isVisible: false,
      visibleStartYear: minYear,
      visibleEndYear: minYear,
      leftPct: 0,
      widthPct: 0,
    };
  }

  const endYear = rawEndYear ?? maxYear;

  if (maxYear <= minYear) {
    return {
      isVisible: false,
      visibleStartYear: minYear,
      visibleEndYear: minYear,
      leftPct: 0,
      widthPct: 0,
    };
  }

  if (endYear < minYear || startYear > maxYear) {
    return {
      isVisible: false,
      visibleStartYear: minYear,
      visibleEndYear: minYear,
      leftPct: 0,
      widthPct: 0,
    };
  }

  const visibleStartYear = Math.max(startYear, minYear);
  const visibleEndYear = Math.min(endYear, maxYear);
  const range = maxYear - minYear;

  const leftPct = ((visibleStartYear - minYear) / range) * 100;
  const widthPct = Math.max(
    0.4,
    ((visibleEndYear - visibleStartYear) / range) * 100
  );

  return {
    isVisible: true,
    visibleStartYear,
    visibleEndYear,
    leftPct,
    widthPct,
  };
}

export function formatPeriod86YearRange(
  fromYear: number | string,
  toYear: number | string
): string {
  return `${fromYear}-${toYear}`;
}

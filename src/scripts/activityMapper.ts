// Turns parsed CSV rows / FIT messages into the shape we store in Firestore.
// Firestore units: distance and elevation in meters, durations in seconds.

export interface LapData {
  type: string;
  distance: number | null;
  duration: number | null;
  hrAvg: number | null;
  hrMax: number | null;
}

export interface ActivityData {
  type: string;
  title: string;
  startTime: Date | null;
  distance: number | null;
  duration: number | null;
  hrAvg: number | null;
  hrMax: number | null;
  elevation: number | null;
  calories: number | null;
  cadence: number | null;
  power: number | null;
}

export interface ActivityUpload {
  activity: ActivityData;
  laps: LapData[];
}

/**
 * Converts a CSV value like "3,887" into a number. Blank values and "--" become null.
 */
function toNumber(value: string): number | null {
  if (value == '' || value == '--') {
    return null;
  }
  const number = Number(value.replace(/,/g, ''));
  if (isNaN(number)) {
    return null;
  }
  return number;
}

/**
 * Converts a time like "7:00.5" or "00:30:22" into seconds.
 */
function timeToSeconds(value: string): number | null {
  if (value == '' || value == '--') {
    return null;
  }

  const parts = value.split(':');
  let seconds = 0;
  for (const part of parts) {
    seconds = seconds * 60 + Number(part);
  }

  if (isNaN(seconds)) {
    return null;
  }
  return seconds;
}

function milesToMeters(miles: number | null): number | null {
  if (miles == null) {
    return null;
  }
  return Math.round(miles * 1609.344);
}

function feetToMeters(feet: number | null): number | null {
  if (feet == null) {
    return null;
  }
  return Math.round(feet * 0.3048);
}

/**
 * Finds a value in a CSV row by its column name. Returns '' if the column doesn't exist.
 */
function getColumn(header: string[], row: string[], name: string): string {
  const index = header.indexOf(name);
  if (index == -1 || index >= row.length) {
    return '';
  }
  return row[index].trim();
}

/**
 * Converts Garmin sport names like "Running" or "cycling" into our short type names.
 */
function mapSportType(sport: string): string {
  const lower = sport.toLowerCase();
  if (lower.includes('run')) {
    return 'run';
  }
  if (lower.includes('cycl') || lower.includes('bik')) {
    return 'bike';
  }
  if (lower.includes('swim')) {
    return 'swim';
  }
  return lower;
}

/**
 * Makes a title out of a file name, e.g. "activity_22751207086.csv" -> "Activity 22751207086".
 */
function titleFromFileName(fileName: string): string {
  let name = fileName.replace(/\.(csv|fit)$/i, '');
  name = name.replace(/^activity_/i, '');
  name = name.replace(/_ACTIVITY$/i, '');
  return 'Activity ' + name;
}

/**
 * FIT fields can be missing (undefined), but Firestore doesn't accept undefined, so use null instead.
 */
function numberOrNull(value: any): number | null {
  if (typeof value == 'number') {
    return value;
  }
  return null;
}

/**
 * Figures out which Garmin CSV export this is from its header row.
 */
export function detectCsvType(header: string[]): 'single' | 'multiple' {
  if (header.includes('Step Type')) {
    return 'single';
  }
  if (header.includes('Activity Type')) {
    return 'multiple';
  }
  throw new Error('Unrecognized CSV format');
}

/**
 * Single-activity CSV: one row per lap, then a "Summary" row with the totals.
 * This export has no date, title, or sport, so those get placeholder values.
 */
export function fromSingleCsv(rows: string[][], fileName: string): ActivityUpload {
  const header = rows[0];
  const laps: LapData[] = [];
  let summary: string[] | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    if (getColumn(header, row, 'Interval') == 'Summary') {
      summary = row;
      continue;
    }

    laps.push({
      type: getColumn(header, row, 'Step Type'),
      distance: milesToMeters(toNumber(getColumn(header, row, 'Distance'))),
      duration: timeToSeconds(getColumn(header, row, 'Time')),
      hrAvg: toNumber(getColumn(header, row, 'Avg HR')),
      hrMax: toNumber(getColumn(header, row, 'Max HR')),
    });
  }

  if (summary == null) {
    throw new Error('CSV has no Summary row');
  }

  const activity: ActivityData = {
    type: 'run',
    title: titleFromFileName(fileName),
    startTime: null,
    distance: milesToMeters(toNumber(getColumn(header, summary, 'Distance'))),
    duration: timeToSeconds(getColumn(header, summary, 'Time')),
    hrAvg: toNumber(getColumn(header, summary, 'Avg HR')),
    hrMax: toNumber(getColumn(header, summary, 'Max HR')),
    elevation: feetToMeters(toNumber(getColumn(header, summary, 'Total Ascent'))),
    calories: toNumber(getColumn(header, summary, 'Calories')),
    cadence: toNumber(getColumn(header, summary, 'Avg Run Cadence')),
    power: toNumber(getColumn(header, summary, 'Avg Power')),
  };

  return { activity: activity, laps: laps };
}

/**
 * Multi-activity CSV: one row per activity, no lap data.
 */
export function fromMultiCsv(rows: string[][]): ActivityUpload[] {
  const header = rows[0];
  const uploads: ActivityUpload[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Dates look like "2026-05-29 12:18:13"
    let startTime: Date | null = null;
    const dateText = getColumn(header, row, 'Date');
    if (dateText != '') {
      startTime = new Date(dateText.replace(' ', 'T'));
    }

    const activity: ActivityData = {
      type: mapSportType(getColumn(header, row, 'Activity Type')),
      title: getColumn(header, row, 'Title'),
      startTime: startTime,
      distance: milesToMeters(toNumber(getColumn(header, row, 'Distance'))),
      duration: timeToSeconds(getColumn(header, row, 'Time')),
      hrAvg: toNumber(getColumn(header, row, 'Avg HR')),
      hrMax: toNumber(getColumn(header, row, 'Max HR')),
      elevation: feetToMeters(toNumber(getColumn(header, row, 'Total Ascent'))),
      calories: toNumber(getColumn(header, row, 'Calories')),
      cadence: toNumber(getColumn(header, row, 'Avg Run Cadence')),
      power: toNumber(getColumn(header, row, 'Avg Power')),
    };

    uploads.push({ activity: activity, laps: [] });
  }

  return uploads;
}

/**
 * FIT file: totals come from the first session message, laps from the lap messages.
 * FIT values are already in meters and seconds.
 */
export function fromFit(messages: any, fileName: string): ActivityUpload {
  if (!messages.sessionMesgs || messages.sessionMesgs.length == 0) {
    throw new Error('FIT file has no session data');
  }
  const session = messages.sessionMesgs[0];

  let type = 'unknown';
  if (typeof session.sport == 'string') {
    type = mapSportType(session.sport);
  }

  // FIT stores running cadence per leg, Garmin CSVs show steps for both legs
  let cadence = numberOrNull(session.avgCadence);
  if (cadence != null && type == 'run') {
    cadence = cadence * 2;
  }

  let startTime: Date | null = null;
  if (session.startTime instanceof Date) {
    startTime = session.startTime;
  }

  let distance = numberOrNull(session.totalDistance);
  if (distance != null) {
    distance = Math.round(distance);
  }

  const activity: ActivityData = {
    type: type,
    title: titleFromFileName(fileName),
    startTime: startTime,
    distance: distance,
    duration: numberOrNull(session.totalTimerTime),
    hrAvg: numberOrNull(session.avgHeartRate),
    hrMax: numberOrNull(session.maxHeartRate),
    elevation: numberOrNull(session.totalAscent),
    calories: numberOrNull(session.totalCalories),
    cadence: cadence,
    power: numberOrNull(session.avgPower),
  };

  const laps: LapData[] = [];
  let fitLaps: any[] = [];
  if (messages.lapMesgs) {
    fitLaps = messages.lapMesgs;
  }

  for (const fitLap of fitLaps) {
    let lapType = 'lap';
    if (typeof fitLap.intensity == 'string') {
      lapType = fitLap.intensity;
    }

    let lapDistance = numberOrNull(fitLap.totalDistance);
    if (lapDistance != null) {
      lapDistance = Math.round(lapDistance);
    }

    laps.push({
      type: lapType,
      distance: lapDistance,
      duration: numberOrNull(fitLap.totalTimerTime),
      hrAvg: numberOrNull(fitLap.avgHeartRate),
      hrMax: numberOrNull(fitLap.maxHeartRate),
    });
  }

  return { activity: activity, laps: laps };
}

export type DistanceUnit = 'mi' | 'km';

export type Lap = {
  id: string;
  type: string;
  distance: number | null;
  distanceUnit: DistanceUnit;
  duration: number | null;
  avgHR: number | null;
  maxHR: number | null;
  notes: string;
};

export const createEmptyLap = (): Lap => ({
  id: crypto.randomUUID(),
  type: 'Default',
  distance: null,
  distanceUnit: 'mi',
  duration: null,
  avgHR: null,
  maxHR: null,
  notes: '',
});
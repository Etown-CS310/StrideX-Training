import { useEffect, useState } from 'react';
import { PlusLg, PencilSquare } from 'react-bootstrap-icons';

import LapRow from '../ui/LapRow';
import { createEmptyLap, type Lap } from '../../types/lap';
import { formatDuration, fromSeconds } from '../../scripts/time';
import type { Activity } from '../../scripts/loadActivities';
import { updateActivity, type ActivityChanges } from '../../scripts/updateActivity';
import './ActivitySidebar.css';
import LapDisplayRow from './LapDisplayRow';

// Firestore stores meters, the form shows miles/km and feet
const METERS_PER_MILE = 1609.344;
const METERS_PER_KM = 1000;
const METERS_PER_FOOT = 0.3048;

const ACTIVITY_TYPES = ['run', 'bike', 'swim'];

interface ActivitySidebarProps {
  activity?: Activity | null;
  onSave?: (updated: Activity) => void;
  onCancel?: () => void;
}

/**
 * Converts a stored activity into the values shown in the form.
 * @param activity - The activity to show, or null for an empty form.
 * @returns The form values.
 */
function formFromActivity(activity: Activity | null | undefined) {
  let time: ReturnType<typeof fromSeconds> | null = null;
  if (activity?.duration != null) {
    time = fromSeconds(Math.round(activity.duration));
  }

  let distance: number | null = null;
  if (activity?.distance != null) {
    distance = Math.round((activity.distance / METERS_PER_MILE) * 100) / 100;
  }

  let elevation: number | null = null;
  if (activity?.elevation != null) {
    elevation = Math.round(activity.elevation / METERS_PER_FOOT);
  }

  return {
    title: activity?.title ?? null,
    type: activity?.type ?? 'Default',
    distance: distance,
    distanceUnit: 'mi',
    hours: time?.hours ?? null,
    minutes: time?.minutes ?? null,
    seconds: time?.seconds ?? null,
    avgHR: activity?.hrAvg ?? null,
    maxHR: activity?.hrMax ?? null,
    notes: activity?.notes ?? null,
    elevation: elevation,
    calories: activity?.calories ?? null,
    cadence: activity?.cadence ?? null,
    power: activity?.power ?? null,
  };
}

function ActivitySidebar({ activity, onSave, onCancel }: ActivitySidebarProps) {
  // Values the form started with, used to only save fields that were changed
  const [initial, setInitial] = useState(() => formFromActivity(activity));

  const [title, setTitle] = useState<string | null>(initial.title);
  const [type, setType] = useState<string>(initial.type);

  const [distance, setDistance] = useState<number | null>(initial.distance);
  const [distanceUnit, setDistanceUnit] = useState<string>(initial.distanceUnit);
  const [hours, setHours] = useState<number | null>(initial.hours);
  const [minutes, setMinutes] = useState<number | null>(initial.minutes);
  const [seconds, setSeconds] = useState<number | null>(initial.seconds);

  const totalSeconds = (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);

  const [avgHR, setAvgHR] = useState<number | null>(initial.avgHR);
  const [maxHR, setMaxHR] = useState<number | null>(initial.maxHR);

  const [laps, setLaps] = useState<Lap[]>([]);
  const [lapForm, setLapForm] = useState<Lap>(createEmptyLap());

  const [notes, setNotes] = useState<string | null>(initial.notes);

  const [elevation, setElevation] = useState<number | null>(initial.elevation);
  const [calories, setCalories] = useState<number | null>(initial.calories);

  const [cadence, setCadence] = useState<number | null>(initial.cadence);
  const [power, setPower] = useState<number | null>(initial.power);

  const [lapEditEnabled, setLapEditEnabled] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');

  const form = {
    title, type, distance, distanceUnit, hours, minutes, seconds,
    avgHR, maxHR, notes, elevation, calories, cadence, power,
  };

  /**
   * Compares the form to its starting values and converts the changed fields back to Firestore units.
   * @returns Only the fields that were changed.
   */
  const getChanges = (): ActivityChanges => {
    const changes: ActivityChanges = {};

    if (title !== initial.title) changes.title = title ?? '';
    if (type !== initial.type) changes.type = type;

    if (distance !== initial.distance || distanceUnit !== initial.distanceUnit) {
      const metersPerUnit = distanceUnit === 'km' ? METERS_PER_KM : METERS_PER_MILE;
      changes.distance = distance == null ? null : Math.round(distance * metersPerUnit);
    }

    if (hours !== initial.hours || minutes !== initial.minutes || seconds !== initial.seconds) {
      const durationEmpty = hours == null && minutes == null && seconds == null;
      changes.duration = durationEmpty ? null : totalSeconds;
    }

    if (avgHR !== initial.avgHR) changes.hrAvg = avgHR;
    if (maxHR !== initial.maxHR) changes.hrMax = maxHR;
    if (notes !== initial.notes) changes.notes = notes ?? '';

    if (elevation !== initial.elevation) {
      changes.elevation = elevation == null ? null : Math.round(elevation * METERS_PER_FOOT);
    }

    if (calories !== initial.calories) changes.calories = calories;
    if (cadence !== initial.cadence) changes.cadence = cadence;
    if (power !== initial.power) changes.power = power;

    return changes;
  };

  const changes = getChanges();
  const hasChanges = Object.keys(changes).length > 0;

  const saveActivityHandler = async () => {
    if (activity == null || !hasChanges) return;

    setSaving(true);
    setSaveError('');
    try {
      await updateActivity(activity.id, changes);
      setInitial(form);
      onSave?.({ ...activity, ...changes });
    } catch (error) {
      console.error('Error saving activity:', error);
      setSaveError('Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  // Show the stored type even if it isn't one of the usual options
  const typeOptions = ACTIVITY_TYPES.includes(type) || type === 'Default'
    ? ACTIVITY_TYPES
    : [...ACTIVITY_TYPES, type];

  /**
   * Takes string and converts it to a number with optional max cap.
   * @param raw - The raw string input to be converted to a number.
   * @param max - The max cap for raw.
   * @returns The converted number, or null if the input is empty.
   */
  const clampNumberInput = (raw: string, max?: number) => {
    if (raw === '') return null;
    const value = Math.max(Number(raw), 0);
    return max !== undefined ? Math.min(value, max) : value;
  };

  const updateLapForm = <K extends keyof Lap>(field: K, value: Lap[K]) =>
    setLapForm((prev) => ({ ...prev, [field]: value }));

  const updateLap = <K extends keyof Lap>(id: string, field: K, value: Lap[K]) =>
    setLaps((prev) =>
      prev.map((lap) => (lap.id === id ? { ...lap, [field]: value } : lap))
    );

  const saveLapHandler = () => {
    setLaps((prev) => [...prev, lapForm]);
    setLapForm(createEmptyLap());
  };

  const deleteLapHandler = (id: string) => {
    setLaps((prev) => prev.filter((lap) => lap.id !== id));
  };

  useEffect(() => {
    if (laps.length <= 0) setLapEditEnabled(false);
  }, [laps]);

  /**
   * Checks if a lap can be saved based on its distance or time.
   * @param lap - The Lap object to check.
   * @returns {boolean} True if the lap distance or time is greater than zero, otherwise false.
   */
  const canSaveLap = (lap: Lap): boolean => (lap.distance ?? 0) > 0 || (lap.duration ?? 0) > 0;

  return (
    <>
      <div className="row">
        <div className="col-6 p-2">
          {/* Activity Title */}
          <label htmlFor="activity_title" className="form-label text-white">Activity Title</label>
          <input
            id="activity_title"
            type="text"
            value={title ?? ''}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Activity Title"
            className="form-control rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
          />
        </div>

        <div className="col-6 p-2">
          {/* Activity Type */}
          <label htmlFor="activity_select" className="form-label text-white">Activity Type</label> 
          <select
            id="activity_select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="form-select rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex activity-input"
            aria-label="Activity Type"
          >
            <option value="Default">Default</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="col-6 p-2">
          {/* Distance */}
          <label htmlFor="distance" className="form-label text-white">Distance</label>
          <div className="input-group w-100">
            <input
              id="distance"
              type="number"
              value={distance ?? ''}
              onChange={(e) => setDistance(clampNumberInput(e.target.value))}
              placeholder="0.0"
              className="form-control rounded-end-0 rounded-pill bg-transparent text-white border-white w-50 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
            />
            <select 
              id="distance-unit"
              value={distanceUnit ?? 'mi'}
              onChange={(e) => setDistanceUnit(e.target.value)}
              className="form-select rounded-start-0 rounded-pill bg-transparent text-white border-white w-50 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex activity-input"
              aria-label="Distance Unit"
            >
              <option value="mi">mi</option>
              <option value="km">km</option>
            </select>
          </div>
          <p className="text-white mt-1 mb-0">Pace: 0:00 / mi</p>
        </div>

        <div className="col-6 p-2">
          {/* Duration (hh:mm:ss) */}
          <label htmlFor="duration" className="form-label text-white">Duration</label>
          <div id="duration" className="w-100 input-group overflow-visible">
            <input
              type="number"
              value={hours ?? ''}
              onChange={(e) => setHours(clampNumberInput(e.target.value, 99))}
              placeholder="h"
              className="form-control rounded-end-0 rounded-pill bg-transparent text-center text-white border-white w-100 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Hours"
            />
            <input
              type="number"
              value={minutes ?? ''}
              onChange={(e) => setMinutes(clampNumberInput(e.target.value, 59))}
              placeholder="mm"
              className="form-control bg-transparent text-center text-white border-white w-100 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Minutes"
            />
            <input
              type="number"
              value={seconds ?? ''}
              onChange={(e) => setSeconds(clampNumberInput(e.target.value, 59))}
              placeholder="ss"
              className="form-control rounded-start-0 rounded-pill bg-transparent text-center text-white border-white w-100 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Seconds"
            />
          </div>
          <p className="text-white mt-1 mb-0">Elapsed: {formatDuration(totalSeconds)}</p>
        </div>
      </div>

      <div className="row">
        <div className="col-6 p-2">
          {/* Avg HR */}
          <label htmlFor="avgHR" className="form-label text-white">Avg HR</label>
          <div className="w-100 input-group mb-3">
            <input 
              id="avgHR"
              type="number"
              value={avgHR ?? ''}
              onChange={(e) => setAvgHR(clampNumberInput(e.target.value))}
              className="form-control rounded-end-0 rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-describedby="avgHR-unit"
            />
            <span id="avgHR-unit" className="input-group-text rounded-start-0 rounded-pill bg-transparent text-white border-white">bpm</span>
          </div>
        </div>

        <div className="col-6 p-2">
          {/* Max HR */}
          <label htmlFor="maxHR" className="form-label text-white">Max HR</label>
          <div className="input-group mb-3">
            <input
              id="maxHR"
              type="number"
              value={maxHR ?? ''}
              onChange={(e) => setMaxHR(clampNumberInput(e.target.value))}
              className="form-control rounded-end-0 rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-describedby="maxHR-unit"
            />
            <span id="maxHR-unit" className="input-group-text rounded-start-0 rounded-pill bg-transparent text-white border-white">bpm</span>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 p-2">
          <label htmlFor="lap-wrapper" className="form-label text-white">Lap Data</label>
          <div className="lap-wrapper bg-stridex-black border border-stridex-lightgrey rounded-4 overflow-hidden">
            <div className="lap-scroll overflow-y-auto">
            <table className="table table-sm table-borderless align-middle mb-0 lap-table">
              <thead>
                <tr>
                  <th scope="col" className="ps-2 type-col">Type</th>
                  <th scope="col" className="ps-2 stats-col">Stats</th>
                  <th scope="col" className="ps-2 hr-col">HR</th>
                </tr>
              </thead>

              {laps.map((lap) => (
                lapEditEnabled ? (
                  // Render editable Lap Row
                  <LapRow
                    key={lap.id}
                    lap={lap}
                    idPrefix={`lap-${lap.id}`}
                    onChange={(field, value) => updateLap(lap.id, field, value)}
                    onDelete={() => deleteLapHandler(lap.id)}
                  />
                ) : (
                  // Render display Lap Row and Lap Input Form Row
                    <LapDisplayRow
                      key={lap.id}
                      lap={lap}
                      idPrefix={`lap-${lap.id}`}
                    />
                )
              ))}

              {!lapEditEnabled && (
                <LapRow
                  lap={lapForm}
                  idPrefix="lap-form"
                  onChange={updateLapForm}
                />
              )}

              <tfoot>
                <tr>
                  <td colSpan={3}>
                    <div className="d-flex justify-content-between w-100 gap-2">
                      {/* Save Lap (if lap has a required field filled in) */}
                      <button
                        onClick={saveLapHandler}
                        disabled={!canSaveLap(lapForm)}
                        className="btn btn-sm bg-stridex-grey rounded-pill d-inline-flex align-items-center justify-content-center text-white p-1 px-2 my-1 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex"
                      >
                        <PlusLg size={16} className="me-1" />
                        Save Lap
                      </button>

                      {/* Edit Laps (if there are saved laps) */}
                      <button
                        onClick={() => setLapEditEnabled(!lapEditEnabled)}
                        disabled={laps.length === 0}
                        className="btn btn-sm bg-stridex-grey rounded-pill d-inline-flex align-items-center justify-content-center text-white p-1 px-2 my-1 transition-ui hover-bg-warning-hover focus-warning"
                      >
                        <PencilSquare size={16} className="me-1" />
                        Edit Laps
                      </button>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 p-2">
          {/* Notes */}
          <label htmlFor="notes" className="form-label text-white">Notes</label>
          <input
            id="notes"
            type="text"
            value={notes ?? ''}
            onChange={(e) => setNotes(e.target.value)}
            className="form-control rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
          />
        </div>
      </div>
      
      <div className="row">
        <div className="col-6 p-2">
          {/* Elevation */}
          <label htmlFor="elevation" className="form-label text-white">Elevation</label>
          <div className="input-group mb-3">
            <input
              id="elevation"
              type="number"
              value={elevation ?? ''}
              onChange={(e) => setElevation(clampNumberInput(e.target.value))}
              className="form-control rounded-end-0 rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-describedby="elevation-unit"
            />
            <span id="elevation-unit" className="input-group-text rounded-start-0 rounded-pill bg-transparent text-white border-white">ft</span>
          </div>
        </div>

        <div className="col-6 p-2">
          {/* Calories */}
          <label htmlFor="calories" className="form-label text-white">Calories</label>
          <div className="input-group mb-3">
            <input
              id="calories"
              type="number"
              value={calories ?? ''}
              onChange={(e) => setCalories(clampNumberInput(e.target.value))}
              className="form-control rounded-end-0 rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-describedby="calories-unit"
            />
            <span id="calories-unit" className="input-group-text rounded-start-0 rounded-pill bg-transparent rounded-pill p-1 px-2 text-white border-white">Cal</span>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-6 p-2">
          {/* Cadence */}
          <label htmlFor="cadence" className="form-label text-white">Cadence</label>
          <div className="input-group mb-3">
            <input 
              id="cadence"
              type="number"
              value={cadence ?? ''}
              onChange={(e) => setCadence(clampNumberInput(e.target.value))}
              className="form-control rounded-end-0 rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-describedby="cadence-unit"
            />
            <span id="cadence-unit" className="input-group-text rounded-start-0 rounded-pill bg-transparent text-white border-white">ft</span>
          </div>
        </div>

        <div className="col-6 p-2">
          {/* Power */}
          <label htmlFor="power" className="form-label text-white">Power</label>
          <div className="input-group mb-3">
            <input 
              id="power"
              type="number"
              value={power ?? ''}
              onChange={(e) => setPower(clampNumberInput(e.target.value))}
              className="form-control rounded-end-0 rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-describedby="power-unit"
            />
            <span id="power-unit" className="input-group-text rounded-start-0 rounded-pill bg-transparent text-white border-white">K</span>
          </div>
        </div>
      </div>

      {activity != null && (
        <div className="row">
          <div className="col-12 p-2">
            {saveError !== '' && (
              <div className="alert alert-danger py-2">{saveError}</div>
            )}
            <div className="d-flex justify-content-end gap-2">
              {/* Cancel (deselects the activity) */}
              <button
                onClick={onCancel}
                disabled={saving}
                className="btn btn-outline-light rounded-pill px-3 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              >
                Cancel
              </button>

              {/* Save (if something was changed) */}
              <button
                onClick={saveActivityHandler}
                disabled={!hasChanges || saving}
                className="btn bg-stridex-green text-stridex-black rounded-pill px-3 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ActivitySidebar;
import { useEffect, useState } from 'react';
import { PlusLg, PencilSquare, Eraser, Floppy } from 'react-bootstrap-icons';

import LapRow from '../ui/LapRow';
import LapDisplayRow from './LapDisplayRow';

import { createEmptyLap, type Lap } from '../../types/lap';
import { formatDuration, fromSeconds } from '../../scripts/time';
import { clampNumberInput } from '../../scripts/input';
import type { Activity } from '../../scripts/loadActivities';
import type { ActivityData, LapData } from '../../scripts/activityMapper';
import { updateActivity, type ActivityChanges } from '../../scripts/updateActivity';
import { uploadActivity } from '../../scripts/uploadActivity';
import { ACTIVITY_TYPES, WORKOUT_TYPES } from '../../scripts/activityTypes';
import './ActivitySidebar.css';

// Firestore stores meters, the form shows miles/km and feet
const METERS_PER_MILE = 1609.344;
const METERS_PER_KM = 1000;
const METERS_PER_FOOT = 0.3048;

interface ActivitySidebarProps {
  /** The activity being edited, or null to fill in a new one. */
  activity?: Activity | null;
  /** Day a new activity is saved on (the day selected in the calendar). */
  date?: Date;
  onSave?: (updated: Activity) => void;
  onCreate?: (created: Activity) => void;
  onCancel?: () => void;
}

/**
 * Converts the laps in the form into the shape stored in Firestore (meters, seconds).
 */
function lapsToLapData(laps: Lap[]): LapData[] {
  return laps.map((lap) => {
    const metersPerUnit = lap.distanceUnit === 'km' ? METERS_PER_KM : METERS_PER_MILE;
    return {
      type: lap.type,
      distance: lap.distance == null ? null : Math.round(lap.distance * metersPerUnit),
      duration: lap.duration,
      hrAvg: lap.avgHR,
      hrMax: lap.maxHR,
    };
  });
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
    type: activity?.type ?? 'run',
    workoutType: activity?.workoutType ?? null,
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

function ActivitySidebar({ activity, date, onSave, onCreate, onCancel }: ActivitySidebarProps) {
  // Values the form started with, used to only save fields that were changed
  const [initial, setInitial] = useState(() => formFromActivity(activity));

  const [title, setTitle] = useState<string | null>(initial.title);
  const [type, setType] = useState<string>(initial.type);
  const [workoutType, setWorkoutType] = useState<string | null>(initial.workoutType);

  const [distance, setDistance] = useState<number | null>(initial.distance);
  const [distanceUnit, setDistanceUnit] = useState<string>(initial.distanceUnit);
  const [hours, setHours] = useState<number | null>(initial.hours);
  const [minutes, setMinutes] = useState<number | null>(initial.minutes);
  const [seconds, setSeconds] = useState<number | null>(initial.seconds);

  // Calculate total seconds and pace based on distance and duration
  const totalSeconds = (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
  const pace = (totalSeconds > 0 && distance !== null && distance > 0) ?
    totalSeconds / (distanceUnit === 'mi' ? distance : distance * 0.621371) :
    0;

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
  const [, setRemovingIds] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  const form = {
    title, type, workoutType, distance, distanceUnit, hours, minutes, seconds,
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
    if (workoutType !== initial.workoutType) changes.workoutType = workoutType;

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

  // Same rule as the Upload page: needs a title and a distance or a duration
  const canCreate = (title ?? '').trim() !== '' && (totalSeconds > 0 || (distance ?? 0) > 0);

  /**
   * Saves the form as a new activity on the day selected in the calendar.
   */
  const createActivityHandler = async () => {
    if (!canCreate) return;

    // Noon on the selected day, so time zones can't push it onto a different day
    const day = date ?? new Date();
    const startTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12);

    const metersPerUnit = distanceUnit === 'km' ? METERS_PER_KM : METERS_PER_MILE;
    const durationEmpty = hours == null && minutes == null && seconds == null;

    const data: ActivityData = {
      type: type,
      workoutType: workoutType,
      title: (title ?? '').trim(),
      startTime: startTime,
      distance: distance == null ? null : Math.round(distance * metersPerUnit),
      duration: durationEmpty ? null : totalSeconds,
      hrAvg: avgHR,
      hrMax: maxHR,
      elevation: elevation == null ? null : Math.round(elevation * METERS_PER_FOOT),
      calories: calories,
      cadence: cadence,
      power: power,
    };
    const trimmedNotes = (notes ?? '').trim();

    setSaving(true);
    setSaveError('');
    setSaveStatus('');
    try {
      const id = await uploadActivity({ activity: data, laps: lapsToLapData(laps), notes: trimmedNotes });
      clearForm();
      setSaveStatus('Saved "' + data.title + '"');
      onCreate?.({ ...data, id: id, notes: trimmedNotes });
    } catch (error) {
      console.error('Error creating activity:', error);
      setSaveError('Could not save activity');
    } finally {
      setSaving(false);
    }
  };

  // Show the stored type even if it isn't one of the usual options
  const typeOptions = ACTIVITY_TYPES.includes(type)
    ? ACTIVITY_TYPES
    : [...ACTIVITY_TYPES, type];
  const workoutOptions = workoutType == null || WORKOUT_TYPES.includes(workoutType)
    ? WORKOUT_TYPES
    : [...WORKOUT_TYPES, workoutType];

  /**
   * Update a value in the lap form state.
   * @param field - The field of the Lap object to update.
   * @param value- The new value for the specified field.
   */
  const updateLapForm = <K extends keyof Lap>(field: K, value: Lap[K]) =>
    setLapForm((prev) => ({ ...prev, [field]: value }));

  /**
   * Update a specific lap in the laps array.
   * @param id - The ID of the lap to update.
   * @param field - The field of the Lap object to update.
   * @param value - The new value for the specified field.
   */
  const updateLap = <K extends keyof Lap>(id: string, field: K, value: Lap[K]) =>
    setLaps((prev) =>
      prev.map((lap) => (lap.id === id ? { ...lap, [field]: value } : lap))
    );

  /**
   * Saves the current lap form to the laps array and resets the lap form to an empty state.
   */
  const saveLapHandler = () => {
    setLaps((prev) => [...prev, lapForm]);
    setLapForm(createEmptyLap());
  };

  /**
   * Deletes a lap by its ID, with a delay to allow animation.
   * @param id - The ID of the lap to delete.
   */
  const deleteLapHandler = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      const remaining = laps.filter((l) => l.id !== id);
      setLaps(remaining);
      setRemovingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      if (remaining.length === 0) setLapEditEnabled(false);
    }, 300);
  };

  /**
   * Clears all form fields and resets the state to initial values.
   */
  const clearForm = () => {
    setTitle(null);
    setType('run');
    setWorkoutType(null);
    setSaveError('');
    setSaveStatus('');
    setDistance(null);
    setDistanceUnit('mi');
    setHours(null);
    setMinutes(null);
    setSeconds(null);
    setAvgHR(null);
    setMaxHR(null);
    setLaps([]);
    setLapForm(createEmptyLap());
    setNotes(null);
    setElevation(null);
    setCalories(null);
    setCadence(null);
    setPower(null);
  }

  useEffect(() => {
    if (laps.length <= 0) setLapEditEnabled(false);
  }, [laps]);

  /**
   * Checks if lap distance or time is greater than zero to determine if the lap can be saved.
   * @param lap - The Lap object to check.
   */
  const canSaveLap = (lap: Lap): boolean => (lap.distance ?? 0) > 0 || (lap.duration ?? 0) > 0;

  return (
    <>
      <div className="row">
        <div className="col-12 p-2">
          {/* Activity Title */}
          <label htmlFor="activity-title" className="form-label text-white">
            Activity Title
            <span className="text-danger">*</span>
          </label>
          <input
            id="activity-title"
            type="text"
            value={title ?? ''}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
          />
        </div>
      </div>

      <div className="row">
        <div className="col-6 p-2">
          {/* Activity Type */}
          <label htmlFor="activity-select" className="form-label text-white">Activity</label>
          <select
            id="activity-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="form-select rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex activity-input"
            aria-label="Activity"
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 p-2">
          {/* Workout Type (Easy, Tempo, ...), "Default" means none */}
          <label htmlFor="activity-type-select" className="form-label text-white">Activity Type</label>
          <select
            id="activity-type-select"
            value={workoutType ?? 'Default'}
            onChange={(e) => setWorkoutType(e.target.value === 'Default' ? null : e.target.value)}
            className="form-select rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex activity-input"
            aria-label="Activity Type"
          >
            <option value="Default">Default</option>
            {workoutOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="col-6 p-2">
          {/* Distance */}
          <label htmlFor="activity-distance" className="form-label text-white">
            Distance
            <span className="text-danger">*</span>
          </label>
          <div className="input-group w-100">
            <input
              id="activity-distance"
              type="number"
              value={distance ?? ''}
              onChange={(e) => setDistance(clampNumberInput(e.target.value))}
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
          <p className="text-white mt-1 mb-0">{`Pace: ${formatDuration(pace, false)}`}</p>
        </div>

        <div className="col-6 p-2">
          {/* Duration (hh:mm:ss) */}
          <label htmlFor="duration" className="form-label text-white">
            Duration (h:mm:ss)
            <span className="text-danger">*</span>
          </label>
          <div id="duration" className="w-100 input-group overflow-visible">
            <input
              type="number"
              value={hours ?? ''}
              onChange={(e) => setHours(clampNumberInput(e.target.value, 99))}
              className="form-control rounded-end-0 rounded-pill bg-transparent text-center text-white border-white w-100 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Hours"
            />
            <input
              type="number"
              value={minutes ?? ''}
              onChange={(e) => setMinutes(clampNumberInput(e.target.value, 59))}
              className="form-control bg-transparent text-center text-white border-white w-100 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Minutes"
            />
            <input
              type="number"
              value={seconds ?? ''}
              onChange={(e) => setSeconds(clampNumberInput(e.target.value, 59))}
              className="form-control rounded-start-0 rounded-pill bg-transparent text-center text-white border-white w-100 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Seconds"
            />
          </div>
          <p className="text-white mt-1 mb-0">Elapsed: {formatDuration(totalSeconds, false)}</p>
        </div>
      </div>

      <div className="row">
        <div className="col-6 p-2">
          {/* Avg HR */}
          <label htmlFor="avgHR" className="form-label text-white">Avg HR</label>
          <div className="w-100 input-group">
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
          <div className="input-group">
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
          {/* Lap Table */}
          <label htmlFor="lap-wrapper" className="form-label text-white">Lap Data</label>
          <div className="lap-wrapper bg-stridex-black border border-stridex-lightgrey rounded-4 overflow-hidden" id="lap-wrapper">
            <div className="lap-scroll overflow-y-auto">
              <table className="table table-sm table-borderless align-middle mb-0 lap-table">
                {/* Table Header */}
                <thead>
                  <tr>
                    <th scope="col" className="ps-2 type-col">
                      Type
                    </th>
                    <th scope="col" className="ps-2 stats-col">
                      Stats
                      <span className="text-danger">*</span>
                    </th>
                    <th scope="col" className="ps-2 hr-col">
                      HR
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
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
                    // Render display Lap Row
                      <LapDisplayRow
                        key={lap.id}
                        lap={lap}
                        idPrefix={`lap-${lap.id}`}
                      />
                  )
                ))}

                {/* Render new Input Lap Row */}
                {!lapEditEnabled && (
                  <LapRow
                    key={lapForm.id}
                    lap={lapForm}
                    idPrefix="lap-form"
                    onChange={updateLapForm}
                  />
                )}

                {/* Table Footer */}
                <tfoot>
                  <tr>
                    <td colSpan={3}>
                      <div className="d-flex justify-content-between w-100 gap-2">
                        {/* Save Lap (if lap has a required field filled in) */}
                        <button
                          onClick={saveLapHandler}
                          disabled={!canSaveLap(lapForm)}
                          className="btn btn-sm bg-stridex-grey rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-1 px-2 my-1 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex"
                        >
                          <PlusLg size={16} className="me-1" />
                          Save Lap
                        </button>

                        {/* Edit Laps (if there are saved laps) */}
                        <button
                          onClick={() => setLapEditEnabled(!lapEditEnabled)}
                          disabled={laps.length === 0}
                          className={`btn btn-sm bg-stridex-grey rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-1 px-2 my-1 transition-ui
                            ${lapEditEnabled ? 'bg-stridex-lightgrey' : ''} hover-bg-warning-hover focus-warning`
                          }
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
          <textarea
            id="notes"
            value={notes ?? ''}
            onChange={(e) => setNotes(e.target.value)}
            rows={1}
            className="form-control rounded-4 bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
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
            <span id="cadence-unit" className="input-group-text rounded-start-0 rounded-pill bg-transparent text-white border-white">spm</span>
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
            <span id="power-unit" className="input-group-text rounded-start-0 rounded-pill bg-transparent text-white border-white">W</span>
          </div>
        </div>
      </div>

      {activity != null ? (
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
      ) : (
      <div className="row border-top border-stridex-lightgrey mt-2 pt-2">
        {(saveError !== '' || saveStatus !== '') && (
          <div className="col-12 p-2 pb-0">
            {saveError !== '' && <div className="alert alert-danger py-2 mb-0">{saveError}</div>}
            {saveStatus !== '' && <div className="alert alert-success py-2 mb-0">{saveStatus}</div>}
          </div>
        )}
        <p className="col-12 px-2 mb-0 text-stridex-lightgrey small">
          New activity on {(date ?? new Date()).toLocaleDateString()}
        </p>
        <div className="col-6 p-2">
          {/* Clear Button */}
          <button
            onClick={clearForm}
            disabled={saving}
            className="btn btn-outline-light rounded-pill d-inline-flex align-items-center justify-content-center text-white w-100 p-2 px-4 my-1 transition-ui hover-bg-stridex-lightgrey-hover focus-danger"
          >
            <Eraser size={16} className="me-2" />
            Clear
          </button>
        </div>

        <div className="col-6 p-2">
          {/* Submit Button */}
          <button
            onClick={createActivityHandler}
            disabled={!canCreate || saving}
            className="btn btn-outline-light rounded-pill d-inline-flex align-items-center justify-content-center text-white w-100 p-2 px-4 my-1 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
          >
            <Floppy size={16} className="me-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      )}
    </>
  );
}

export default ActivitySidebar;
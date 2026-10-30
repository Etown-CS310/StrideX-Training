import { useEffect, useState } from 'react';
import { PlusLg, PencilSquare, Eraser, Floppy } from 'react-bootstrap-icons';

import LapRow from '../ui/LapRow';
import LapDisplayRow from './LapDisplayRow';

import { createEmptyLap, type Lap } from '../../types/lap';
import { formatDuration } from '../../scripts/time';
import { clampNumberInput } from '../../scripts/input';
import './ActivitySidebar.css';

function ActivitySidebar() {
  const [title, setTitle] = useState<string | null>(null);
  const [type, setType] = useState<string>('Default');

  const [distance, setDistance] = useState<number | null>(null);
  const [distanceUnit, setDistanceUnit] = useState<string>('mi');
  const [hours, setHours] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);

  // Calculate total seconds and pace based on distance and duration
  const totalSeconds = (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
  const pace = (totalSeconds > 0 && distance !== null && distance > 0) ?
    totalSeconds / (distanceUnit === 'mi' ? distance : distance * 0.621371) :
    0;

  const [avgHR, setAvgHR] = useState<number | null>(null);
  const [maxHR, setMaxHR] = useState<number | null>(null);

  const [laps, setLaps] = useState<Lap[]>([]);
  const [lapForm, setLapForm] = useState<Lap>(createEmptyLap());

  const [notes, setNotes] = useState<string | null>(null);

  const [elevation, setElevation] = useState<number | null>(null);
  const [calories, setCalories] = useState<number | null>(null);

  const [cadence, setCadence] = useState<number | null>(null);
  const [power, setPower] = useState<number | null>(null);

  const [lapEditEnabled, setLapEditEnabled] = useState<boolean>(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

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
    setType('Default');
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
        <div className="col-6 p-2">
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

        <div className="col-6 p-2">
          {/* Activity Type */}
          <label htmlFor="activity-select" className="form-label text-white">Activity Type</label> 
          <select
            id="activity-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="form-select rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex activity-input"
            aria-label="Activity Type"
          >
            <option value="Default">Default</option>
            <option value="Double">Double</option>
            <option value="Easy">Easy</option>
            <option value="Hill">Hill</option>
            <option value="Interval">Interval</option>
            <option value="Long">Long</option>
            <option value="Race">Race</option>
            <option value="Tempo">Tempo</option>
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
            maxLength={10}
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

      <div className="row border-top border-stridex-lightgrey mt-2 pt-2">
        <div className="col-6 p-2">
          {/* Clear Button */}
          <button
            onClick={clearForm}
            className="btn btn-outline-light rounded-pill d-inline-flex align-items-center justify-content-center text-white w-100 p-2 px-4 my-1 transition-ui hover-bg-stridex-lightgrey-hover focus-danger"
          >
            <Eraser size={16} className="me-2" />
            Clear
          </button>
        </div>

        <div className="col-6 p-2">
          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-outline-light rounded-pill d-inline-flex align-items-center justify-content-center text-white w-100 p-2 px-4 my-1 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
          >
            <Floppy size={16} className="me-2" />
            Save
          </button>
        </div>
      </div>
    </>
  );
}

export default ActivitySidebar;
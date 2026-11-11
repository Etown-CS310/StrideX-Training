import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CloudArrowUp, Eraser, FileEarmarkArrowUp, Floppy, PencilSquare } from 'react-bootstrap-icons';

import { csvToRows, parseCsvFile } from '../../scripts/csvParser';
import { parseFitFile } from '../../scripts/fitParser';
import {
  detectCsvType,
  fromFit,
  fromMultiCsv,
  fromSingleCsv,
  type ActivityData,
  type ActivityUpload,
} from '../../scripts/activityMapper';
import { uploadActivity } from '../../scripts/uploadActivity';
import { clampNumberInput } from '../../scripts/input';
import { formatDuration } from '../../scripts/time';
import { ACTIVITY_TYPES, WORKOUT_TYPES } from '../../scripts/activityTypes';

import './Upload.css';

// Firestore stores meters, the form shows miles/km and feet
const METERS_PER_MILE = 1609.344;
const METERS_PER_KM = 1000;
const METERS_PER_FOOT = 0.3048;

// Shared look for the pill inputs, same as the activity sidebar
const INPUT_CLASS = 'form-control bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex';
const SELECT_CLASS = 'form-select bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex';
const UNIT_CLASS = 'input-group-text rounded-start-0 rounded-pill bg-transparent text-white border-white';
const OUTLINE_BUTTON_CLASS = 'btn btn-outline-light rounded-pill d-inline-flex align-items-center justify-content-center text-white w-100 p-2 px-4 transition-ui hover-bg-stridex-lightgrey-hover';
const GREEN_BUTTON_CLASS = 'btn bg-stridex-green text-stridex-black rounded-pill d-inline-flex align-items-center justify-content-center w-100 p-2 px-4 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex';

type Mode = 'file' | 'manual';

/**
 * Gets the error message out of a caught value.
 */
function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

/**
 * Formats meters as miles for the preview table.
 */
function formatMiles(meters: number | null): string {
  if (meters == null) {
    return '--';
  }
  return (meters / METERS_PER_MILE).toFixed(2) + ' mi';
}

/**
 * Formats a date and time for the datetime-local input, e.g. "2026-11-06T07:30".
 */
function toDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

function Upload() {
  // /upload?mode=manual opens straight to the manual form (the + button on the calendar)
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'manual' ? 'manual' : 'file');

  const tabClass = (tab: Mode) =>
    'btn rounded-pill flex-fill d-inline-flex align-items-center justify-content-center border-0 transition-ui focus-stridex ' +
    (mode === tab ? 'bg-stridex-green text-stridex-black' : 'text-white hover-bg-stridex-grey-hover');

  return (
    <main className="upload d-flex flex-grow-1 align-items-start bg-stridex-grey">
      <div className="container py-3 text-white">
        <h1 className="text-center mb-4">Upload Activity</h1>

        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-8">
            {/* File / Manual toggle */}
            <div className="d-flex bg-stridex-black border border-stridex-lightgrey rounded-pill p-1 mb-3" role="tablist">
              <button role="tab" aria-selected={mode === 'file'} onClick={() => setMode('file')} className={tabClass('file')}>
                <FileEarmarkArrowUp size={16} className="me-2" />
                File Upload
              </button>
              <button role="tab" aria-selected={mode === 'manual'} onClick={() => setMode('manual')} className={tabClass('manual')}>
                <PencilSquare size={16} className="me-2" />
                Manual Entry
              </button>
            </div>

            <div className="bg-stridex-black border border-stridex-lightgrey rounded-4 p-3 p-md-4">
              {mode === 'file' ? <FileUpload /> : <ManualEntry />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Success message with a link back to the calendar.
 */
function SavedAlert({ message }: { message: string }) {
  return (
    <div className="alert alert-success py-2 d-flex justify-content-between align-items-center">
      {message}
      <Link to="/training" className="alert-link">View in calendar</Link>
    </div>
  );
}

/**
 * Pick a Garmin .csv or .fit file, preview the activities found in it, then save them.
 */
function FileUpload() {
  const [fileName, setFileName] = useState('');
  const [uploads, setUploads] = useState<ActivityUpload[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function readFile(file: File) {
    setFileName(file.name);
    setUploads([]);
    setError('');
    setStatus('');

    const lowerName = file.name.toLowerCase();
    try {
      if (lowerName.endsWith('.csv')) {
        // Two kinds of Garmin CSV: one activity with laps, or many activities
        const rows = csvToRows(await parseCsvFile(file));
        if (detectCsvType(rows[0]) === 'single') {
          setUploads([fromSingleCsv(rows, file.name)]);
        } else {
          setUploads(fromMultiCsv(rows));
        }
      } else if (lowerName.endsWith('.fit')) {
        setUploads([fromFit(await parseFitFile(file), file.name)]);
      } else {
        setError('Unsupported file type, choose a .csv or .fit file');
      }
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong while reading the file'));
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      readFile(file);
    }
    // Lets the same file be picked again
    event.target.value = '';
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  }

  async function handleUpload() {
    setUploading(true);
    setError('');
    setStatus('');

    let count = 0;
    try {
      for (const upload of uploads) {
        await uploadActivity(upload);
        count++;
      }
      setStatus('Saved ' + count + (count === 1 ? ' activity' : ' activities'));
      setUploads([]);
      setFileName('');
    } catch (err) {
      setError('Upload failed after ' + count + ' activities: ' + errorMessage(err, 'unknown error'));
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setUploads([]);
    setFileName('');
    setError('');
    setStatus('');
  }

  return (
    <>
      <label
        className={'dropzone d-flex flex-column align-items-center justify-content-center text-center rounded-4 p-4 mb-3 transition-ui' +
          (dragging ? ' dropzone-active' : '')}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <CloudArrowUp size={40} className="text-stridex-green mb-2" />
        <span className="fw-bold">{fileName !== '' ? fileName : 'Drop a file here or click to browse'}</span>
        <span className="text-stridex-lightgrey small">Garmin .fit or .csv exports</span>
        <input
          type="file"
          accept=".csv,.fit"
          onChange={handleChange}
          className="visually-hidden"
          aria-label="Activity File Upload"
        />
      </label>

      {error !== '' && <div className="alert alert-danger py-2">{error}</div>}
      {status !== '' && <SavedAlert message={status} />}

      {uploads.length > 0 && (
        <>
          <p className="text-stridex-lightgrey mb-2">
            {uploads.length === 1 ? '1 activity found' : uploads.length + ' activities found'}
          </p>
          <div className="preview-scroll border border-stridex-lightgrey rounded-4 overflow-auto mb-3">
            <table className="table table-sm table-borderless align-middle mb-0 preview-table">
              <thead>
                <tr>
                  <th scope="col" className="ps-3">Title</th>
                  <th scope="col">Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">Distance</th>
                  <th scope="col">Time</th>
                  <th scope="col" className="pe-3">Laps</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload, i) => (
                  <tr key={i}>
                    <td className="ps-3">{upload.activity.title}</td>
                    <td>{upload.activity.startTime?.toLocaleDateString() ?? '--'}</td>
                    <td className="text-capitalize">{upload.activity.type}</td>
                    <td>{formatMiles(upload.activity.distance)}</td>
                    <td>{upload.activity.duration != null ? formatDuration(upload.activity.duration, false) : '--'}</td>
                    <td className="pe-3">{upload.laps.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <button onClick={clear} disabled={uploading} className={OUTLINE_BUTTON_CLASS + ' focus-danger'}>
                <Eraser size={16} className="me-2" />
                Clear
              </button>
            </div>
            <div className="col-6">
              <button onClick={handleUpload} disabled={uploading} className={GREEN_BUTTON_CLASS}>
                <Floppy size={16} className="me-2" />
                {uploading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Form for typing in an activity by hand.
 */
function ManualEntry() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('run');
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(() => toDateTimeInput(new Date()));

  const [distance, setDistance] = useState<number | null>(null);
  const [distanceUnit, setDistanceUnit] = useState('mi');
  const [hours, setHours] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);

  const [avgHR, setAvgHR] = useState<number | null>(null);
  const [maxHR, setMaxHR] = useState<number | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [calories, setCalories] = useState<number | null>(null);
  const [cadence, setCadence] = useState<number | null>(null);
  const [power, setPower] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const totalSeconds = (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
  const distanceInMiles = distance == null ? 0 : (distanceUnit === 'mi' ? distance : distance * 0.621371);
  const pace = totalSeconds > 0 && distanceInMiles > 0 ? totalSeconds / distanceInMiles : 0;

  const canSave = title.trim() !== '' && startTime !== '' && (totalSeconds > 0 || (distance ?? 0) > 0);

  function clear() {
    setTitle('');
    setType('run');
    setWorkoutType(null);
    setStartTime(toDateTimeInput(new Date()));
    setDistance(null);
    setDistanceUnit('mi');
    setHours(null);
    setMinutes(null);
    setSeconds(null);
    setAvgHR(null);
    setMaxHR(null);
    setElevation(null);
    setCalories(null);
    setCadence(null);
    setPower(null);
    setNotes('');
    setError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      return;
    }

    const metersPerUnit = distanceUnit === 'km' ? METERS_PER_KM : METERS_PER_MILE;
    const durationEmpty = hours == null && minutes == null && seconds == null;

    const activity: ActivityData = {
      type: type,
      workoutType: workoutType,
      title: title.trim(),
      startTime: new Date(startTime),
      distance: distance == null ? null : Math.round(distance * metersPerUnit),
      duration: durationEmpty ? null : totalSeconds,
      hrAvg: avgHR,
      hrMax: maxHR,
      elevation: elevation == null ? null : Math.round(elevation * METERS_PER_FOOT),
      calories: calories,
      cadence: cadence,
      power: power,
    };

    setSaving(true);
    setError('');
    setStatus('');
    try {
      await uploadActivity({ activity: activity, laps: [], notes: notes.trim() });
      clear();
      setStatus('Saved "' + activity.title + '"');
    } catch (err) {
      setError('Could not save activity: ' + errorMessage(err, 'unknown error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {status !== '' && <SavedAlert message={status} />}

      <div className="row">
        <div className="col-12 p-2">
          <label htmlFor="manual-title" className="form-label">
            Activity Title<span className="text-danger">*</span>
          </label>
          <input
            id="manual-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Morning Run"
            className={INPUT_CLASS + ' rounded-pill'}
          />
        </div>

        <div className="col-6 col-md-4 p-2">
          <label htmlFor="manual-type" className="form-label">Activity</label>
          <select
            id="manual-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={SELECT_CLASS + ' rounded-pill'}
          >
            {ACTIVITY_TYPES.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-4 p-2">
          <label htmlFor="manual-workout-type" className="form-label">Activity Type</label>
          <select
            id="manual-workout-type"
            value={workoutType ?? 'Default'}
            onChange={(e) => setWorkoutType(e.target.value === 'Default' ? null : e.target.value)}
            className={SELECT_CLASS + ' rounded-pill'}
          >
            <option value="Default">Default</option>
            {WORKOUT_TYPES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-4 p-2">
          <label htmlFor="manual-date" className="form-label">
            Date<span className="text-danger">*</span>
          </label>
          <input
            id="manual-date"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={INPUT_CLASS + ' rounded-pill'}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-md-6 p-2">
          <label htmlFor="manual-distance" className="form-label">Distance</label>
          <div className="input-group">
            <input
              id="manual-distance"
              type="number"
              step="any"
              value={distance ?? ''}
              onChange={(e) => setDistance(clampNumberInput(e.target.value))}
              className={INPUT_CLASS + ' rounded-end-0 rounded-pill w-50'}
            />
            <select
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value)}
              className={SELECT_CLASS + ' rounded-start-0 rounded-pill w-50'}
              aria-label="Distance Unit"
            >
              <option value="mi">mi</option>
              <option value="km">km</option>
            </select>
          </div>
          <p className="text-stridex-lightgrey small mt-1 mb-0">Pace: {formatDuration(pace, false)} /mi</p>
        </div>

        <div className="col-12 col-md-6 p-2">
          <label htmlFor="manual-hours" className="form-label">Duration (h:mm:ss)</label>
          <div className="duration-inputs input-group">
            <input
              id="manual-hours"
              type="number"
              value={hours ?? ''}
              onChange={(e) => setHours(clampNumberInput(e.target.value, 99))}
              placeholder="h"
              className={INPUT_CLASS + ' rounded-end-0 rounded-pill text-center'}
              aria-label="Hours"
            />
            <input
              type="number"
              value={minutes ?? ''}
              onChange={(e) => setMinutes(clampNumberInput(e.target.value, 59))}
              placeholder="mm"
              className={INPUT_CLASS + ' text-center'}
              aria-label="Minutes"
            />
            <input
              type="number"
              value={seconds ?? ''}
              onChange={(e) => setSeconds(clampNumberInput(e.target.value, 59))}
              placeholder="ss"
              className={INPUT_CLASS + ' rounded-start-0 rounded-pill text-center'}
              aria-label="Seconds"
            />
          </div>
          <p className="text-stridex-lightgrey small mt-1 mb-0">Elapsed: {formatDuration(totalSeconds, false)}</p>
        </div>
      </div>

      <div className="row">
        <NumberField id="manual-avg-hr" label="Avg HR" unit="bpm" value={avgHR} onChange={setAvgHR} />
        <NumberField id="manual-max-hr" label="Max HR" unit="bpm" value={maxHR} onChange={setMaxHR} />
        <NumberField id="manual-elevation" label="Elevation" unit="ft" value={elevation} onChange={setElevation} />
        <NumberField id="manual-calories" label="Calories" unit="Cal" value={calories} onChange={setCalories} />
        <NumberField id="manual-cadence" label="Cadence" unit="spm" value={cadence} onChange={setCadence} />
        <NumberField id="manual-power" label="Power" unit="W" value={power} onChange={setPower} />
      </div>

      <div className="row">
        <div className="col-12 p-2">
          <label htmlFor="manual-notes" className="form-label">Notes</label>
          <textarea
            id="manual-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={INPUT_CLASS + ' rounded-4'}
          />
        </div>
      </div>

      {error !== '' && <div className="alert alert-danger py-2 mt-2">{error}</div>}

      <div className="row border-top border-stridex-lightgrey mt-2 pt-2">
        <div className="col-6 p-2">
          <button type="button" onClick={clear} disabled={saving} className={OUTLINE_BUTTON_CLASS + ' focus-danger'}>
            <Eraser size={16} className="me-2" />
            Clear
          </button>
        </div>
        <div className="col-6 p-2">
          <button type="submit" disabled={!canSave || saving} className={GREEN_BUTTON_CLASS}>
            <Floppy size={16} className="me-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <p className="text-stridex-lightgrey small mb-0">
        <span className="text-danger">*</span> Required, plus a distance or a duration.
      </p>
    </form>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  unit: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

/**
 * A number input with a unit label on the right.
 */
function NumberField({ id, label, unit, value, onChange }: NumberFieldProps) {
  return (
    <div className="col-6 col-md-4 p-2">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="input-group">
        <input
          id={id}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(clampNumberInput(e.target.value))}
          className={INPUT_CLASS + ' rounded-end-0 rounded-pill'}
          aria-describedby={id + '-unit'}
        />
        <span id={id + '-unit'} className={UNIT_CLASS}>{unit}</span>
      </div>
    </div>
  );
}

export default Upload;

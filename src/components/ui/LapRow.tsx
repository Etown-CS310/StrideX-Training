import { useState } from 'react';
import { TrashFill } from 'react-bootstrap-icons';

import type { Lap } from '../../types/lap';
import { fromSeconds, toSeconds } from '../../scripts/time';
import { clampNumberInput } from '../../scripts/input';

import './LapRow.css';

/**
 * Handles the change of a number input, ensuring it's a valid number within the specified range.
 * @param raw - The raw string value from the input.
 * @param max - The maximum allowed value.
 * @returns The validated number or null if the input is empty.
 */
function LapRows({ lap, idPrefix, onChange, onDelete }: { lap: Lap; idPrefix: string; onChange?: <K extends keyof Lap>(field: K, value: Lap[K]) => void; onDelete?: () => void }) {
  const hasDuration = (lap.duration ?? 0) > 0;
  const durationArr = fromSeconds(lap.duration ?? 0);

  const [hours, setHours] = useState<number | null>(hasDuration ? durationArr.hours : null);
  const [minutes, setMinutes] = useState<number | null>(hasDuration ? durationArr.minutes : null);
  const [seconds, setSeconds] = useState<number | null>(hasDuration ? durationArr.seconds : null);
  const [centiseconds, setCentiseconds] = useState<number | null>(hasDuration ? durationArr.centiseconds : null);
  
  // Helper function to update the Lap object when a field changes
  const set = <K extends keyof Lap>(field: K, value: Lap[K]) => onChange?.(field, value);

  /**
   * Updates the time fields (hours, minutes, seconds, centiseconds) and recalculates the total duration in seconds.
   * @param part - The part of the time to update ('hours', 'minutes', 'seconds', or 'centiseconds').
   * @param value - The new value for the specified part of the time.
   */
  const updateTime = (part: 'hours' | 'minutes' | 'seconds' | 'centiseconds', value: number | null) => {
    const next = { hours, minutes, seconds, centiseconds, [part]: value };

    if (part === 'hours') setHours(value);
    if (part === 'minutes') setMinutes(value);
    if (part === 'seconds') setSeconds(value);
    if (part === 'centiseconds') setCentiseconds(value);

    set('duration', toSeconds(next.hours, next.minutes, next.seconds, next.centiseconds));
  };

  return (
    <tbody className="row-enter border-top border-stridex-lightgrey">
      <tr>
        <td>
          {/* Lap Type */}
          <select
            id={`lap-type-${idPrefix}`}
            value={lap.type}
            onChange={(e) => set('type', e.target.value)}
            className="form-select form-select-sm rounded-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
            aria-label="Activity Type"
          >
            <option value="Default">Default</option>
            <option value="Interval">Interval</option>
            <option value="Recovery">Recovery</option>
            <option value="Rest">Rest</option>
          </select>
        </td>

        <td className="pt-2">
          {/* Lap Distance */}
          <div className="input-group input-group-sm">
            <input
              id={`lap-distance-${idPrefix}`}
              type="number"
              value={lap.distance ?? ''}
              onChange={(e) => set('distance', clampNumberInput(e.target.value))}
              placeholder="0.0"
              className="form-control rounded-end-0 rounded-pill w-50 bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Lap Distance"
            />
            <select
              id={`lap-distance-unit-${idPrefix}`}
              value={lap.distanceUnit}
              onChange={(e) => set('distanceUnit', e.target.value as Lap['distanceUnit'])}
              className="form-select form-select-sm rounded-start-0 rounded-pill w-50 bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Distance Unit"
            >
              <option value="mi">mi</option>
              <option value="km">km</option>
            </select>
          </div>

          {/* Lap Time (in h:mm:ss.cc format) */}
          <div className="input-group input-group-sm flex-nowrap mt-1">
            <input
              id={`lap-hours-${idPrefix}`}
              type="number"
              value={hours ? (hours > 0 ? hours : '') : ''}
              onChange={(e) => updateTime('hours', clampNumberInput(e.target.value, 99))}
              placeholder="h"
              className="form-control rounded-start-pill text-center bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Hours"
            />
            <span className="input-group-text bg-stridex-grey text-white border-0 px-0" aria-hidden="true">:</span>
            <input
              id={`lap-minutes-${idPrefix}`}
              type="number"
              value={minutes ? (minutes > 0 ? minutes : '') : ''}
              onChange={(e) => updateTime('minutes', clampNumberInput(e.target.value, 59))}
              placeholder="mm"
              className="form-control text-center bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Minutes"
            />
            <span className="input-group-text bg-stridex-grey text-white border-0 px-0" aria-hidden="true">:</span>
            <input
              id={`lap-seconds-${idPrefix}`}
              type="number"
              value={seconds ? (seconds > 0 ? seconds : '') : ''}
              onChange={(e) => updateTime('seconds', clampNumberInput(e.target.value, 59))}
              placeholder="ss"
              className="form-control text-center bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Seconds"
            />
            <span className="input-group-text bg-stridex-grey text-white border-0 px-0" aria-hidden="true">.</span>
            <input
              id={`lap-centiseconds-${idPrefix}`}
              type="number"
              value={centiseconds ? (centiseconds > 0 ? centiseconds : '') : ''}
              onChange={(e) => updateTime('centiseconds', clampNumberInput(e.target.value, 99))}
              placeholder="cc"
              className="form-control rounded-end-pill text-center bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Centiseconds"
            />
          </div>
        </td>

        <td className="pt-2">
          {/* Lap Average Heart Rate */}
          <div className="input-group input-group-sm">
            <input
              id={`lap-avgHR-${idPrefix}`}
              type="number"
              value={lap.avgHR ?? ''}
              onChange={(e) => set('avgHR', clampNumberInput(e.target.value))}
              placeholder="Avg"
              className="form-control rounded-end-0 rounded-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Average Heart Rate"
              aria-describedby={`lap-avgHR-unit-${idPrefix}`}
            />
            <span id={`lap-avgHR-unit-${idPrefix}`} className="input-group-text rounded-start-0 rounded-pill bg-stridex-grey text-white border-0">bpm</span>
          </div>

          {/* Lap Maximum Heart Rate */}
          <div className="input-group input-group-sm mt-1">
            <input
              id={`lap-maxHR-${idPrefix}`}
              type="number"
              value={lap.maxHR ?? ''}
              onChange={(e) => set('maxHR', clampNumberInput(e.target.value))}
              placeholder="Max"
              className="form-control rounded-end-0 rounded-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Maximum Heart Rate"
              aria-describedby={`lap-maxHR-unit-${idPrefix}`}
            />
            <span id={`lap-maxHR-unit-${idPrefix}`} className="input-group-text rounded-start-0 rounded-pill bg-stridex-grey text-white border-0">bpm</span>
          </div>
        </td>
      </tr>

      <tr>
        <td colSpan={3} className="pb-2">
          {/* Lap Notes and Delete Button */}
          <div className="d-flex align-items-center gap-1">
            <textarea
              id={`lap-notes-${idPrefix}`}
              value={lap.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Lap Notes"
              rows={1}
              maxLength={10}
              className="form-control form-control-sm rounded-4 bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Lap Notes"
            />

            {(onDelete != null) && (
              <button
                onClick={onDelete}
                className="btn btn-sm bg-stridex-grey rounded-pill d-inline-flex align-items-center justify-content-center text-white p-1 px-2 transition-ui hover-bg-danger-hover focus-danger"
                aria-label="Delete Lap">
              <TrashFill size={16} />
            </button>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}

export default LapRows;
import type { Lap } from '../../types/lap';
import { formatDuration } from '../../scripts/time';

/**
 * Renders a read-only display of a lap's details.
 * @param lap - The Lap object containing the lap's details.
 * @param idPrefix - A unique prefix for the HTML element IDs to avoid collisions.
 */
function LapDisplayRows({ lap, idPrefix }: { lap: Lap; idPrefix: string }) {
  return (
    <tbody className="row-enter border-top border-stridex-lightgrey">
      <tr>
        <td className="px-2">
          {/* Display Lap Type */}
          <p id={`lap-type-${idPrefix}-display`} className="text-stridex-lightgrey m-0" aria-label="Activity Type">
            {lap.type}
          </p>
        </td>

        <td className="px-2">
          {/* Display Lap Distance */}
          {lap.distance !== null && (
            <div className="flex-nowrap">
              <p id={`lap-distance-${idPrefix}-display`} className="text-stridex-lightgrey m-0" aria-label="Lap Distance">
                {lap.distance ?? ''} {lap.distanceUnit}
              </p>
            </div>
          )}

          {/* Display Lap Duration */}
          {lap.duration !== null && (
            <div className="flex-nowrap mt-1">
              <p id={`lap-time-${idPrefix}-display`} className="text-stridex-lightgrey m-0" aria-label="Lap Time">
                {formatDuration(lap.duration)}
              </p>
            </div>
          )}
        </td>

        <td className="px-2">
          {/* Display Lap Average Heart Rate */}
          {lap.avgHR !== null && (
            <div className="flex-nowrap">
              <p id={`lap-avgHR-${idPrefix}-display`} className="text-stridex-lightgrey m-0" aria-label="Average Heart Rate">
                {lap.avgHR ?? ''} bpm
              </p>
            </div>
          )}

          {/* Display Lap Maximum Heart Rate */}
          {lap.maxHR !== null && (
            <div className="flex-nowrap mt-1">
              <p id={`lap-maxHR-${idPrefix}-display`} className="text-stridex-lightgrey m-0" aria-label="Maximum Heart Rate">
                {lap.maxHR ?? ''} bpm
              </p>
            </div>
          )}
        </td>
      </tr>

      {/* Display Lap Notes */}
      {(lap.notes && lap.notes.trim() !== '') && (
        <tr>
          <td colSpan={3} className="px-1 pb-2">
            <div className="flex-nowrap">
              <p id={`lap-notes-${idPrefix}-display`} className="form-control form-control-sm rounded-4 bg-transparent text-stridex-lightgrey border border-stridex-lightgrey m-0" aria-label="Lap Notes">
                {lap.notes}
              </p>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
}

export default LapDisplayRows;
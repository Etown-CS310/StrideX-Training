import { useState } from 'react';
import Calendar from 'react-calendar';
import { ChevronLeft, ChevronRight, PlusLg, Upload } from 'react-bootstrap-icons'
import type { Value } from 'react-calendar/dist/shared/types.js';

import { parseFitFile } from '../../scripts/fitParser';

import './Training.css';

function Training() {
  const [value, setValue] = useState<Value>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date | null>(new Date());

  function goToPrevMonth() {
    setActiveStartDate((prev) => {
      const base = prev ?? new Date();
      return new Date(base.getFullYear(), base.getMonth() - 1, 1);
    });
  }

  function goToCurMonth() {
    setActiveStartDate(new Date());
  }

  function goToNextMonth() {
    setActiveStartDate((prev) => {
      const base = prev ?? new Date();
      return new Date(base.getFullYear(), base.getMonth() + 1, 1);
    });
  }

  /**
   * Calculates the number of weeks in a given month.
   * @param activeStartDate - The date of the active month.
   * @returns The number of weeks in the month.
   */
  function getWeekRowCount(activeStartDate: Date) {
    const year = activeStartDate.getFullYear();
    const month = activeStartDate.getMonth();

    // Get first day of the month and convert to Mon - Sun format
    const rawFirstDay = new Date(year, month, 1).getDay();
    const firstDay = (rawFirstDay + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Math.ceil((firstDay + daysInMonth) / 7);
  }

  const rowCount = getWeekRowCount(activeStartDate ?? new Date());

  function manualUpload() {
    return;
  }

  function hasActivity(date: Date) {
    return date.getDate() % 2 === 0; // Example: return true for even dates
  }

  /**
   * Handles the file input change event, reads the selected .fit file, and parses it using the parseFitFile function.
   * @param event - The change event from the file input element.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const messages = await parseFitFile(file);
        console.log('Parsed FIT messages:', messages);
      } catch (error) {
        console.error('Error parsing FIT file:', error);
      }
    }
  };

  return (
    <div className="training bg-stridex-grey">
      <div className="container">
        <div className="row py-2">
          <main className="col-8">
            {/* Calendar */}
            <div className="calendar-header d-flex align-items-center justify-content-between mb-2">
              <div className="header-controls d-flex align-items-center gap-1">
                <button
                  className="prev-month btn text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2 transition-bg hover-bg-stridex-lightgrey-hover"
                  onClick={goToPrevMonth}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="cur-month btn btn-outline-stridex-lightgrey text-white rounded-pill d-inline-flex align-items-center justify-content-center p-2 px-3 transition-bg hover-bg-stridex-lightgrey-hover"
                  onClick={goToCurMonth}
                >
                  Today
                </button>
                <button
                  className="next-month btn text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2 transition-bg hover-bg-stridex-lightgrey-hover"
                  onClick={goToNextMonth}
                >
                  <ChevronRight size={20} />
                </button>
                <h2 className="month-year text-white mb-0">
                  {(activeStartDate ?? new Date()).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              
              <div className="upload-container d-flex align-items-center gap-2">
                <button
                  className="upload-circle btn btn-outline-stridex-lightgrey text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2 transition-bg hover-bg-stridex-lightgrey-hover"
                  onClick={manualUpload}
                >
                  <PlusLg size={20} />
                </button>

                <label htmlFor="fit-upload" className="upload-circle btn btn-outline-stridex-lightgrey text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2 transition-bg hover-bg-stridex-lightgrey-hover">
                  <Upload size={20} />
                  <input
                    id="fit-upload"
                    type="file"
                    accept=".fit"
                    onChange={handleFileChange}
                    className="d-none"
                  />
                </label>
              </div>
            </div>
            <div className="calendar-with-totals bg-stridex-black border border-stridex-lightgrey rounded-4">
              <Calendar
                onChange={setValue}
                value={value}
                activeStartDate={activeStartDate ?? undefined}
                onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate)}
                tileClassName="d-flex flex-column align-items-center justify-content-start rounded-0 bg-transparent overflow-x-hidden text-light"
                tileContent={({ date }) => hasActivity(date) && (
                  <>
                    <span className="badge rounded-pill bg-stridex-lightgrey mb-1">Afternoon Run</span>
                    {/* <span className="badge rounded-pill bg-stridex-lightgrey mb-1">Physical Therapy</span> */}
                  </>
                )}
                showNavigation={false}
              />
              {/* Extra calendar column for activity totals */}
              <div className="totals-column">
                <div className="totals-label">SUM</div>
                <div className="week-totals" style={{ '--row-count': rowCount } as React.CSSProperties}>
                  {Array.from({ length: rowCount }).map((_, i) => (
                    <div key={i} className="week-total-cell d-flex align-items-start justify-content-start border-stridex-lightgrey border-top rounded-0 bg-transparent text-light" />
                  ))}
                </div>
              </div>
            </div>
          </main>

          <aside id="sideBar" className="col-4">
            <div className="side" id="firstrow">
            <label>Activity Title 
              <br></br>
              <input id="activity_title" type="text"></input>
            </label>
            </div>

            <div className="side" id="firstrow">
            <label>Activity Type 
              <br></br>
              <select id="activity_select" defaultValue="0">
                <option value="0"> -- Base Activity --</option>
              </select>
            </label>
            </div>

            <div className="side" id="secondrow">
            <label>Distance 
              <br></br>
              <input id="distance" type="number"></input>
              <select id="distanceDrop" defaultValue="0">
                <option value="0">mi</option>
                <option value="1">km</option>
              </select>
              {/* Need some way to track total miles/kilometers already traveled */}
            </label>
            </div>

            <div className="side" id="secondrow">
            <label>Duration
              <br></br>
              <input id="duration" type="number"></input>
              <input id="duration" type="number"></input>
              <input id="duration" type="number"></input>
              {/* Need some way to track total time (System.currentTimeMillis()???) */}
            </label>
            </div>

            <div className="side" id="thirdrow">
            <label>Avg HR
              <br></br>
              <input id="avg_hr" type="number"></input>
              {/* Need some way to add bpm */}
            </label>
            </div>

            <div className="side" id="thirdrow">
            <label>Max HR
              <br></br>
              <input id="max_hr" type="number"></input>
              {/* Need some way to add bpm */}
            </label>
            </div>

            {/* <div className="side">
              <label>Lap Data
                <br></br>
                All of the lap data to work on later
              </label>
            </div> */}

            <div>
              <label>Notes
                <br></br>
                <input id="notes" type="text"></input>
              </label>
            </div>
            
            <div>
              <label>Elevation
                <br></br>
                <input id="elevation" type="number"></input>
                {/* Some way to add feet */}
              </label>
            </div>

            <div>
              <label>Calories
                <br></br>
                <input id="calories" type="number"></input>
                {/* Some way to add Cal */}
              </label>
            </div>

            <div>
              <label>Cadence
                <br></br>
                <input id="cadence" type="number"></input>
                {/* Some way to add feet */}
              </label>
            </div>

            <div>
              <label>Power
                <br></br>
                <input id="power" type="number"></input>
                {/* Some way to add Cal */}
              </label>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

export default Training;
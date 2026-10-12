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
          <main className="col-12 col-lg-8 col-xl-9">
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
                  className="upload-circle btn btn-outline-stridex-lightgrey text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2"
                  onClick={manualUpload}
                >
                  <PlusLg size={20} />
                </button>

                <label htmlFor="fit-upload" className="upload-circle btn btn-outline-stridex-lightgrey text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2">
                  <Upload size={20} />
                  <input
                    id="fit-upload"
                    type="file"
                    accept=".fit"
                    onChange={handleFileChange}
                    className="visually-hidden"
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
                tileClassName="d-flex flex-column align-items-center justify-content-start rounded-0 p-05 gap-05 gap-md-1 bg-transparent overflow-x-hidden text-light"
                tileContent={({ date }) => hasActivity(date) && (
                  <>
                    {/* <span className="badge rounded-pill bg-stridex-lightgrey fw-normal text-truncate w-100 mw-100 p-05 p-md-1">
                      Afternoon Run
                    </span> */}
                  </>
                )}
                showNavigation={false}
              />
              {/* Extra calendar column for activity totals */}
              <div className="totals-column">
                <div className="totals-label d-flex align-items-center justify-content-center text-center text-uppercase text-stridex-darkgreen p-1">SUM</div>
                <div className="week-totals" style={{ '--row-count': rowCount } as React.CSSProperties}>
                  {Array.from({ length: rowCount }).map((_, i) => (
                    <div key={i} className="week-total-cell d-flex align-items-start justify-content-start border-stridex-lightgrey border-top rounded-0 bg-transparent text-light" />
                  ))}
                </div>
              </div>
            </div>
          </main>

          <aside id="sideBar" className="col-12 col-lg-4 col-xl-3">
            
            <div className="row">
              <div className="p-3 col-6">
              <label>Activity Title</label>
              <div>
                <input 
                  id="activity_title" 
                  type="text" 
                  className="w-100 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                ></input>
              </div>
              </div>

              <div className="p-3 col-6">
              <label>Activity Type</label>
                <div className="w-100 input-group">
                <select 
                  id="activity_select" 
                  defaultValue="0" 
                  className="w-100 bg-transparent rounded-pill py-2 px-3 text-stridex-lightgrey border border-1 border-stridex-lightgrey 1h-base align-middle"
                > 
                {/* Figure out why activity type height doesn't match activity title without changing text size */}
                  <option value="0">-- Base Activity --</option>
                </select>
                </div>
              </div>
            </div>

            <div className="row">

              <div className="p-3 col-6">
              <label>Distance</label>
                <div className="distance input-group">
                <input 
                  id="distance" 
                  type="number" 
                  className="w-50 rounded-end-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                ></input>
                <select 
                  id="distanceDrop" 
                  defaultValue="0" 
                  className="w-50 rounded-start-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                >
                  <option value="0">mi</option>
                  <option value="1">km</option>
                </select>
                </div>
              
              </div>
              {/* Need some way to track total miles/kilometers already traveled */}

              {/* <div className="p-3 col-6">
              <label>Max HR</label>
              <div className="w-100 input-group mb-3">
                <input
                  id="max_hr" 
                  type="number" 
                  className="w-75 form-control rounded-end-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                ></input>
                <label 
                  id="max_hr_stay" 
                  className="w-25 input-group-text rounded-start-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                >bpm</label>
              </div>
              </div> */}

              <div className="p-3 col-6">
              <label>Duration</label>
                <div id="duration" className="w-100 input-group">
                  <input 
                    type="number" 
                    className="w-100 form-control rounded-end-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  ></input>
                  <input 
                    type="number" 
                    className="w-100 form-control bg-transparent p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  ></input>
                  <input 
                    type="number" 
                    className="w-100 form-control rounded-start-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  ></input>
                </div>
                {/* Need some way to track total time (System.currentTimeMillis()???) */}
              
              </div>
            </div>

            <div className="row">

              <div className="p-3 col-6">
              <label>Avg HR</label>
              <div className="w-100 input-group mb-3">
                <input 
                  id="avg_hr" 
                  type="number" 
                  className="w-75 form-control rounded-end-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                ></input>
                <label 
                  id="avg_hr_stay" 
                  className="w-25 input-group-text rounded-start-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                >bpm</label>
              </div>
              </div>

              <div className="p-3 col-6">
              <label>Max HR</label>
              <div className="w-100 input-group mb-3">
                <input
                  id="max_hr" 
                  type="number" 
                  className="w-75 form-control rounded-end-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                ></input>
                <label 
                  id="max_hr_stay" 
                  className="w-25 input-group-text rounded-start-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                >bpm</label>
              </div>
              </div>

            </div>

            {/* <div className="side">
              <label>Lap Data
                <br></br>
                All of the lap data to work on later
              </label>
            </div> */}

            <div className="row">
              
              <div className="p-3 col-12">
                <label className="w-100">Notes
                  <input 
                    id="notes" 
                    type="text" 
                    className="w-100 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  ></input>
                </label>
              </div>

            </div>
            
            <div className="row">

              <div className="p-3 col-6">
                <label>Elevation</label>
                <div className="w-100 input-group mb-3">
                  <input 
                    id="elevation" 
                    type="number" 
                    className="w-75 form-control rounded-end-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  ></input>
                  <label 
                    id="elevation_stay" 
                    className="w-25 input-group-text rounded-start-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  >ft</label>
                </div>
              </div>

              <div className="p-3 col-6">
                <label>Calories</label>
                <div className="w-100 input-group mb-3">
                  <input 
                    id="calories" 
                    type="number" 
                    className="w-75 form-control rounded-end-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  ></input>
                  <label 
                    id="calories_stay" 
                    className="w-25 input-group-text rounded-start-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  >Cal</label>
                </div>
              </div>
            </div>

            <div className="row">

              <div className="p-3 col-6">
                <label>Cadence</label>
                <div className="w-100 input-group mb-3">
                  <input 
                    id="cadence" 
                    type="number" 
                    className="w-75 form-control rounded-end-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  ></input>
                  <label 
                    id="cadence_stay" 
                    className="w-25 input-group-text rounded-start-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  >ft</label>
                </div>
              </div>

              <div className="p-3 col-6">
                <label>Power</label>
                <div className="w-100 input-group mb-3">
                  <input 
                    id="power" 
                    type="number" 
                    className="w-75 form-control rounded-end-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  ></input>
                  <label 
                    id="power_stay" 
                    className="w-25 input-group-text rounded-start-0 bg-transparent rounded-pill p-1 px-2 text-stridex-lightgrey border border-1 border-stridex-lightgrey"
                  >Cal</label>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

export default Training;
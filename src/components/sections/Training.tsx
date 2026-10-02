import { useState } from 'react';
import Calendar from 'react-calendar';
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons'
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

  return (
    <div className="training p-3">
      <main>
        {/* Calendar */}
        <div className="calendar-header">
          <div className="header-controls">
            <button className="prev-month" onClick={goToPrevMonth}>
              <ChevronLeft size={20} />
            </button>
            <button className="cur-month" onClick={goToCurMonth}>Today</button>
            <button className="next-month" onClick={goToNextMonth}>
              <ChevronRight size={20} />
            </button>
            <h1 className="month-year">
              {(activeStartDate ?? new Date()).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h1>
          </div>
          
          <div>
            <label htmlFor="fit-upload" className="upload-circle">
              <img src="" alt="" />
            </label>
            <input
              id="fit-upload"
              type="file"
              accept=".fit"
              onChange={handleFileChange}
              className="visually-hidden"
            />
          </div>
        </div>
        <div className="calendar-with-totals">
          <Calendar
            onChange={setValue}
            value={value}
            activeStartDate={activeStartDate ?? undefined}
            onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate)}
          />
          {/* Extra calendar column for activity totals */}
          <div className="totals-column">
            <div className="totals-label">SUM</div>
            <div className="week-totals" style={{ '--row-count': rowCount } as React.CSSProperties}>
              {Array.from({ length: rowCount }).map((_, i) => (
                <div key={i} className="week-total-cell" />
              ))}
            </div>
          </div>
        </div>
      </main>

      <aside id="sideBar" className="ps-5">
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
  );
}

export default Training;
import { useState } from 'react';
import Calendar from 'react-calendar';
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
    <div className="training">
      <main>
        {/* Calendar */}
        <div className="calendar-header">
          <div className="header-controls">
            <button className="prev-month" onClick={goToPrevMonth}>&lt;</button>
            <button className="cur-month" onClick={goToCurMonth}>Today</button>
            <button className="next-month" onClick={goToNextMonth}>&gt;</button>
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

      <aside>
        <h1>Sidebar</h1>
      </aside>
    </div>
  );
}

export default Training;
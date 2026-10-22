import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { ChevronLeft, ChevronRight, PlusLg, Upload } from 'react-bootstrap-icons'
import type { Value } from 'react-calendar/dist/shared/types.js';

import ActivitySidebar from '../ui/ActivitySidebar';
import { parseFitFile } from '../../scripts/fitParser';
import { dateKey, loadActivities, type Activity } from '../../scripts/loadActivities';

import './Training.css';

function Training() {
  const [value, setValue] = useState<Value>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date | null>(new Date());

  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadActivities()
      .then(setActivities)
      .catch((err) => {
        console.error('Error loading activities:', err);
        setLoadError('Could not load activities');
      });
  }, []);

  const activitiesByDay = new Map<string, Activity[]>();
  for (const activity of activities) {
    if (activity.startTime == null) {
      continue;
    }
    const key = dateKey(activity.startTime);
    const dayActivities = activitiesByDay.get(key) ?? [];
    dayActivities.push(activity);
    activitiesByDay.set(key, dayActivities);
  }

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
    <div className="training bg-stridex-grey flex-grow-1">
      <div className="container">
        <div className="row py-2">
          <main className="col-12 col-lg-8 col-xxl-9">
            {/* Calendar */}
            <div className="calendar-header d-flex align-items-center justify-content-between mb-2">
              <div className="header-controls d-flex align-items-center gap-1">

                {/* Prev Month */}
                <button
                  onClick={goToPrevMonth}
                  className="prev-month btn text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Current Month */}
                <button
                  onClick={goToCurMonth}
                  className="cur-month btn btn-outline-light text-white rounded-pill d-inline-flex align-items-center justify-content-center p-2 px-3 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                >
                  Today
                </button>

                {/* Next Month */}
                <button
                  onClick={goToNextMonth}
                  className="next-month btn text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                  aria-label="Next Month"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Month and Year */}
                <h2 className="month-year text-white mb-0">
                  {(activeStartDate ?? new Date()).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              
              <div className="upload-container d-flex align-items-center gap-2">
                {/* Manual Upload */}
                <button
                  onClick={manualUpload}
                  className="upload-circle btn btn-outline-light text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                  aria-label="Manual Upload"
                >
                  <PlusLg size={20} />
                </button>

                {/* File Upload */}
                <label className="upload-circle btn btn-outline-light text-white rounded-circle d-inline-flex align-items-center justify-content-center p-2 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex">
                  <Upload size={20} />
                  <input
                    type="file"
                    accept=".fit, .csv"
                    onChange={handleFileChange}
                    className="visually-hidden"
                    aria-label="Activity File Upload"
                  />
                </label>
              </div>
            </div>
            {loadError !== '' && (
              <div className="alert alert-danger py-2">{loadError}</div>
            )}
            <div className="calendar-with-totals bg-stridex-black border border-stridex-lightgrey rounded-4">
              <Calendar
                onChange={setValue}
                value={value}
                activeStartDate={activeStartDate ?? undefined}
                onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate)}
                tileClassName="d-flex flex-column align-items-center justify-content-start rounded-0 p-05 gap-05 gap-md-1 bg-transparent overflow-x-hidden text-light"
                tileContent={({ date, view }) => view === 'month' && (
                  <>
                    {(activitiesByDay.get(dateKey(date)) ?? []).map((activity) => (
                      <span
                        key={activity.id}
                        role="button"
                        className={'badge rounded-pill fw-normal text-truncate w-100 mw-100 p-05 p-md-1 ' +
                          (activity.id === selectedId ? 'bg-stridex-green text-stridex-black' : 'bg-stridex-grey')}
                        title={activity.title}
                        onClick={() => setSelectedId(activity.id)}
                      >
                        {activity.title}
                      </span>
                    ))}
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

          <aside id="sideBar" className="col-12 col-lg-4 col-xxl-3 ps-lg-3 ps-xxl-4">
            <ActivitySidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Training;
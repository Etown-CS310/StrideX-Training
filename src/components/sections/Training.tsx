import { useState } from 'react';
import Calendar from 'react-calendar';

import { parseFitFile } from '../../scripts/fitParser';

import 'react-calendar/dist/Calendar.css';
import './Training.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece]

function Training() {
  // <input type="file" accept=".fit" onChange={handleFileChange} />
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

  const [value, setValue] = useState<Value>(new Date());

  return (
    <div className="training">
      <main className="mb-3">
        <Calendar onChange={setValue} value={value} />
      </main>
      <aside id="sideBar">
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
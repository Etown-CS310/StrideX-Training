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
      <main>
        <Calendar onChange={setValue} value={value} />
      </main>
      <aside>
        <h1>Sidebar</h1>
      </aside>
    </div>
  );
}

export default Training;
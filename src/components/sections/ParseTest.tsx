import { useState } from 'react';

import { parseCsvFile } from '../../scripts/csvParser';
import { parseFitFile } from '../../scripts/fitParser';

/**
 * Helper for JSON.stringify. JSON can't store BigInt numbers (some FIT fields
 * use them), so this turns them into strings. Other values left alone.
 */
function bigIntToString(_key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

/**
 * Dev-only page for uploading a CSV or FIT file and viewing the parser output.
 */
function ParseTest() {
  // Text shown in the output/error box
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  // Runs every time the user picks a file
  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files === null || files.length === 0) {
      return;
    }
    const file = files[0];

    // Clear anything left over from the last file
    setOutput('');
    setError('');

    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.csv')) {
        // The CSV parser gives back plain text, so show it as-is
        const csvText = await parseCsvFile(file);
        setOutput(csvText);
      } else if (fileName.endsWith('.fit')) {
        // The FIT parser gives back an object, so turn it into readable JSON text
        const fitData = await parseFitFile(file);
        const fitText = JSON.stringify(fitData, bigIntToString, 2);
        setOutput(fitText);
      } else {
        setError('Unsupported file type, upload a .csv or .fit file');
      }
    } catch (err) {
      // The parsers throw an Error when a file is bad, so show its message
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong while parsing the file');
      }
    }
  }

  return (
    <div className="container py-4">
      <h1>Parse Test</h1>

      <input
        type="file"
        accept=".csv,.fit"
        className="form-control mb-3"
        onChange={handleFile}
      />

      {error !== '' && (
        <div className="alert alert-danger">{error}</div>
      )}

      {output !== '' && (
        <pre className="border p-2" style={{ maxHeight: '70vh', overflow: 'auto' }}>
          {output}
        </pre>
      )}
    </div>
  );
}

export default ParseTest;

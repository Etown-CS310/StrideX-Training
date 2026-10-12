import { useState } from 'react';

import { csvToRows, parseCsvFile } from '../../scripts/csvParser';
import { parseFitFile } from '../../scripts/fitParser';
import {
  detectCsvType,
  fromFit,
  fromMultiCsv,
  fromSingleCsv,
  type ActivityUpload,
} from '../../scripts/activityMapper';
import { uploadActivity } from '../../scripts/uploadActivity';

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
 * Dev-only page for uploading a CSV or FIT file, viewing the parser output,
 * and sending the converted data to Firestore.
 */
function ParseTest() {
  // Text shown in the output/error box
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  // Activities ready to upload, and the result of the last upload
  const [uploads, setUploads] = useState<ActivityUpload[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);

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
    setUploads([]);
    setUploadStatus('');

    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.csv')) {
        const csvText = await parseCsvFile(file);
        setOutput(csvText);

        // Two kinds of Garmin CSV: one activity with laps, or many activities
        const rows = csvToRows(csvText);
        const csvType = detectCsvType(rows[0]);
        if (csvType === 'single') {
          setUploads([fromSingleCsv(rows, file.name)]);
        } else {
          setUploads(fromMultiCsv(rows));
        }
      } else if (fileName.endsWith('.fit')) {
        const fitData = await parseFitFile(file);
        const fitText = JSON.stringify(fitData, bigIntToString, 2);
        setOutput(fitText);
        setUploads([fromFit(fitData, file.name)]);
      } else {
        setError('Unsupported file type, upload a .csv or .fit file');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong while parsing the file');
      }
    }
  }

  // Sends every activity in the preview to Firestore
  async function handleUpload() {
    setUploading(true);
    setUploadStatus('');
    setError('');

    let count = 0;
    try {
      for (const upload of uploads) {
        await uploadActivity(upload);
        count++;
      }
      setUploadStatus('Uploaded ' + count + ' activities');
    } catch (err) {
      if (err instanceof Error) {
        setError('Upload failed after ' + count + ' activities: ' + err.message);
      } else {
        setError('Upload failed after ' + count + ' activities');
      }
    }

    setUploading(false);
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

      {uploadStatus !== '' && (
        <div className="alert alert-success">{uploadStatus}</div>
      )}

      {uploads.length > 0 && (
        <div className="mb-3">
          <h2>Firestore preview ({uploads.length} activities)</h2>
          <button className="btn btn-primary mb-2" onClick={handleUpload} disabled={uploading}>
            Upload to Firestore
          </button>
          <pre className="border p-2" style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {JSON.stringify(uploads, null, 2)}
          </pre>
        </div>
      )}

      {output !== '' && (
        <div>
          <h2>Raw parser output</h2>
          <pre className="border p-2" style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ParseTest;

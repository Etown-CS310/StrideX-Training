import { parseFitFile } from './scripts/fitParser';

function App() {
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
    <>
      <div id="center">
        <h1>StrideX Training</h1>
        <input type="file" accept=".fit" onChange={handleFileChange} />
      </div>
    </>
  );
}

export default App

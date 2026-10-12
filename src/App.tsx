import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from './components/sections/Header';
import Home from './components/sections/Home';
import Training from './components/sections/Training';
import Groups from './components/sections/Groups';
import ParseTest from './components/sections/ParseTest';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/training" element={<Training />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/parse-test" element={<ParseTest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
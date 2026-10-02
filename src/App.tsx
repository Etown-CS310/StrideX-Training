import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from './components/sections/Header';
import Home from './components/sections/Home';
import Training from './components/sections/Training';
import Groups from './components/sections/Groups';

function App() {

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/training" element={<Training />} />
        <Route path="/groups" element={<Groups />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App

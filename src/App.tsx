import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from './components/sections/Header';
import Home from './components/sections/Home';
import Training from './components/sections/Training';
import Teams from './components/sections/Teams';
import Upload from './components/sections/Upload';
import Coaching from './components/sections/Coaching';
import Auth from './components/sections/Auth';
import CreateTeam from './components/sections/CreateTeam';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/training" element={<Training />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/coaching" element={<Coaching />} />
        <Route path="/login" element={<Auth key="login" mode="login" />} />
        <Route path="/register" element={<Auth key="register" mode="register" />} />
        <Route path="/createteam" element={<CreateTeam />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

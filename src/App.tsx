import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from './components/sections/Header';
import Home from './components/sections/Home';
import Training from './components/sections/Training';
import Groups from './components/sections/Groups';
import Upload from './components/sections/Upload';
import Coaching from './components/sections/Coaching';
import Auth from './components/sections/Auth';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/training" element={<Training />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/coaching" element={<Coaching />} />
        <Route path="/login" element={<Auth key="login" mode="login" />} />
        <Route path="/register" element={<Auth key="register" mode="register" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

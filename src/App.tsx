import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from './components/sections/Header';
import Home from './components/sections/Home';
import Training from './components/sections/Training';
import Groups from './components/sections/Groups';
import Upload from './components/sections/Upload';
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
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import logo from '../../assets/branding/logo.svg';
import './Home.css';

function Home() {
  return(
    <main className="home d-flex flex-grow-1 align-items-center bg-stridex-black">
      <div className="container d-flex flex-column align-items-center py-1 text-white">
        <img src={logo} alt="StrideX" className="home-logo py-2" />
        <p>StrideX is a web application that allows you to track your running and cycling activities, analyze your performance, and connect with other athletes.</p>
      </div>
    </main>
  );
}

export default Home;
import TeamCard from "../ui/TeamCard";
import { PlusLg } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom';


import icon from "../../assets/branding/icon.svg";

function Teams() {
  return (
    <main className="groups d-flex flex-grow-1 align-items-start bg-stridex-grey">
      <div className="container d-flex flex-column align-items-center py-3 text-white">
        <div className="w-100 mb-4 d-flex justify-content-between">
          <h1 className="text-start mb-0">Groups</h1>
          <Link
            to="/createteam"
            style={{ width: "40px", height: "40px" }}
            className="upload-circle btn btn-outline-light text-white rounded-circle d-inline-flex flex-shrink-0 align-items-center justify-content-center p-2 mt-1 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
            aria-label="Manual Upload"
            title="Create New Group"
          >
            <PlusLg size={20} />
          </Link>
          
        </div>
        <div className="row row-cols-1 row-cols-lg-2 g-4">
          <div className="col">
            <TeamCard src={icon} title="StrideX Official" location="Elizabethtown, PA" description="The official StrideX group for news and updates." count={1234} status="joined" />
          </div>
          <div className="col">
            <TeamCard src={icon} title="StrideX Community" location="Elizabethtown, PA" description="A community for StrideX users to connect and share ideas." count={5678} status="" />
          </div>
          <div className="col">
            <TeamCard src={icon} title="StrideX Developers" location="Elizabethtown, PA" description="A group for developers to discuss and collaborate on StrideX projects." count={9012} status="" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Teams;
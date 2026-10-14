import GroupCard from "../ui/GroupCard";

import icon from "../../assets/branding/icon.svg";

function Groups() {
  return (
    <main className="groups d-flex flex-grow-1 align-items-start bg-stridex-grey">
      <div className="container d-flex flex-column align-items-center py-3 text-white">
        <h1 className="text-center mb-4">Groups</h1>
        <div className="row row-cols-1 row-cols-lg-2 g-4">
          <div className="col">
            <GroupCard src={icon} title="StrideX Official" location="Elizabethtown, PA" description="The official StrideX group for news and updates." count={1234} status="joined" />
          </div>
          <div className="col">
            <GroupCard src={icon} title="StrideX Community" location="Elizabethtown, PA" description="A community for StrideX users to connect and share ideas." count={5678} status="" />
          </div>
          <div className="col">
            <GroupCard src={icon} title="StrideX Developers" location="Elizabethtown, PA" description="A group for developers to discuss and collaborate on StrideX projects." count={9012} status="" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Groups;
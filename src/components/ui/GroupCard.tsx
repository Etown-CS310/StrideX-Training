function GroupCard({ src, title, location, description, count, status }: { src: string; title: string; location: string; description: string; count: number; status: string }) {
  return (
    <div className="card rounded-4 bg-stridex-black mb-3">        
      <div className="card-body d-flex flex-column justify-content-between h-100 gap-3 text-white">
        <div className="row">
          <div className="col-2">
            <img src={src} alt="" />
          </div>
          <div className="col-10 d-flex flex-column justify-content-center">
            <h2 className="card-title">{title}</h2>
            <p className="card-subtitle mb-2 text-stridex-lightgrey">{location}</p>
          </div>
        </div>

        <div className="row">
          <p className="card-text">{description}</p>
        </div>

        <div className="d-flex justify-content-between">
          <p className="card-text text-stridex-lightgrey m-0">Members: {count.toLocaleString()}</p>
          {status === "joined" ? (
            <p className="btn btn-outline-stridex-lightgrey text-white rounded-pill d-inline-flex align-items-center justify-content-center p-2 px-3 transition-bg hover-bg-stridex-lightgrey-hover m-0">Leave</p>
          ) : (
            <p className="btn btn-outline-stridex-lightgrey text-white rounded-pill d-inline-flex align-items-center justify-content-center p-2 px-3 transition-bg hover-bg-stridex-lightgrey-hover m-0">Join</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupCard;
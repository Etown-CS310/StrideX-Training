function ActivityCard ({title, distance, time, activity}: {title: string, distance: number, time: number, activity: string}) {
    return(
        <div className="col-12 col-lg-4 col-xl-3 h-100">
              <div className="rounded-4 bg-stridex-black mb-3 border border-1 border-stridex-lightgrey">

                <div className="row flex-row justify-content-between g-0">
                    <p className="m-0 lh-1 col-3 mt-4 mb-1 text-white p-0 text-center">
                        {title}
                    </p>
                    <p className="m-0 lh-1 col-3 mt-4 mb-1 text-white p-0 text-center">
                        {distance}
                    </p>
                    <p className="m-0 lh-1 col-3 mt-4 mb-1 text-white p-0 text-center">
                        {time}
                    </p>
                </div>

                <div className="row flex-row justify-content-between g-0">
                    <p className="m-0 lh-1 col-3 mb-4 mt-1 text-white p-0 text-center">
                        {activity}
                    </p>
                    <p className="m-0 lh-1 col-3 mb-4 mt-1 text-white p-0 text-center">
                        Distance
                    </p>
                    <p className="m-0 lh-1 col-3 mb-4 mt-1 text-white p-0 text-center">
                        Time
                    </p>
                </div>
              </div>
            </div>
     

    )


}

export default ActivityCard;
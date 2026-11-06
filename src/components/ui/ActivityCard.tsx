import { formatDuration } from '../../scripts/time';


function ActivityCard ({title, distance, disttype, time, activity}: {title: string, distance: number, disttype: string, time: number, activity: string}) {
    return(
        <div className="col-12">
              <div className="rounded-4 bg-stridex-black mb-3 border border-1 border-stridex-lightgrey">

                <div className="row flex-row justify-content-between g-0">
                    <p className="m-0 lh-1 col-3 mt-4 mb-1 text-white p-0 px-1 ps-2 text-left">
                        {title}
                    </p>
                    <p className="m-0 lh-1 col-3 mt-4 mb-1 text-white p-0 text-left">
                        {distance.toFixed(2)} {disttype}
                        
                    </p>
                    <p className="m-0 lh-1 col-3 mt-4 mb-1 text-white p-0 px-1 pe-2 text-left">
                        {formatDuration(time, false)}
                    </p>
                </div>

                <div className="row flex-row justify-content-between g-0">
                    <p className="m-0 lh-1 col-3 mb-4 mt-1 text-white p-0 px-1 ps-2 text-left">
                        {activity}
                    </p>
                    <p className="m-0 lh-1 col-3 mb-4 mt-1 text-white p-0 text-left">
                        Distance
                    </p>
                    <p className="m-0 lh-1 col-3 mb-4 mt-1 text-white p-0 px-1 pe-2 text-left">
                        Time
                    </p>
                </div>
              </div>
            </div>
     

    )


}

export default ActivityCard;
function ActivityCard ({title, distance, time, activity}: {title: string, distance: number, time: number, activity: string}) {
    return(
        <div className="rounded-4 bg-stridex-black mb-3">
            <div className="search rounded-4 bg-stridex-lightgrey">

                
            </div>
            
        



            <h2>{title}</h2>
            <p>{distance}</p>
            <p>{time}</p>
            <p>{activity}</p>
        </div>
     

    )


}
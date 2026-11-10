
import ActivityCard from "../ui/ActivityCard";


function ViewSidebar() {

    const activity1 = {
        title: "Morning Run",
        distance: 2.00, // Miles many need to change
        disttype: "mi",
        time: 7200,
        activity: "Running"
    };
    const activity2 = {
        title: "Midday Swim",
        distance: 1,
        disttype: "km",
        time: 3600,
        activity: "Swimming"
    };

    const activities = [activity1, activity2];


    // Pull data from database







    // Print data onto screen
    return (
        <div>
            <div className="row p-1 pb-3">
                <div className="col-6 p-2">
                    <input
                        id="activity-search"
                        className="w-100 form-control rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                        placeholder="Search Activity"
                    >
                    
                    </input>
                </div>

                <div className="col-6 p-2">
                    <select 
                        id="activity"
                        className="form-select col-6 rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                        aria-label="Activity Type"
                    >
                        <option value="Default">Default</option>
                        <option value="Swim">Swim</option>

                        
                    </select>
                </div>
            </div>

            {activities.map((activity) => (
                <ActivityCard
                    title = {activity.title}
                    distance = {activity.distance}
                    disttype = {activity.disttype}
                    time = {activity.time}
                    activity = {activity.activity}
                />
            ))}


           
        </div>
    )


}

export default ViewSidebar;
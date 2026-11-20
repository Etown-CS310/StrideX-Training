import AthleteCard from "../ui/AthleteCard";

function Coaching() {


return (

    

    <div className="coaching bg-stridex-grey flex-grow-1">
        <div className="container">
            <div className="row py-2">
                <main className="col-12 col-lg-8 col-xxl-9">
                    <div className="bg-stridex-black vh-100 border border-stridex-lightgrey rounded-4 text-center">
                        <p className="text-white my-2">Information about Coach</p>
                    </div>

                </main>


                <aside id="sideBar" className="col-12 col-lg-4 col-xxl-3 ps-lg-3 ps-xxl-4">
                    <div className="row p-1 pb-3">
                        <div className="rounded-4 bg-stridex-black mb-3 border border-1 text-white text-center">
                            <p>You're Athletes</p>
                        </div>

                        <AthleteCard 
                            firstname={"Charles"}
                            lastname={"Xavier"}

                        />

                        <AthleteCard 
                            firstname={"Issac"}
                            lastname={"Newton"}

                        />
                        

                    </div>
                </aside>
            </div>
        </div>
    </div>

    )
}








export default Coaching;

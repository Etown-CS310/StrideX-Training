
function AthleteCard ({firstname, lastname}: {firstname: string, lastname: string}) {

    return(
        <div className="col-12">
            <div className="rounded-4 bg-white mb-3 border border-1">
                <div className="row flex-row justify-content-between g-0">
                    <p className="text-center text-stridex-black mt-3 mb-3">
                        {firstname + " " + lastname}
                        
                    </p>
                </div>
            </div>
        </div>






    )

}

export default AthleteCard;
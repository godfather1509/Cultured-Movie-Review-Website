import { useLocation, useParams, useNavigate } from "react-router-dom";


function Theaters() {

    console.log("List of theaters")
    const navigate=useNavigate()

    return (
        <div className="flex gap-6 items-center">
            <button
                onClick={() => navigate(`/theater/screen/121`)}
                className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold shadow cursor-pointer
               transition transform duration-300 ease-in-out
               hover:bg-pink-500 hover:shadow-lg"
            >
                Select Seat
            </button>
        </div>
    )

}

export default Theaters
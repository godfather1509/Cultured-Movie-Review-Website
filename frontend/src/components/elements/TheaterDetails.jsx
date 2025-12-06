import { useLocation, useParams, useNavigate } from "react-router-dom";


function TheaterDetails({ dict }) {
    console.log(dict)
    const navigate = useNavigate()

    return (
        <div style={{ padding: "20px", border: "1px solid #ccc" }}>

            <h2><strong>{dict.theaterName}</strong>:<p>{dict.theaterLocation}</p></h2>
    
            <div className="flex flex-row gap-4">
            {dict.theaterShows.map((show, index) => (
                <button
                    key={index}
                    onClick={() => navigate(`/theater/screen/${dict.theaterName}/${show.screen}/${show.capacity}`)}>
                    <div
                        className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold shadow cursor-pointer
               transition transform duration-300 ease-in-out
               hover:bg-pink-500 hover:shadow-lg"
                        style={{
                            marginBottom: "10px",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "6px"
                        }}
                    >
                        <p><strong>Time:</strong> {show.time}</p>
                        <p><strong>Capacity:</strong> {show.capacity}</p>
                    </div>
                </button>
            ))}
            </div>
        </div>
    );
}

export default TheaterDetails
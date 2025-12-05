import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../api/apiConfig";

function Theaters() {

    const navigate = useNavigate()
    // console.log("List of theaters:", theaters)
    const { imdbId } = useParams();

    const [shows, setShows] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
        useEffect(() => {
            let isMounted = true;
    
            (async () => {
                try {
                    const theaterRes = await api.get(`/api/v1/theaters/${imdbId}`);
                    const theaterPayload = theaterRes.data;
                    console.log(theaterPayload)

                    // const showRes = await api.get("/api/v1/theater/{movieId}/{theaterId}");
                    // const showPayload = showRes.data;
                    // console.log(showPayload)

                    // if (isMounted) setMovies(Array.isArray(payload) ? payload : payload?.movies ?? []);
                } catch (err) {
                    if (isMounted) setError(err?.message || "Failed to load movies");
                    console.error(err);
                } finally {
                    if (isMounted) setLoading(false);
                }
            })();
    
            return () => { isMounted = false; };
        }, []);
    
        // Log after state actually changes
        // useEffect(() => {
        //     if (!loading) console.log("Movies updated:", movies);
        // }, [movies, loading]);
    
        // if (loading) {
        //     return <p className="p-4">Loading…</p>;
        // }
    
        // if (error) {
        //     return <p className="p-4 text-red-600">Error: {error}</p>;
        // }

    return (
        <>
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
        </>
    )

}

export default Theaters
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../api/apiConfig";
import TheaterDetails from "./elements/TheaterDetails";

function Theaters() {

    const navigate = useNavigate()
    const { imdbId } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [allData, setAllData] = useState([])

    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                const theaterRes = await api.get(`/api/v1/theaters/${imdbId}`);
                const theaterPayload = theaterRes.data;
                // console.log(theaterPayload)

                for (const element of theaterPayload) {
                    const showRes = await api.get(`/api/v1/theaters/${imdbId}/${element.theaterId}`);
                    const showPayload = showRes.data;
                    // console.log("Shows:", showPayload);
                    // console.log("Theater info:",element)
                    const dict = {
                        theaterName: element.name,
                        theaterLocation: element.location,
                        theaterShows: showPayload.map(show => ({
                            capacity: show.capacity,
                            time: show.time,
                            screen:show.screen
                        }))
                    };
                    if (isMounted) {
                        setAllData(prev => [...prev, dict]);
                    }
                }
                // console.log("full data:", allData)

            } catch (err) {
                if (isMounted) setError(err?.message || "Failed to load theaters");
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, []);

    // Log after state actually changes
    useEffect(() => {
        if (!loading) console.log("Movies updated:", allData);
    }, [allData, loading]);

    if (loading) {
        return <p className="p-4">Loading…</p>;
    }

    if (error) {
        return <p className="p-4 text-red-600">Error: {error}</p>;
    }

    return (
        <>
            {allData.map((item, index) => (
                <TheaterDetails key={index} dict={item} />
            ))}
        </>
    )

}

export default Theaters
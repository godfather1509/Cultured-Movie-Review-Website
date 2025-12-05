import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../api/apiConfig";

function Home() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                const res = await api.get("/api/v1/movies");
                // Adjust this line to match your API shape:
                // e.g. setMovies(res.data.movies) if the payload is { movies: [...] }
                const payload = res.data;
                if (isMounted) setMovies(Array.isArray(payload) ? payload : payload?.movies ?? []);
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
    useEffect(() => {
        if (!loading) console.log("Movies updated:", movies);
    }, [movies, loading]);

    if (loading) {
        return <p className="p-4">Loading…</p>;
    }

    if (error) {
        return <p className="p-4 text-red-600">Error: {error}</p>;
    }

    function slugify(title) {
        return (title || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-") // replace spaces & special chars with "-"
            .replace(/^-+|-+$/g, "");    // remove leading/trailing "-"
    }

    return (
        <>
            <div className="grid gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {movies.map((m, index) => {
                    const movieId = m.imdbId;
                    return (
                        <NavLink
                            key={index}
                            to={`/movie/${slugify(m.title)}/${movieId}`}
                            state={{ movie: m }}
                            className="block w-full max-w-sm h-full bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700
                     hover:shadow-md focus:ring-4 focus:ring-blue-300 outline-none transition"
                            aria-label={`View details for ${m.title || "movie"}`}
                        >
                            {/* Make the card a column flex container */}
                            <div className="flex flex-col h-full">
                                {/* Image: fixed visual area */}
                                <div className="overflow-hidden rounded-t-lg">
                                    <img
                                        className="w-full h-64 object-cover"
                                        src={m.poster}
                                        alt={m.title || "movie image"}
                                    />
                                </div>

                                {/* Content: grows, and bottom area is reserved for date */}
                                <div className="px-5 pb-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h5 className="mt-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                                            {m.title || "Untitled"}
                                        </h5>

                                        <div className="flex flex-wrap gap-2 mt-2.5 mb-4">
                                            {Array.isArray(m.genres) && m.genres.length > 0 ? (
                                                m.genres.map((genre, i) => (
                                                    <span
                                                        key={`${movieId}-genre-${i}`}
                                                        className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-sm dark:bg-blue-200 dark:text-blue-800"
                                                    >
                                                        {genre}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-xs">No genres</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom row — stays at the bottom of the card */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-medium text-gray-900 dark:text-white">
                                            {m.releaseDate ? m.releaseDate.split("-").reverse().join("-") : ""}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </NavLink>
                    );
                })}
            </div>
        </>
    );
}

export default Home;

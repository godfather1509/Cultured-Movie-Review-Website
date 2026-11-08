import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../api/apiConfig";

const FALLBACK_MOVIES = [
    {
        imdbId: "tt1630029",
        title: "Avatar: The Way of Water",
        releaseDate: "2022-12-16",
        trailerLink: "https://www.youtube.com/watch?v=d9MyW72ELq0",
        poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
        genres: ["Action", "Adventure", "Sci-Fi"],
        backdrops: ["https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg"],
        avgRating: 4.5
    },
    {
        imdbId: "tt10872600",
        title: "Spider-Man: No Way Home",
        releaseDate: "2021-12-17",
        trailerLink: "https://www.youtube.com/watch?v=JfVOs4VSpmA",
        poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
        genres: ["Action", "Adventure", "Sci-Fi"],
        backdrops: ["https://image.tmdb.org/t/p/original/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg"],
        avgRating: 4.8
    },
    {
        imdbId: "tt15398776",
        title: "Oppenheimer",
        releaseDate: "2023-07-21",
        trailerLink: "https://www.youtube.com/watch?v=uYPbbksJxIg",
        poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        genres: ["Biography", "Drama", "History"],
        backdrops: ["https://image.tmdb.org/t/p/original/fm6K9vYQ7jxqUpqVg3WqAqISZPt.jpg"],
        avgRating: 4.9
    },
    {
        imdbId: "tt0816692",
        title: "Interstellar",
        releaseDate: "2014-11-07",
        trailerLink: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        genres: ["Adventure", "Drama", "Sci-Fi"],
        backdrops: ["https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg"],
        avgRating: 4.9
    },
    {
        imdbId: "tt0468569",
        title: "The Dark Knight",
        releaseDate: "2008-07-18",
        trailerLink: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
        poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        genres: ["Action", "Crime", "Drama"],
        backdrops: ["https://image.tmdb.org/t/p/original/dqK9Hag1054tghRQSqLSfrkvQnA.jpg"],
        avgRating: 5.0
    },
    {
        imdbId: "tt1375666",
        title: "Inception",
        releaseDate: "2010-07-16",
        trailerLink: "https://www.youtube.com/watch?v=YoHD9XEInc0",
        poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
        genres: ["Action", "Adventure", "Sci-Fi"],
        backdrops: ["https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg"],
        avgRating: 4.8
    }
];

function Home() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBackendConnected, setIsBackendConnected] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let isMounted = true;

        (async () => {
            setLoading(true);
            try {
                const res = await api.get("/api/v1/movies");
                const payload = res.data;
                const moviesList = Array.isArray(payload) ? payload : payload?.movies ?? [];

                if (isMounted) {
                    if (moviesList.length > 0) {
                        setMovies(moviesList);
                        setIsBackendConnected(true);
                    } else {
                        // Empty database: use fallback catalog
                        setMovies(FALLBACK_MOVIES);
                    }
                }
            } catch (err) {
                console.warn("Backend unavailable, using catalog fallbacks:", err);
                if (isMounted) {
                    setMovies(FALLBACK_MOVIES);
                    setIsBackendConnected(false);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, [retryCount]);

    function slugify(title) {
        return (title || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    return (
        <div className="min-h-screen bg-[#0c0e12] text-white">
            {/* Hero / Filter Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Now Showing
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Select a movie to explore theaters, schedule showtimes, and book tickets
                    </p>
                </div>

                {!isBackendConnected && (
                    <div className="flex items-center gap-2.5 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 px-3.5 py-1.5 rounded-lg shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                        <span className="font-medium">Offline catalog active</span>
                        <button
                            onClick={() => setRetryCount((c) => c + 1)}
                            className="ml-1 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>

            {/* Movies Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin"></div>
                        <p className="text-zinc-400 text-sm font-medium">Loading movies catalog...</p>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {movies.map((m, index) => {
                            const movieId = m.imdbId;
                            return (
                                <NavLink
                                    key={movieId || index}
                                    to={`/movie/${slugify(m.title)}/${movieId}`}
                                    state={{ movie: m }}
                                    className="group block bg-[#13161c] border border-zinc-800/80 hover:border-zinc-600 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-black/70 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                                    aria-label={`View details for ${m.title || "movie"}`}
                                >
                                    {/* Image with overlay tags */}
                                    <div className="relative overflow-hidden aspect-[2/3] bg-zinc-950">
                                        <img
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            src={m.poster}
                                            alt={m.title || "Movie poster"}
                                            onError={(e) => {
                                                e.target.src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#13161c] via-transparent to-black/30 pointer-events-none"></div>

                                        {/* Rating Badge */}
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-xs font-bold text-amber-300 border border-zinc-700/80 shadow-sm">
                                                ★ {m.avgRating || 4.5}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Title & subtle CTA indicator */}
                                    <div className="p-3.5 flex items-center justify-between gap-2 border-t border-zinc-800/50 bg-[#13161c]">
                                        <h2 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors line-clamp-1">
                                            {m.title || "Untitled"}
                                        </h2>
                                        <span className="text-xs font-semibold text-zinc-300 group-hover:text-white group-hover:bg-zinc-700 px-2.5 py-1 rounded bg-zinc-800/80 border border-zinc-700/60 transition-colors shrink-0">
                                            Showtimes &rarr;
                                        </span>
                                    </div>
                                </NavLink>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Home;

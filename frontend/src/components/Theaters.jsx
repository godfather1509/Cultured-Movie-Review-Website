import { useLocation, useParams, useNavigate, NavLink } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import api from "../api/apiConfig";
import TheaterDetails from "./elements/TheaterDetails";

function Theaters() {
    const navigate = useNavigate();
    const location = useLocation();
    const { movieTitle: paramTitle, imdbId } = useParams();

    const [movie, setMovie] = useState(location.state?.movie || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [theaters, setTheaters] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const [timeFilter, setTimeFilter] = useState("all"); // 'all', 'morning', 'afternoon', 'evening', 'night'

    const decodedMovieTitle = decodeURIComponent(paramTitle || movie?.title || "Movie");

    // Dynamic next 5 calendar dates
    const dateList = useMemo(() => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const list = [];
        const today = new Date();

        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            list.push({
                dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()],
                dayNum: d.getDate(),
                month: months[d.getMonth()],
                fullDate: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
            });
        }
        return list;
    }, []);

    // Realistic fallback theaters in case backend data is not yet seeded
    const fallbackTheaters = useMemo(() => [
        {
            theaterId: "th-pvr-01",
            theaterName: "PVR ICON: Gold Screen",
            theaterLocation: "Phoenix Palladium, Lower Parel",
            amenities: [
                { label: "Dolby Atmos", icon: "sound" },
                { label: "4K Laser", icon: "film" },
                { label: "Recliner Seats", icon: "chair" },
                { label: "Gourmet F&B", icon: "food" }
            ],
            theaterShows: [
                { time: "10:30 AM", capacity: 64, screen: "Screen 1 (Laser)", bookedSeats: "A1,A2,C4" },
                { time: "01:45 PM", capacity: 80, screen: "Screen 2 (Dolby)", bookedSeats: "B3,B4,D5,D6" },
                { time: "05:15 PM", capacity: 64, screen: "Screen 1 (Laser)", bookedSeats: "A3,A4,C1,C2,C3" },
                { time: "08:45 PM", capacity: 80, screen: "Screen 2 (Dolby)", bookedSeats: "E1,E2,E3,E4" },
                { time: "11:15 PM", capacity: 64, screen: "Screen 3", bookedSeats: "B1,B2" }
            ]
        },
        {
            theaterId: "th-inox-02",
            theaterName: "INOX Megaplex: IMAX & Insignia",
            theaterLocation: "Inorbit Mall, Malad West",
            amenities: [
                { label: "IMAX with Laser", icon: "film" },
                { label: "Insignia Lounge", icon: "chair" },
                { label: "Dolby 7.1", icon: "sound" }
            ],
            theaterShows: [
                { time: "11:00 AM", capacity: 72, screen: "Screen 3 (IMAX)", bookedSeats: "C3,C4" },
                { time: "02:30 PM", capacity: 72, screen: "Screen 3 (IMAX)", bookedSeats: "D1,D2,D3" },
                { time: "06:00 PM", capacity: 64, screen: "Screen 4 (Insignia)", bookedSeats: "A1,B1,B2" },
                { time: "09:30 PM", capacity: 72, screen: "Screen 3 (IMAX)", bookedSeats: "A1,A2,A3,A4,E5,E6" }
            ]
        },
        {
            theaterId: "th-cine-03",
            theaterName: "Cinépolis: 4DX & VIP Lounge",
            theaterLocation: "Viviana Mall, Thane West",
            amenities: [
                { label: "4DX Motion", icon: "film" },
                { label: "Dolby Atmos", icon: "sound" },
                { label: "VIP Service", icon: "chair" }
            ],
            theaterShows: [
                { time: "12:15 PM", capacity: 64, screen: "Screen 1 (4DX)", bookedSeats: "B4,B5" },
                { time: "03:45 PM", capacity: 64, screen: "Screen 2", bookedSeats: "C5,C6" },
                { time: "07:15 PM", capacity: 80, screen: "Screen 1 (4DX)", bookedSeats: "A1,A2,D3,D4" },
                { time: "10:30 PM", capacity: 64, screen: "Screen 2", bookedSeats: "E3,E4" }
            ]
        }
    ], []);

    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                // If movie details not in state, fetch them
                if (!movie && imdbId) {
                    try {
                        const movieRes = await api.get(`/api/v1/movies/imdb/${imdbId}`);
                        if (isMounted && movieRes.data) {
                            setMovie(movieRes.data);
                        }
                    } catch (e) {
                        console.warn("Could not fetch movie info:", e);
                    }
                }

                // Fetch theaters from backend
                const theaterRes = await api.get(`/api/v1/theaters/${imdbId}`);
                const theaterPayload = theaterRes.data;

                if (Array.isArray(theaterPayload) && theaterPayload.length > 0) {
                    const loadedTheaters = await Promise.all(
                        theaterPayload.map(async (element) => {
                            try {
                                const showRes = await api.get(`/api/v1/theaters/${imdbId}/${element.theaterId}`);
                                return {
                                    theaterId: element.theaterId,
                                    theaterName: element.name,
                                    theaterLocation: element.location,
                                    theaterShows: (showRes.data || []).map((show) => ({
                                        capacity: show.capacity || 64,
                                        time: show.time || "07:00 PM",
                                        screen: show.screen || "Screen 1",
                                        bookedSeats: show.bookedSeats || ""
                                    }))
                                };
                            } catch (e) {
                                return {
                                    theaterId: element.theaterId,
                                    theaterName: element.name,
                                    theaterLocation: element.location,
                                    theaterShows: [
                                        { time: "01:30 PM", capacity: 64, screen: "Screen 1" },
                                        { time: "06:30 PM", capacity: 64, screen: "Screen 1" }
                                    ]
                                };
                            }
                        })
                    );
                    if (isMounted) setTheaters(loadedTheaters);
                } else {
                    // Fallback to sample theaters
                    if (isMounted) setTheaters(fallbackTheaters);
                }
            } catch (err) {
                console.warn("Using sample theaters due to API response:", err);
                if (isMounted) setTheaters(fallbackTheaters);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [imdbId]);

    // Helper to check time filter
    const matchesTimeFilter = (showTime) => {
        if (timeFilter === "all") return true;
        const lower = showTime.toLowerCase();
        const isPM = lower.includes("pm");
        const parts = showTime.replace(/[^0-9:]/g, "").split(":");
        let hour = parseInt(parts[0], 10) || 12;
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;

        if (timeFilter === "morning") return hour < 12;
        if (timeFilter === "afternoon") return hour >= 12 && hour < 16;
        if (timeFilter === "evening") return hour >= 16 && hour < 20;
        if (timeFilter === "night") return hour >= 20;
        return true;
    };

    // Filter theaters by search query & show times
    const filteredTheaters = useMemo(() => {
        return theaters
            .map((th) => {
                const filteredShows = th.theaterShows.filter((s) => matchesTimeFilter(s.time));
                return { ...th, theaterShows: filteredShows };
            })
            .filter((th) => {
                const query = searchQuery.toLowerCase().trim();
                const matchesSearch =
                    !query ||
                    th.theaterName.toLowerCase().includes(query) ||
                    th.theaterLocation.toLowerCase().includes(query);
                return matchesSearch && th.theaterShows.length > 0;
            });
    }, [theaters, searchQuery, timeFilter]);

    const posterUrl = movie?.poster || sessionStorage.getItem("poster") || "";

    return (
        <div className="min-h-screen bg-[#0d0f12] text-white">
            {/* Top Movie Banner Bar */}
            <div className="relative border-b border-gray-800 bg-gradient-to-r from-gray-950 via-gray-900 to-black px-4 sm:px-8 py-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left: Back button & Movie Info */}
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700/60 shrink-0"
                            title="Go back"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {posterUrl && (
                            <img
                                src={posterUrl}
                                alt={decodedMovieTitle}
                                className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg object-cover shadow-lg border border-white/10 shrink-0"
                            />
                        )}

                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                                    NOW SHOWING
                                </span>
                                {movie?.releaseDate && (
                                    <span className="text-xs text-gray-300 font-semibold bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
                                        Year: {movie.releaseDate.split("-")[0]}
                                    </span>
                                )}
                                <span className="text-xs text-gray-400">English • 2D / 3D / IMAX</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                {decodedMovieTitle}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                {movie?.avgRating && (
                                    <span className="flex items-center gap-1.5 text-zinc-200 font-bold bg-zinc-800/90 px-2.5 py-1 rounded-md border border-zinc-700">
                                        <span className="text-amber-400">★</span>
                                        <span>{movie.avgRating}/5</span>
                                    </span>
                                )}
                                {movie?.genres && movie.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {movie.genres.map((g, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 font-medium border border-zinc-700/80">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Safety & Quality Badges */}
                    <div className="hidden lg:flex items-center gap-3 text-xs text-zinc-300">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>100% Verified Theaters</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Instant M-Tickets</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Date Selection Bar */}
            <div className="bg-[#12151b] border-b border-gray-800/80 sticky top-0 z-30 shadow-md">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Date Selector Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                        {dateList.map((d, idx) => {
                            const isSelected = selectedDateIndex === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDateIndex(idx)}
                                    className={`flex flex-col items-center justify-center px-5 py-2.5 rounded-xl transition-all duration-200 shrink-0 font-medium ${
                                        isSelected
                                            ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                                            : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800"
                                    }`}
                                >
                                    <span className="text-xs uppercase tracking-wider font-bold opacity-90">
                                        {d.dayName}
                                    </span>
                                    <span className="text-lg font-bold leading-tight">
                                        {d.dayNum} {d.month}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search & Filter Controls */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search Theater */}
                        <div className="relative flex-1 md:w-64">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search cinema or location..."
                                className="w-full bg-gray-900 border border-gray-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-zinc-500 transition-colors"
                            />
                        </div>

                        {/* Timing filter pills */}
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="bg-gray-900 border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
                        >
                            <option value="all">All Times</option>
                            <option value="morning">Morning (&lt; 12 PM)</option>
                            <option value="afternoon">Afternoon (12 - 4 PM)</option>
                            <option value="evening">Evening (4 - 8 PM)</option>
                            <option value="night">Night (&gt; 8 PM)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm animate-pulse">Finding available theaters & showtimes...</p>
                    </div>
                ) : filteredTheaters.length > 0 ? (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>
                                Showing <strong className="text-white">{filteredTheaters.length}</strong> cinemas with available shows
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">
                                Selected Date: {dateList[selectedDateIndex]?.fullDate}
                            </span>
                        </div>

                        {filteredTheaters.map((item, index) => (
                            <TheaterDetails
                                key={item.theaterId || index}
                                dict={item}
                                movieTitle={decodedMovieTitle}
                                imdbId={imdbId}
                                selectedDate={dateList[selectedDateIndex]?.fullDate}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No theaters found</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            {searchQuery || timeFilter !== "all"
                                ? "No theaters match your search or time filter. Try clearing filters."
                                : "No showtimes are currently available for this movie on the selected date."}
                        </p>
                        {(searchQuery || timeFilter !== "all") && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setTimeFilter("all");
                                }}
                                className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-base font-semibold transition"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Theaters;

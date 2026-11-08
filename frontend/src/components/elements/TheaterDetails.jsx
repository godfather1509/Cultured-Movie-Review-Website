import { useState } from "react";
import { useNavigate } from "react-router-dom";

function TheaterDetails({ dict, movieTitle, imdbId, selectedDate }) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);

    const handleSelectShow = (show) => {
        navigate(`/theater/screen/${encodeURIComponent(dict.theaterName)}/${encodeURIComponent(show.screen)}/${show.capacity}`, {
            state: {
                theaterName: dict.theaterName,
                theaterId: dict.theaterId,
                theaterLocation: dict.theaterLocation,
                movieTitle: movieTitle || "Movie",
                imdbId: imdbId,
                showId: show.showId || (show.id ? (typeof show.id === "string" ? show.id : show.id.timestamp || "") : ""),
                screen: show.screen,
                time: show.time,
                capacity: show.capacity,
                price: show.price || 180,
                bookedSeats: show.bookedSeats || "",
                selectedDate: selectedDate || "Today"
            }
        });
    };

    // Calculate minimum starting price across this theater's shows
    const startingPrice = dict.theaterShows && dict.theaterShows.length > 0
        ? Math.min(...dict.theaterShows.map((s) => s.price || 180))
        : 180;

    // Default amenities if not explicitly provided
    const amenities = dict.amenities || [
        { label: "Dolby Atmos 7.1", icon: "sound" },
        { label: "4K Laser", icon: "film" },
        { label: "Recliner Seats", icon: "chair" },
        { label: "F&B Service", icon: "food" }
    ];

    return (
        <div className="bg-[#111318] border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-5 md:p-6 shadow-xl transition-all duration-300">
            {/* Top row: Theater Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-zinc-800/70">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                            aria-label="Save as favorite theater"
                            title="Favorite Theater"
                        >
                            <svg
                                className={`w-5 h-5 ${isFavorite ? "fill-zinc-200 text-zinc-200" : "text-zinc-500"}`}
                                fill={isFavorite ? "currentColor" : "none"}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </button>
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                            {dict.theaterName}
                        </h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs sm:text-sm font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Tickets from ₹{startingPrice}
                        </span>
                    </div>

                    {/* Location & Distance */}
                    <div className="flex items-center gap-2 mt-2 text-zinc-400 text-sm ml-8">
                        <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{dict.theaterLocation}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-xs text-zinc-400 font-medium">Free Parking Available</span>
                    </div>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 ml-8">
                        {amenities.map((item, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                                {item.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Policies / badges */}
                <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/80 border border-zinc-700/80 px-3 py-1.5 rounded-lg shadow-sm">
                        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Cancellation Available
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                        M-Ticket & Contactless Entry
                    </span>
                </div>
            </div>

            {/* Bottom row: Showtimes Grid */}
            <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Select Showtime & Screen
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                            Available
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400/80"></span>
                            Filling Fast
                        </span>
                    </div>
                </div>

                {dict.theaterShows && dict.theaterShows.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {dict.theaterShows.map((show, index) => {
                            const isFastFilling = show.capacity < 50;
                            const showPrice = show.price || 180;
                            return (
                                <div
                                    key={index}
                                    onClick={() => handleSelectShow(show)}
                                    className="group relative bg-[#171922] hover:bg-[#1e222e] border border-zinc-800 hover:border-zinc-500 rounded-xl p-3.5 cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col justify-between shadow-sm hover:shadow-lg"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-base sm:text-lg font-bold text-zinc-100 group-hover:text-white transition-colors">
                                            {show.time}
                                        </span>
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                isFastFilling ? "bg-amber-400/80" : "bg-zinc-400"
                                            }`}
                                            title={isFastFilling ? "Filling fast" : "Seats available"}
                                        />
                                    </div>

                                    {/* Starting price placed directly below the showtime */}
                                    <div className="mt-1 flex items-baseline gap-1.5">
                                        <span className="text-xs text-zinc-400 font-medium">Starts at</span>
                                        <span className="text-sm sm:text-base font-bold text-zinc-100">₹{showPrice}</span>
                                    </div>

                                    <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-zinc-300">
                                            {show.screen || "Screen 1"}
                                        </span>
                                        <span className="text-[11px] text-zinc-500">
                                            {show.capacity} seats
                                        </span>
                                    </div>

                                    {/* Action button */}
                                    <div className="mt-3 text-center py-1.5 rounded-lg bg-zinc-800/70 group-hover:bg-zinc-100 text-zinc-300 group-hover:text-zinc-950 text-xs font-bold uppercase tracking-wider transition-colors duration-200">
                                        Select Seats →
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center text-sm text-zinc-400">
                        No shows scheduled for the selected date. Check other dates or theaters.
                    </div>
                )}
            </div>
        </div>
    );
}

export default TheaterDetails;

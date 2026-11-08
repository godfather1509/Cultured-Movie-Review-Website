import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../api/apiConfig";

// Generates an authentic tiered cinema hall layout with aisle walkway
const generateTieredSeatLayout = (capacity, bookedString = "", basePrice = 180, customCols = 0) => {
    const bookedList = bookedString ? bookedString.split(",").map((s) => s.trim().toUpperCase()) : [];

    // Dynamically calculate seats per row and total rows based on capacity or custom cols
    const seatsPerRow = customCols > 0
        ? customCols
        : capacity >= 130 ? 14 : capacity >= 90 ? 12 : capacity >= 50 ? 10 : capacity <= 30 ? 6 : 8;
    const totalRows = Math.max(3, Math.ceil(capacity / seatsPerRow));

    const allRowLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];
    const vipRowCount = Math.max(1, Math.min(2, Math.floor(totalRows * 0.25)));
    const primeRowCount = Math.max(1, Math.floor(totalRows * 0.4));

    const vipRows = allRowLetters.slice(0, vipRowCount);
    const primeRows = allRowLetters.slice(vipRowCount, vipRowCount + primeRowCount);
    const classicRows = allRowLetters.slice(vipRowCount + primeRowCount, totalRows);

    const tiers = [
        {
            name: "VIP Recliner",
            price: Math.round(basePrice * 1.8),
            rows: vipRows,
            description: "Plush leather recliners with extra legroom & in-seat service"
        },
        {
            name: "Prime Executive",
            price: Math.round(basePrice * 1.35),
            rows: primeRows,
            description: "Optimal viewing angle & premium acoustic experience"
        },
        {
            name: "Classic",
            price: basePrice,
            rows: classicRows.length > 0 ? classicRows : ["C"],
            description: "Comfortable standard cinema seating"
        }
    ];

    let seatCount = 0;
    const generatedSections = [];

    tiers.forEach((tier) => {
        const tierRows = [];
        tier.rows.forEach((rowLetter, rIndex) => {
            const rowIndexOverall = generatedSections.reduce((acc, sec) => acc + sec.rows.length, 0) + rIndex;
            if (rowIndexOverall >= totalRows || seatCount >= capacity) return;

            const rowSeats = [];
            for (let c = 1; c <= seatsPerRow; c++) {
                seatCount++;
                if (seatCount > capacity) break;

                const seatId = `${rowLetter}${c}`;
                // Pre-mark some default seats as booked if none supplied, for realistic atmosphere
                const isBooked =
                    bookedList.includes(seatId) ||
                    (!bookedString && (seatId === "C4" || seatId === "C5" || seatId === "D4" || seatId === "D5"));

                rowSeats.push({
                    id: seatId,
                    row: rowLetter,
                    col: c,
                    status: isBooked ? "booked" : "available",
                    price: tier.price,
                    tierName: tier.name
                });
            }

            if (rowSeats.length > 0) {
                tierRows.push({
                    rowLetter,
                    seats: rowSeats
                });
            }
        });

        if (tierRows.length > 0) {
            generatedSections.push({
                ...tier,
                rows: tierRows
            });
        }
    });

    return { sections: generatedSections, seatsPerRow };
};

const Screen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theaterName: paramTheater, screen: paramScreen, capacity: paramCap } = useParams();

    const stateData = location.state || {};
    const theaterName = decodeURIComponent(paramTheater || stateData.theaterName || "Cinema Hall");
    const screenName = decodeURIComponent(paramScreen || stateData.screen || "Screen 1");
    const movieTitle = stateData.movieTitle || "Movie";
    const theaterLocation = stateData.theaterLocation || "";
    const showTime = stateData.time || "07:30 PM";
    const showDate = stateData.selectedDate || "Today";
    const capacity = Number(paramCap || stateData.capacity || 64);
    const bookedSeats = stateData.bookedSeats || "";

    const showPrice = Number(stateData.price) || 180;

    const [sections, setSections] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [currentBookedSeats, setCurrentBookedSeats] = useState(bookedSeats);
    const [activeSeatsPerRow, setActiveSeatsPerRow] = useState(8);

    // Fetch latest live reserved seats from database
    useEffect(() => {
        let isMounted = true;
        const fetchLatestSeats = async () => {
            try {
                const res = await api.get(`/api/v1/bookings/show-booked-seats?theaterId=${encodeURIComponent(stateData.theaterId || "")}&movieId=${encodeURIComponent(stateData.imdbId || "")}&screen=${encodeURIComponent(screenName)}&time=${encodeURIComponent(showTime)}&showId=${encodeURIComponent(stateData.showId || "")}`);
                if (isMounted && res.data && res.data.bookedSeats !== undefined && res.data.bookedSeats !== "") {
                    setCurrentBookedSeats(res.data.bookedSeats);
                }
            } catch (e) {
                // If backend is unreachable, check local booking storage as resilient fallback
                try {
                    const localBookings = JSON.parse(localStorage.getItem("cultured_user_bookings") || "[]");
                    const matching = localBookings.filter(
                        (b) => b.status !== "CANCELLED" && b.screen === screenName && b.showTime === showTime
                    );
                    const localReserved = matching.flatMap((b) => b.seats || []);
                    if (localReserved.length > 0) {
                        const merged = Array.from(new Set([...(bookedSeats ? bookedSeats.split(",") : []), ...localReserved])).join(",");
                        if (isMounted) setCurrentBookedSeats(merged);
                    }
                } catch (ignored) {}
            }
        };
        fetchLatestSeats();
        return () => { isMounted = false; };
    }, [stateData.theaterId, stateData.imdbId, screenName, showTime, stateData.showId, bookedSeats]);

    useEffect(() => {
        const customCols = stateData.screenCols || 0;
        const result = generateTieredSeatLayout(capacity, currentBookedSeats, showPrice, customCols);
        setSections(result.sections);
        setActiveSeatsPerRow(result.seatsPerRow);
    }, [capacity, currentBookedSeats, showPrice, stateData.screenCols]);

    // Lookup seat details by ID
    const getSeatById = (id) => {
        for (const sec of sections) {
            for (const r of sec.rows) {
                const found = r.seats.find((s) => s.id === id);
                if (found) return found;
            }
        }
        return null;
    };

    const toggleSeat = (seat) => {
        if (seat.status === "booked") return;

        if (selectedSeats.includes(seat.id)) {
            setSelectedSeats(selectedSeats.filter((id) => id !== seat.id));
        } else {
            if (selectedSeats.length >= 8) {
                alert("You can select up to 8 seats per booking.");
                return;
            }
            setSelectedSeats([...selectedSeats, seat.id]);
        }
    };

    // Calculate pricing breakdown
    const baseTicketPrice = useMemo(() => {
        return selectedSeats.reduce((sum, id) => {
            const seat = getSeatById(id);
            return sum + (seat?.price || 200);
        }, 0);
    }, [selectedSeats, sections]);

    const convenienceFee = selectedSeats.length > 0 ? selectedSeats.length * 25 : 0;
    const totalPrice = baseTicketPrice + convenienceFee;

    const handleCheckout = () => {
        const selectedDetails = selectedSeats.map((id) => getSeatById(id)).filter(Boolean);
        navigate(`/theater/checkout/${encodeURIComponent(theaterName)}`, {
            state: {
                selected: selectedSeats,
                totalPrice,
                basePrice: baseTicketPrice,
                convenienceFee,
                screen: screenName,
                theaterName,
                theaterId: stateData.theaterId,
                theaterLocation,
                movieTitle,
                imdbId: stateData.imdbId,
                showId: stateData.showId,
                showTime,
                showDate,
                selectedSeatsWithTier: selectedDetails
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#0b0d10] text-white flex flex-col justify-between">
            {/* Top Navigation & Movie Header */}
            <header className="bg-gray-950/90 border-b border-gray-800/80 px-4 sm:px-8 py-4 sticky top-0 z-20 backdrop-blur-md">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white transition border border-gray-700/60"
                            title="Back to Theaters"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                {movieTitle}
                                <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                                    {screenName}
                                </span>
                            </h1>
                            <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                <span>{theaterName}</span>
                                <span>•</span>
                                <span className="text-zinc-300 font-medium">{showTime}</span>
                                <span>•</span>
                                <span>{showDate}</span>
                            </p>
                        </div>
                    </div>

                    {/* Quick Legend Chips */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded bg-zinc-800 border border-zinc-600"></span>
                            <span className="text-zinc-300">Available</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded bg-zinc-100 text-zinc-950 font-bold"></span>
                            <span className="text-zinc-200 font-semibold">Selected</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded bg-zinc-800/60 opacity-60"></span>
                            <span className="text-zinc-500">Booked</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Cinema Auditorium Layout */}
            <main className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 flex-1 flex flex-col items-center">
                {/* Visual Curved Cinema Screen */}
                <div className="w-full max-w-2xl mb-12 flex flex-col items-center">
                    <div className="relative w-full flex justify-center">
                        {/* Overhead projection light */}
                        <div className="absolute top-0 w-3/4 h-20 bg-gradient-to-b from-white/10 via-zinc-400/5 to-transparent blur-xl pointer-events-none -z-0"></div>

                        {/* Curved screen arc */}
                        <div className="w-full h-8 relative overflow-hidden flex items-center justify-center">
                            <div className="w-[120%] h-24 border-t-2 border-zinc-300/80 rounded-[50%] shadow-[0_-6px_20px_rgba(255,255,255,0.2)] bg-gradient-to-b from-white/10 to-transparent"></div>
                        </div>
                    </div>
                    <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-400 mt-2 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 8v6h12V8H4z" />
                        </svg>
                        All Eyes This Way • Cinema Screen
                    </span>
                </div>

                {/* Seating Tiers */}
                <div className="w-full flex flex-col gap-8 pb-32">
                    {sections.map((section, sIdx) => (
                        <div key={sIdx} className="w-full bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4 sm:p-6 shadow-inner">
                            {/* Tier Header with Price */}
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-white">{section.name}</span>
                                    <span className="text-gray-400 hidden sm:inline">— {section.description}</span>
                                </div>
                                <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 font-bold border border-zinc-700">
                                    ₹{section.price}
                                </span>
                            </div>

                            {/* Rows */}
                            <div className="flex flex-col gap-3">
                                {section.rows.map((row) => {
                                    // Split into Left Wing and Right Wing with center aisle
                                    const midpoint = Math.floor(activeSeatsPerRow / 2);
                                    const leftWing = row.seats.filter((s) => s.col <= midpoint);
                                    const rightWing = row.seats.filter((s) => s.col > midpoint);

                                    return (
                                        <div key={row.rowLetter} className="flex items-center justify-center gap-2 sm:gap-4">
                                            {/* Left Row Identifier */}
                                            <span className="w-5 text-xs font-bold text-gray-500 text-center">
                                                {row.rowLetter}
                                            </span>

                                            {/* Left Wing */}
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                {leftWing.map((seat) => (
                                                    <SeatButton
                                                        key={seat.id}
                                                        seat={seat}
                                                        isSelected={selectedSeats.includes(seat.id)}
                                                        onClick={() => toggleSeat(seat)}
                                                    />
                                                ))}
                                            </div>

                                            {/* Center Aisle Walkway */}
                                            <div className="w-4 sm:w-8 flex items-center justify-center">
                                                <span className="text-[9px] uppercase tracking-wider text-gray-700 font-semibold rotate-90 select-none">
                                                    Aisle
                                                </span>
                                            </div>

                                            {/* Right Wing */}
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                {rightWing.map((seat) => (
                                                    <SeatButton
                                                        key={seat.id}
                                                        seat={seat}
                                                        isSelected={selectedSeats.includes(seat.id)}
                                                        onClick={() => toggleSeat(seat)}
                                                    />
                                                ))}
                                            </div>

                                            {/* Right Row Identifier */}
                                            <span className="w-5 text-xs font-bold text-gray-500 text-center">
                                                {row.rowLetter}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Bottom Floating Booking Dock */}
            <div className="fixed bottom-0 inset-x-0 bg-gray-950/95 border-t border-gray-800/90 p-4 shadow-2xl z-30 backdrop-blur-lg">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Selected Seats Badges */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="text-left">
                            <span className="text-xs text-gray-400 block">
                                {selectedSeats.length > 0 ? `${selectedSeats.length} Seat(s) Selected` : "No seats selected"}
                            </span>
                            {selectedSeats.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 mt-1 max-w-xs sm:max-w-md">
                                    {selectedSeats.map((id) => (
                                        <span
                                            key={id}
                                            className="px-3 py-1 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-sm font-bold flex items-center gap-1.5"
                                        >
                                            {id}
                                            <button
                                                onClick={() => setSelectedSeats(selectedSeats.filter((s) => s !== id))}
                                                className="hover:text-white"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-gray-500">Click on available seats above to select</span>
                            )}
                        </div>

                        {selectedSeats.length > 0 && (
                            <button
                                onClick={() => setSelectedSeats([])}
                                className="text-sm font-semibold text-zinc-400 hover:text-red-400 underline ml-2 shrink-0 cursor-pointer"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Price and Action Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="text-right">
                            <span className="text-xs text-gray-400 block">Grand Total</span>
                            <span className="text-xl sm:text-2xl font-black text-white">₹{totalPrice}</span>
                            {selectedSeats.length > 0 && (
                                <span className="text-[10px] text-gray-500 block">Includes ₹{convenienceFee} Conv. Fee</span>
                            )}
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={selectedSeats.length === 0}
                            className={`px-8 py-3.5 rounded-xl font-bold text-base sm:text-lg shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                                selectedSeats.length > 0
                                    ? "bg-zinc-100 hover:bg-white text-zinc-950 hover:scale-[1.02] active:scale-[0.98]"
                                    : "bg-gray-800 text-gray-500 cursor-not-allowed opacity-60"
                            }`}
                        >
                            <span>Proceed to Pay</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Seat Component with realistic cinema chair styling
const SeatButton = ({ seat, isSelected, onClick }) => {
    const isBooked = seat.status === "booked";

    return (
        <button
            onClick={onClick}
            disabled={isBooked}
            title={`Seat ${seat.id} - ${seat.tierName} (₹${seat.price})`}
            className={`
                group relative w-7 h-7 sm:w-9 sm:h-9 rounded-t-lg rounded-b-md flex flex-col items-center justify-center transition-all duration-200 text-xs font-semibold select-none
                ${
                    isBooked
                        ? "bg-gray-800/80 border border-gray-800 text-gray-600 cursor-not-allowed opacity-40"
                        : isSelected
                        ? "bg-zinc-100 border border-white text-zinc-950 shadow-md font-bold scale-105 ring-2 ring-zinc-300 cursor-pointer"
                        : "bg-gray-900 border border-gray-700/80 text-gray-300 hover:border-zinc-400 hover:bg-gray-800 hover:text-white cursor-pointer hover:scale-105"
                }
            `}
        >
            {/* Top cushion bar */}
            <span
                className={`w-3/4 h-1 rounded-full mb-0.5 ${
                    isSelected ? "bg-zinc-400" : isBooked ? "bg-gray-700" : "bg-gray-700 group-hover:bg-zinc-400"
                }`}
            />
            {/* Seat Label */}
            <span className="text-[10px] sm:text-xs leading-none">{seat.col}</span>
        </button>
    );
};

export default Screen;

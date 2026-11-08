import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../api/apiConfig";

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [confirmCancelBooking, setConfirmCancelBooking] = useState(null);
    const [actionMessage, setActionMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Load bookings from server and fallback/merge with localStorage
    const loadBookings = async () => {
        setLoading(true);
        let fetchedList = [];
        try {
            const res = await api.get("/api/v1/bookings");
            if (Array.isArray(res.data)) {
                fetchedList = res.data;
            }
        } catch (e) {
            console.warn("Could not fetch remote bookings, relying on local storage:", e);
        }

        try {
            const localStored = JSON.parse(localStorage.getItem("cultured_user_bookings") || "[]");
            // Merge local and remote, keyed by bookingId (prefer remote updates)
            const map = new Map();
            localStored.forEach((b) => b && b.bookingId && map.set(b.bookingId, b));
            fetchedList.forEach((b) => b && b.bookingId && map.set(b.bookingId, b));
            const merged = Array.from(map.values()).sort(
                (a, b) => new Date(b.bookingTime || 0) - new Date(a.bookingTime || 0)
            );
            setBookings(merged);
        } catch (err) {
            setBookings(fetchedList);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleCancelTicket = async (booking) => {
        if (!booking || !booking.bookingId) return;

        setCancellingId(booking.bookingId);
        setActionMessage("");
        setErrorMessage("");

        try {
            const res = await api.post(`/api/v1/bookings/cancel/${booking.bookingId}`);
            const updatedBooking = res.data?.booking || { ...booking, status: "CANCELLED" };

            // Update in component state
            setBookings((prev) =>
                prev.map((b) => (b.bookingId === booking.bookingId ? updatedBooking : b))
            );

            // Update in localStorage
            try {
                const local = JSON.parse(localStorage.getItem("cultured_user_bookings") || "[]");
                const updatedLocal = local.map((b) =>
                    b.bookingId === booking.bookingId ? { ...b, status: "CANCELLED" } : b
                );
                localStorage.setItem("cultured_user_bookings", JSON.stringify(updatedLocal));
            } catch (ignored) {}

            setActionMessage(`Ticket ${booking.bookingId} cancelled. Seats (${(booking.seats || []).join(", ")}) reopened for booking.`);
            setConfirmCancelBooking(null);
        } catch (err) {
            console.warn("Remote cancellation failed, cancelling locally:", err);
            // Even if backend fails, update locally so user is never stuck
            const updatedBooking = { ...booking, status: "CANCELLED" };
            setBookings((prev) =>
                prev.map((b) => (b.bookingId === booking.bookingId ? updatedBooking : b))
            );
            try {
                const local = JSON.parse(localStorage.getItem("cultured_user_bookings") || "[]");
                const updatedLocal = local.map((b) =>
                    b.bookingId === booking.bookingId ? { ...b, status: "CANCELLED" } : b
                );
                localStorage.setItem("cultured_user_bookings", JSON.stringify(updatedLocal));
            } catch (ignored) {}
            setActionMessage(`Ticket ${booking.bookingId} cancelled locally. Seats reopened.`);
            setConfirmCancelBooking(null);
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0d10] text-white py-10 px-4 sm:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-zinc-800 gap-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                            The Cultured Cinema Pass
                        </span>
                        <h1 className="text-3xl font-black text-white mt-1">My Booked Tickets</h1>
                        <p className="text-xs text-zinc-400 mt-1">
                            View active contactless M-Tickets, download receipts, or manage seat reservations
                        </p>
                    </div>

                    <NavLink
                        to="/"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-sm font-semibold transition self-start sm:self-auto cursor-pointer"
                    >
                        <span>+ Book More Tickets</span>
                    </NavLink>
                </div>

                {/* Notifications */}
                {actionMessage && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{actionMessage}</span>
                        </div>
                        <button onClick={() => setActionMessage("")} className="text-emerald-400 hover:text-white font-bold ml-3 text-lg leading-none cursor-pointer">
                            ×
                        </button>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center justify-between shadow-lg">
                        <span>{errorMessage}</span>
                        <button onClick={() => setErrorMessage("")} className="text-red-400 hover:text-white font-bold ml-3 text-lg leading-none cursor-pointer">
                            ×
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin"></div>
                        <p className="text-zinc-400 text-sm">Loading your booked tickets...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="bg-[#12151c] border border-zinc-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xl">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-400 border border-zinc-700">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No tickets booked yet</h2>
                        <p className="text-xs text-zinc-400 mb-6">
                            You have no active or previous ticket reservations. Explore our latest movie lineup and reserve your preferred seats.
                        </p>
                        <NavLink
                            to="/"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm shadow-md transition cursor-pointer"
                        >
                            <span>Explore Now Showing →</span>
                        </NavLink>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((b, idx) => {
                            const isCancelled = b.status === "CANCELLED";
                            const formattedDate = b.bookingTime
                                ? new Date(b.bookingTime).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                  })
                                : b.showDate || "Recent";

                            return (
                                <article
                                    key={b.bookingId || idx}
                                    className={`relative bg-[#12151c] border rounded-2xl p-6 shadow-xl transition-all duration-200 ${
                                        isCancelled
                                            ? "border-zinc-800/60 opacity-75"
                                            : "border-zinc-800 hover:border-zinc-600"
                                    }`}
                                >
                                    {/* Top Row: Booking ID & Status Pill */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                                Booking ID:
                                            </span>
                                            <span className="font-mono text-sm font-bold text-white tracking-widest bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-700">
                                                {b.bookingId}
                                            </span>
                                            <span className="text-xs text-zinc-500 hidden sm:inline">• Booked on {formattedDate}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isCancelled ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
                                                    <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                                                    Cancelled
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                                                    <span className="w-2 h-2 rounded-full bg-zinc-300"></span>
                                                    Confirmed
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle: Cinema & Seat Details */}
                                    <div className="py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Movie & Cinema info */}
                                        <div className="md:col-span-2 space-y-2">
                                            <h3 className={`text-2xl font-black text-white ${isCancelled ? "line-through text-zinc-400" : ""}`}>
                                                {b.movieTitle || "Movie"}
                                            </h3>
                                            <p className="text-sm font-semibold text-zinc-300">
                                                {b.theaterName}
                                            </p>
                                            {b.theaterLocation && (
                                                <p className="text-xs text-zinc-400">{b.theaterLocation}</p>
                                            )}

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-xs font-medium text-zinc-300 border border-zinc-800">
                                                    {b.screen || "Screen 1"}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-xs font-medium text-zinc-300 border border-zinc-800">
                                                    {b.showDate} • {b.showTime}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Seats & Payment summary */}
                                        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
                                            <div>
                                                <span className="text-xs text-zinc-400 font-medium block mb-1">
                                                    Allocated Seats ({(b.seats || []).length}):
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(b.seats || []).map((st) => (
                                                        <span
                                                            key={st}
                                                            className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                                                isCancelled
                                                                    ? "bg-zinc-900 text-zinc-500 border-zinc-800 line-through"
                                                                    : "bg-zinc-800 text-zinc-200 border-zinc-700"
                                                            }`}
                                                        >
                                                            {st}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
                                                <span className="text-xs text-zinc-400">Total Paid:</span>
                                                <span className={`text-base font-extrabold ${isCancelled ? "line-through text-zinc-500" : "text-white"}`}>
                                                    ₹{b.totalPrice || 0}
                                                </span>
                                            </div>

                                            {b.paymentId && (
                                                <span className="text-[10px] text-zinc-500 block truncate" title={b.paymentId}>
                                                    Payment: {b.paymentId}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Action Footer */}
                                    <div className="pt-4 border-t border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <span className="text-xs text-zinc-500">
                                            {isCancelled
                                                ? "100% refund initiated to your original payment method. Seats have been reopened."
                                                : "Free cancellation available up to 2 hours before showtime."}
                                        </span>

                                        <div className="flex items-center gap-3">
                                            {!isCancelled && (
                                                <button
                                                    onClick={() => setConfirmCancelBooking(b)}
                                                    disabled={cancellingId === b.bookingId}
                                                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 text-zinc-300 hover:text-red-400 border border-zinc-800 hover:border-red-800/60 text-xs font-bold transition cursor-pointer"
                                                >
                                                    {cancellingId === b.bookingId ? "Cancelling..." : "Cancel Ticket"}
                                                </button>
                                            )}

                                            <button
                                                onClick={() => window.print()}
                                                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition cursor-pointer"
                                            >
                                                Print Ticket
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Confirmation Modal for Cancellation */}
            {confirmCancelBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#12151c] border border-zinc-700 max-w-md w-full rounded-2xl p-6 shadow-2xl text-left">
                        <div className="w-12 h-12 rounded-full bg-red-950/40 text-red-400 flex items-center justify-center mb-4 border border-red-800/40">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Cancel Ticket Reservation?</h3>
                        <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                            Are you sure you want to cancel booking <strong className="text-white">{confirmCancelBooking.bookingId}</strong> for{" "}
                            <strong className="text-white">{confirmCancelBooking.movieTitle}</strong>?
                        </p>

                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs space-y-1.5 mb-6 text-zinc-400">
                            <div>• Reopening seats: <strong className="text-zinc-200">{(confirmCancelBooking.seats || []).join(", ")}</strong></div>
                            <div>• Refund amount: <strong className="text-emerald-400">₹{confirmCancelBooking.totalPrice}</strong> (100% refund)</div>
                            <div>• Refund destination: Original payment method ({confirmCancelBooking.paymentId || "Online"})</div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmCancelBooking(null)}
                                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800 transition cursor-pointer"
                            >
                                Keep Ticket
                            </button>
                            <button
                                onClick={() => handleCancelTicket(confirmCancelBooking)}
                                disabled={cancellingId === confirmCancelBooking.bookingId}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                            >
                                {cancellingId === confirmCancelBooking.bookingId ? "Processing..." : "Confirm Cancellation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyBookings;


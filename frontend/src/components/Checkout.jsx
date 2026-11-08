import { useState } from "react";
import { useLocation, useParams, useNavigate, NavLink } from "react-router-dom";
import api from "../api/apiConfig";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TxZsfEPH1tzjh2";

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { theaterName: paramTheater } = useParams();

    const {
        selected = [],
        totalPrice = 0,
        basePrice = 0,
        convenienceFee = 0,
        screen = "Screen 1",
        theaterName: stateTheater,
        theaterId = "",
        theaterLocation = "",
        movieTitle = "Movie",
        imdbId = "",
        showId = "",
        showTime = "07:30 PM",
        showDate = "Today",
        selectedSeatsWithTier = []
    } = location.state || {};

    const theaterName = decodeURIComponent(paramTheater || stateTheater || "Cinema Hall");
    const posterUrl = sessionStorage.getItem("poster") || "";

    const [isPaid, setIsPaid] = useState(false);
    const [bookingId, setBookingId] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    const handleConfirmPayment = async () => {
        setPaymentError("");
        setIsProcessing(true);

        const amountInPaise = Math.round(Number(totalPrice) * 100);

        if (amountInPaise < 100) {
            setPaymentError("Minimum order amount must be at least ₹1 (100 paise).");
            setIsProcessing(false);
            return;
        }

        try {
            // Ensure Razorpay SDK script is loaded
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setPaymentError("Failed to load Razorpay Checkout SDK. Please check your internet connection.");
                setIsProcessing(false);
                return;
            }

            // 1. Create order on backend: POST /api/create-order
            const orderRes = await api.post("/api/create-order", {
                amount: amountInPaise,
                currency: "INR",
                receipt: "rcpt_" + Date.now(),
                movieTitle,
                theaterName,
                seats: selected
            });

            const orderData = orderRes.data;
            if (!orderData || !orderData.order_id) {
                throw new Error("Invalid order response from backend.");
            }

            // 2. Open Razorpay Checkout modal
            const options = {
                key: orderData.key_id || RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "The Cultured",
                description: `${movieTitle} • ${selected.length} Ticket(s)`,
                order_id: orderData.order_id,
                handler: async function (response) {
                    try {
                        // 3. Verify signature & record booking on backend: POST /api/verify-payment
                        const verifyRes = await api.post("/api/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            movieTitle,
                            imdbId,
                            poster: posterUrl,
                            theaterName,
                            theaterId,
                            theaterLocation,
                            screen,
                            showTime,
                            showDate,
                            showId,
                            seats: selected,
                            totalPrice
                        });

                        if (verifyRes.data && verifyRes.data.success) {
                            const newBookingId = verifyRes.data.bookingId || ("BK" + Math.floor(100000 + Math.random() * 900000));
                            setPaymentId(response.razorpay_payment_id);
                            setBookingId(newBookingId);
                            setIsPaid(true);

                            // Store in local storage for instant offline resilience
                            try {
                                const localBookings = JSON.parse(localStorage.getItem("cultured_user_bookings") || "[]");
                                const newBooking = verifyRes.data.booking || {
                                    bookingId: newBookingId,
                                    paymentId: response.razorpay_payment_id,
                                    movieTitle,
                                    imdbId,
                                    poster: posterUrl,
                                    theaterName,
                                    theaterLocation,
                                    screen,
                                    showTime,
                                    showDate,
                                    seats: selected,
                                    totalPrice,
                                    status: "CONFIRMED",
                                    bookingTime: new Date().toISOString()
                                };
                                localStorage.setItem("cultured_user_bookings", JSON.stringify([newBooking, ...localBookings.filter(b => b.bookingId !== newBookingId)]));
                            } catch (ignored) {}
                        } else {
                            setPaymentError(verifyRes.data?.error || "Payment signature verification failed.");
                        }
                    } catch (verifyErr) {
                        console.error("Verification error:", verifyErr);
                        setPaymentError("Server verification error. Please contact support with payment ID: " + response.razorpay_payment_id);
                    } finally {
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        console.log("Razorpay checkout modal closed by user.");
                    }
                },
                prefill: {
                    name: "Cinema Enthusiast",
                    email: "viewer@thecultured.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#18181b"
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on("payment.failed", function (failResponse) {
                console.error("Payment failed event:", failResponse.error);
                setPaymentError(failResponse.error?.description || "Payment failed. Please try a different card, UPI, or NetBanking.");
                setIsProcessing(false);
            });

            rzp.open();
        } catch (err) {
            console.error("Payment initiation error:", err);
            setPaymentError(err.message || "Failed to create payment order. Make sure backend is running.");
            setIsProcessing(false);
        }
    };

    if (isPaid) {
        return (
            <div className="min-h-screen bg-[#0b0d10] text-white flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#12151c] border border-zinc-700/80 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 text-zinc-100 flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Booking Confirmed!
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1 mb-2">{movieTitle}</h2>
                    <p className="text-xs text-gray-400 mb-1">
                        Booking ID: <strong className="text-white tracking-widest">{bookingId}</strong>
                    </p>
                    {paymentId && (
                        <p className="text-[11px] text-zinc-500 mb-6">
                            Razorpay Payment ID: <span className="font-mono text-zinc-400">{paymentId}</span>
                        </p>
                    )}

                    {/* Digital M-Ticket Card */}
                    <div className="bg-gray-800/60 border border-dashed border-gray-700 rounded-2xl p-4 text-left text-xs mb-6 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Cinema:</span>
                            <span className="font-semibold text-white">{theaterName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Screen & Time:</span>
                            <span className="font-semibold text-white">{screen} • {showTime}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Seats ({selected.length}):</span>
                            <span className="font-bold text-white">{selected.join(", ")}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-700">
                            <span className="text-gray-400">Total Paid:</span>
                            <span className="font-extrabold text-white text-sm">₹{totalPrice}</span>
                        </div>
                    </div>

                    <p className="text-[11px] text-gray-500 mb-6">
                        An SMS & Email with your contactless M-Ticket has been dispatched. Present this at the cinema entrance.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <NavLink
                            to="/my-tickets"
                            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm border border-zinc-700 transition text-center cursor-pointer shadow-sm"
                        >
                            View My Tickets
                        </NavLink>
                        <button
                            onClick={() => window.print()}
                            className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm border border-zinc-800 transition cursor-pointer"
                        >
                            Print Ticket
                        </button>
                        <NavLink
                            to="/"
                            className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm transition text-center shadow-md cursor-pointer"
                        >
                            Back to Home
                        </NavLink>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0d10] text-white py-10 px-4 sm:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white transition border border-gray-700/60"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-white">Order Summary</h1>
                            <p className="text-xs text-gray-400">Review your ticket details and proceed to secure payment</p>
                        </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        100% Secure Checkout
                    </span>
                </div>

                {/* Error Banner */}
                {paymentError && (
                    <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{paymentError}</span>
                        </div>
                        <button
                            onClick={() => setPaymentError("")}
                            className="text-red-400 hover:text-white font-bold ml-3 text-lg leading-none cursor-pointer"
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left 2 Cols: Movie & Theater Details */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Movie Card */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row gap-5 items-start">
                            {posterUrl && (
                                <img
                                    src={posterUrl}
                                    alt="Movie Poster"
                                    className="w-24 h-36 rounded-xl object-cover shadow-md border border-white/10 shrink-0"
                                />
                            )}
                            <div className="flex-1 space-y-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                                    Now Booking
                                </span>
                                <h2 className="text-2xl font-black text-white">{movieTitle}</h2>
                                <p className="text-sm text-gray-300 font-semibold">{theaterName}</p>
                                {theaterLocation && <p className="text-xs text-gray-400">{theaterLocation}</p>}

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="px-2.5 py-1 rounded-md bg-gray-800 text-xs font-medium text-gray-300 border border-gray-700">
                                        {screen}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-gray-800 text-xs font-medium text-gray-300 border border-gray-700">
                                        {showDate} • {showTime}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700">
                                        {selected.length} Ticket(s)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Selected Seats Details */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                                Allocated Seats
                            </h3>
                            {selected.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selected.map((seatId) => (
                                        <div
                                            key={seatId}
                                            className="px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center gap-2"
                                        >
                                            <span className="text-sm font-bold text-white">{seatId}</span>
                                            <span className="text-[10px] uppercase font-semibold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-700">
                                                Reserved
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-red-400">No seats selected.</p>
                            )}
                        </div>

                        {/* Cancellation Policy */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
                            <svg className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-xs text-gray-300">
                                <strong className="text-white block font-medium">Free Cancellation Guarantee</strong>
                                Cancel up to 2 hours before showtime for a 100% refund into your original payment method.
                            </div>
                        </div>

                        {/* Razorpay Sandbox Test Credentials */}
                        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 text-xs space-y-2">
                            <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                <span>Razorpay Test Mode Credentials</span>
                            </div>
                            <p className="text-[11px] text-zinc-400">
                                Arbitrary random numbers get rejected by Razorpay as unsupported international cards. Use standard sandbox credentials:
                            </p>
                            <div className="bg-black/40 p-3 rounded-xl border border-amber-900/30 font-mono text-[11px] space-y-1.5 text-zinc-300">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">Test Card:</span>
                                    <span className="text-amber-200 font-bold select-all tracking-wider">4111 1111 1111 1111</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">Expiry / CVV:</span>
                                    <span className="text-amber-200">12/28 • 123</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">Test UPI ID:</span>
                                    <span className="text-amber-200 select-all">success@razorpay</span>
                                </div>
                                <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                                    On simulated bank OTP screen, click the green <strong>"Success"</strong> button.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Price Breakdown & Pay */}
                    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6 flex flex-col justify-between h-fit">
                        <div>
                            <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 mb-4">
                                Payment Breakdown
                            </h3>

                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between text-gray-300">
                                    <span>Base Ticket Price ({selected.length} seats)</span>
                                    <span className="font-semibold text-white">₹{basePrice || totalPrice - convenienceFee}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Convenience Fee (incl. GST)</span>
                                    <span className="font-semibold text-white">₹{convenienceFee || 0}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Integrated GST (18%)</span>
                                    <span className="font-semibold text-emerald-400">Included</span>
                                </div>

                                <div className="pt-4 mt-2 border-t border-gray-800 flex justify-between items-baseline">
                                    <span className="text-sm font-bold text-white">Grand Total</span>
                                    <span className="text-2xl font-black text-white">₹{totalPrice}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4">
                            <button
                                onClick={handleConfirmPayment}
                                disabled={selected.length === 0 || isProcessing}
                                className="w-full py-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-base sm:text-lg shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                            >
                                {isProcessing && (
                                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                )}
                                <span>{isProcessing ? "Opening Razorpay..." : `Confirm & Pay ₹${totalPrice}`}</span>
                            </button>

                            <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                256-Bit SSL Encrypted Payment
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Checkout;

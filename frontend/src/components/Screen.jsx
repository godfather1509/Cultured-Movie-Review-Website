import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // for navigation

// Example placeholder — replace with real fetch
const fetchSeatLayout = async () => {
    return {
        layoutType: "Rectangle",
        segments: [
            {
                section: "VIP",
                seats: [
                    { id: "A1", row: "A", col: 1, status: "available", price: 500 },
                    { id: "A2", row: "A", col: 2, status: "booked", price: 500 },
                    { id: "A3", row: "A", col: 3, status: "available", price: 500 },
                    { id: "A4", row: "A", col: 4, status: "available", price: 500 },
                ],
            },
            {
                section: "Regular",
                seats: [
                    { id: "B1", row: "B", col: 1, status: "available", price: 300 },
                    { id: "B2", row: "B", col: 2, status: "available", price: 300 },
                    { id: "B3", row: "B", col: 3, status: "booked", price: 300 },
                    { id: "B4", row: "B", col: 4, status: "available", price: 300 },
                ],
            },
        ],
    };
};

const Screen = () => {
    const [layout, setLayout] = useState(null);
    const [selected, setSelected] = useState([]);
    const navigate = useNavigate();

    const { theaterId = "default123" } = useParams()

    useEffect(() => {
        fetchSeatLayout().then((data) => {
            setLayout(data);
        });
    }, []);

    const toggleSeat = (seat) => {
        if (seat.status === "booked") return;

        const already = selected.includes(seat.id);
        if (already) {
            setSelected(selected.filter((s) => s !== seat.id));
        } else {
            setSelected([...selected, seat.id]);
        }
    };

    if (!layout) {
        return <div>Loading seating layout...</div>;
    }

    const totalPrice = selected
        .map((selId) => {
            for (const seg of layout.segments) {
                const s = seg.seats.find((st) => st.id === selId);
                if (s) return s.price;
            }
            return 0;
        })
        .reduce((a, b) => a + b, 0);

    const handleCheckout = () => {
        // Pass selected seats & price to checkout page
        navigate(`/theater/checkout/${theaterId}`, { state: { selected, totalPrice } });
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h2 className="text-xl font-semibold mb-4 text-center">Select Seats</h2>

            {/* Screen */}
            <div className="mb-6 flex justify-center">
                <div className="h-4 w-2/3 bg-gray-300 rounded-t-lg shadow-inner">
                    <span className="block text-xs text-center -mt-6">Screen This Way</span>
                </div>
            </div>

            {/* Seat grid */}
            <div className="flex flex-col space-y-6">
                {layout.segments.map((seg) => (
                    <div key={seg.section} className="text-center">
                        <h3 className="font-medium mb-2">{seg.section}</h3>
                        <div className="flex justify-center">
                            <div className="grid grid-cols-8 gap-2">
                                {seg.seats.map((seat) => {
                                    const isSelected = selected.includes(seat.id);
                                    const isBooked = seat.status === "booked";

                                    return (
                                        <div
                                            key={seat.id}
                                            onClick={() => toggleSeat(seat)}
                                            className={`
                        w-10 h-10 flex items-center justify-center rounded
                        transition-colors duration-200
                        ${isBooked
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : isSelected
                                                        ? "bg-green-500"
                                                        : "bg-gray-200 hover:bg-blue-300 cursor-pointer"
                                                }
                      `}
                                        >
                                            <span className="text-sm font-medium">
                                                {seat.row}
                                                {seat.col}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex justify-center space-x-6">
                <Legend color="bg-gray-200" label="Available" />
                <Legend color="bg-green-500" label="Selected" />
                <Legend color="bg-gray-400" label="Booked" />
            </div>

            {/* Selected seats & total price */}
            <div className="mt-6 text-center">
                <h3 className="font-medium">Your Selection</h3>
                <p>{selected.join(", ") || "None"}</p>
                <p className="mt-2">Total: ₹{totalPrice}</p>
            </div>

            {/* Checkout button */}
            <div className="mt-6 flex justify-center">
                <button
                    onClick={handleCheckout}
                    disabled={selected.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                    Proceed to Checkout
                </button>
            </div>
        </div>
    );
};

const Legend = ({ color, label }) => (
    <div className="flex items-center space-x-1">
        <div className={`w-5 h-5 rounded ${color}`}></div>
        <span className="text-sm">{label}</span>
    </div>
);

export default Screen;
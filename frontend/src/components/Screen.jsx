import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ⬇️ Dynamic seat layout generator
const generateSeatLayout = (capacity) => {
    const seatsPerRow = 8;
    const totalRows = Math.ceil(capacity / seatsPerRow);

    let seats = [];
    let seatCount = 0;

    for (let r = 0; r < totalRows; r++) {
        const rowLetter = String.fromCharCode(65 + r); // A, B, C...

        for (let c = 1; c <= seatsPerRow; c++) {
            seatCount++;
            if (seatCount > capacity) break;

            seats.push({
                id: `${rowLetter}${c}`,
                row: rowLetter,
                col: c,
                status: "available",
                price: 300, // default price
            });
        }
    }

    return {
        layoutType: "Rectangle",
        segments: [
            {
                section: "All Seats",
                seats,
            },
        ],
    };
};

const Screen = () => {
    const [layout, setLayout] = useState(null);
    const [selected, setSelected] = useState([]);
    const navigate = useNavigate();

    const { theaterName, screen, capacity } = useParams();

    // ⬇️ Build layout from capacity
    useEffect(() => {
        if (!capacity) return;
        const layoutData = generateSeatLayout(Number(capacity));
        setLayout(layoutData);
    }, [capacity]);

    const toggleSeat = (seat) => {
        if (seat.status === "booked") return;

        if (selected.includes(seat.id)) {
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
        navigate(`/theater/checkout/${theaterName}`, {
            state: { selected, totalPrice, screen },
        });
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h2 className="text-xl font-semibold mb-4 text-center">
                Select Seats
            </h2>

            {/* Screen */}
            <div className="mb-6 flex justify-center">
                <div className="h-4 w-2/3 bg-gray-300 rounded-t-lg shadow-inner">
                    <span className="block text-xs text-center -mt-6">
                        Screen This Way
                    </span>
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
                                                ${
                                                    isBooked
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

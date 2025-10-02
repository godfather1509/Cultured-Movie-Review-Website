import { useLocation, useParams, useNavigate } from "react-router-dom";


function Checkout() {

    const location = useLocation();
    const { selected = [], totalPrice = 0 } = location.state || {};

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>

            <div className="bg-white text-black p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">Your Seats</h2>
                <p>{selected.length > 0 ? selected.join(", ") : "No seats selected"}</p>

                <h2 className="text-lg font-semibold mt-4">Total Price</h2>
                <p>₹{totalPrice}</p>
            </div>

            <button
                className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 cursor-pointer"
                onClick={() => alert("Payment flow here")}
            >
                Confirm & Pay
            </button>
        </div>
    );
};

export default Checkout
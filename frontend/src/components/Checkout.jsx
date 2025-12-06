import { useLocation, useParams, useNavigate } from "react-router-dom";


function Checkout() {

    const location = useLocation();
    const { selected = [], totalPrice = 0, screen } = location.state || {};

    console.log(sessionStorage.getItem("poster"))


    return (
        <div className="flex justify-center p-4 md:p-6">
  <div className="w-full flex flex-col gap-6">

    {/* Checkout Details */}
    <div className="w-full max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left">Checkout</h1>

      {/* WHITE BOX containing details + poster */}
      <div className="bg-white text-black p-4 rounded-lg shadow flex flex-col [@media(min-width:300px)]:flex-row justify-between gap-4">

        {/* Left box content */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Screen</h2>
          <p>{screen}</p>

          <h2 className="text-lg font-semibold mb-2 mt-4">Your Seats</h2>
          <p>{selected.length > 0 ? selected.join(", ") : "No seats selected"}</p>

          <h2 className="text-lg font-semibold mt-4">Total Price</h2>
          <p>₹{totalPrice}</p>
        </div>

        {/* Poster inside same box */}
        <div className="w-28 flex justify-center sm:justify-end mt-4 sm:mt-0">
          <img
            src={sessionStorage.getItem("poster")}
            alt="Movie Poster"
            className="rounded-lg shadow w-28 h-auto object-cover"
          />
        </div>
      </div>

      <button
        className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 cursor-pointer self-center sm:self-start"
        onClick={() => alert("Payment flow here")}
      >
        Confirm & Pay
      </button>
    </div>

  </div>
</div>
    );
};

export default Checkout
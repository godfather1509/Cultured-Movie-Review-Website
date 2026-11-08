package com.fullStack.Movie.booking;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fullStack.Movie.Theater.ShowService;
import com.fullStack.Movie.Theater.Shows;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShowService showService;

    @SuppressWarnings("unchecked")
    public Booking createBooking(Map<String, Object> payload) {
        String bookingId = (String) payload.get("bookingId");
        if (bookingId == null || bookingId.isBlank()) {
            bookingId = "BK" + (long) (Math.random() * 900000 + 100000);
        }

        String paymentId = (String) payload.getOrDefault("paymentId", payload.get("razorpay_payment_id"));
        String orderId = (String) payload.getOrDefault("orderId", payload.get("razorpay_order_id"));

        String imdbId = (String) payload.getOrDefault("imdbId", payload.get("movieId"));
        String movieTitle = (String) payload.getOrDefault("movieTitle", "Movie");
        String poster = (String) payload.getOrDefault("poster", "");

        String theaterName = (String) payload.getOrDefault("theaterName", "Cinema");
        String theaterId = (String) payload.get("theaterId");
        String theaterLocation = (String) payload.getOrDefault("theaterLocation", "");

        String screen = (String) payload.getOrDefault("screen", "Screen 1");
        String showTime = (String) payload.getOrDefault("showTime", "07:30 PM");
        String showDate = (String) payload.getOrDefault("showDate", "Today");
        String showId = (String) payload.get("showId");

        List<String> seats = new ArrayList<>();
        if (payload.get("seats") instanceof List) {
            List<?> rawSeats = (List<?>) payload.get("seats");
            for (Object s : rawSeats) {
                if (s != null) seats.add(s.toString().trim().toUpperCase());
            }
        }

        double totalPrice = 0;
        if (payload.containsKey("totalPrice")) {
            try {
                totalPrice = Double.parseDouble(payload.get("totalPrice").toString());
            } catch (Exception ignored) {}
        }

        Booking booking = new Booking();
        booking.setBookingId(bookingId);
        booking.setPaymentId(paymentId != null ? paymentId : "PAY_" + System.currentTimeMillis());
        booking.setOrderId(orderId);
        booking.setImdbId(imdbId);
        booking.setMovieTitle(movieTitle);
        booking.setPoster(poster);
        booking.setTheaterName(theaterName);
        booking.setTheaterId(theaterId);
        booking.setTheaterLocation(theaterLocation);
        booking.setScreen(screen);
        booking.setShowTime(showTime);
        booking.setShowDate(showDate);
        booking.setSeats(seats);
        booking.setTotalPrice(totalPrice);
        booking.setStatus("CONFIRMED");
        booking.setBookingTime(LocalDateTime.now());

        // 1. Reserve seats in database for this show
        if (!seats.isEmpty()) {
            showService.reserveSeatsForShow(showId, theaterId, imdbId, screen, showTime, seats);
        }

        // 2. Save booking
        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(String bookingId) {
        Optional<Booking> opt = bookingRepository.findByBookingId(bookingId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Booking not found with ID: " + bookingId);
        }

        Booking booking = opt.get();
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            return booking; // Already cancelled
        }

        // 1. Free seats in database for this show
        if (booking.getSeats() != null && !booking.getSeats().isEmpty()) {
            showService.freeSeatsForShow(
                null,
                booking.getTheaterId(),
                booking.getImdbId(),
                booking.getScreen(),
                booking.getShowTime(),
                booking.getSeats()
            );
        }

        // 2. Mark booking as CANCELLED
        booking.setStatus("CANCELLED");
        return bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByBookingTimeDesc();
    }

    public Optional<Booking> getBooking(String bookingId) {
        return bookingRepository.findByBookingId(bookingId);
    }

    public Shows getShowDetails(String showId, String theaterId, String movieId, String screen, String time) {
        return showService.findShow(showId, theaterId, movieId, screen, time);
    }
}


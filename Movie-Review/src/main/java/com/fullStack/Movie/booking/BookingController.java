package com.fullStack.Movie.booking;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fullStack.Movie.Theater.Shows;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getBooking(@PathVariable String bookingId) {
        Optional<Booking> opt = bookingService.getBooking(bookingId);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Booking not found"));
    }

    @PostMapping("/create")
    public ResponseEntity<Booking> createBooking(@RequestBody Map<String, Object> payload) {
        Booking created = bookingService.createBooking(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/cancel/{bookingId}")
    public ResponseEntity<?> cancelBooking(@PathVariable String bookingId) {
        try {
            Booking cancelled = bookingService.cancelBooking(bookingId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket successfully cancelled. Reserved seats reopened for booking.");
            response.put("booking", cancelled);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", iae.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/show-booked-seats")
    public ResponseEntity<Map<String, String>> getShowBookedSeats(
            @RequestParam(required = false) String showId,
            @RequestParam(required = false) String theaterId,
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) String screen,
            @RequestParam(required = false) String time) {
        Shows show = bookingService.getShowDetails(showId, theaterId, movieId, screen, time);
        String booked = show != null && show.getBookedSeats() != null ? show.getBookedSeats() : "";
        return ResponseEntity.ok(Map.of("bookedSeats", booked));
    }
}


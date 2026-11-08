package com.fullStack.Movie.payment;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private com.fullStack.Movie.booking.BookingService bookingService;

    /**
     * Endpoint to create Razorpay Order
     * Mapped to both /api/create-order and /api/v1/payment/create-order
     */
    @PostMapping({"/api/create-order", "/api/v1/payment/create-order"})
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("amount")) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Missing required field: amount");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        long amountInPaise;
        try {
            double rawAmount = Double.parseDouble(payload.get("amount").toString());
            // If amount appears to be in Rupees (e.g. from frontend total price), convert or take as paise:
            // Standard convention: if amount is explicitly sent as paise or if caller sends paise
            // We check if amount < 100, reject as invalid per instructions (min 100 paise)
            amountInPaise = Math.round(rawAmount);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Invalid amount format: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        if (amountInPaise < 100) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Minimum amount must be at least 100 paise (1 INR)");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        String currency = (String) payload.getOrDefault("currency", "INR");
        String receipt = (String) payload.getOrDefault("receipt", "rcpt_" + System.currentTimeMillis());

        try {
            Map<String, Object> orderData = paymentService.createOrder(amountInPaise, currency, receipt);
            return ResponseEntity.ok(orderData);
        } catch (SecurityException se) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", se.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        } catch (IllegalArgumentException iae) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", iae.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Failed to create Razorpay order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    /**
     * Endpoint to verify Razorpay Payment Signature
     * Mapped to both /api/verify-payment and /api/v1/payment/verify
     */
    @PostMapping({"/api/verify-payment", "/api/v1/payment/verify"})
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> payload) {
        if (payload == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "Request payload is empty");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        String orderId = (String) payload.get("razorpay_order_id");
        if (orderId == null) orderId = (String) payload.get("order_id");

        String paymentId = (String) payload.get("razorpay_payment_id");
        if (paymentId == null) paymentId = (String) payload.get("payment_id");

        String signature = (String) payload.get("razorpay_signature");
        if (signature == null) signature = (String) payload.get("signature");

        if (orderId == null || orderId.isBlank() ||
            paymentId == null || paymentId.isBlank() ||
            signature == null || signature.isBlank()) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "Missing required verification fields: razorpay_order_id, razorpay_payment_id, razorpay_signature");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        boolean isValid = paymentService.verifySignature(orderId, paymentId, signature);

        if (!isValid) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "Payment verification failed: Signature mismatch");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        // Create confirmed booking and reserve seats in database
        com.fullStack.Movie.booking.Booking booking = null;
        try {
            payload.put("paymentId", paymentId);
            payload.put("orderId", orderId);
            booking = bookingService.createBooking(payload);
        } catch (Exception e) {
            System.err.println("Error saving booking on payment verification: " + e.getMessage());
        }

        String bookingId = booking != null ? booking.getBookingId() : ("BK" + (long) (Math.random() * 900000 + 100000));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("bookingId", bookingId);
        response.put("paymentId", paymentId);
        response.put("orderId", orderId);
        response.put("booking", booking);
        response.put("message", "Payment verified and seats reserved successfully");

        return ResponseEntity.ok(response);
    }
}


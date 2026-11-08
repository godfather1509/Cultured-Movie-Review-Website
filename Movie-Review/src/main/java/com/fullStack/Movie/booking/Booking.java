package com.fullStack.Movie.booking;

import java.time.LocalDateTime;
import java.util.List;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "bookings")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Booking {

    @Id
    @JsonSerialize(using = ToStringSerializer.class)
    private ObjectId id;

    private String bookingId;
    private String paymentId;
    private String orderId;

    private String imdbId;
    private String movieTitle;
    private String poster;
    private String theaterName;
    private String theaterId;
    private String theaterLocation;
    private String screen;
    private String showTime;
    private String showDate;

    private List<String> seats;
    private double totalPrice;
    private String status; // "CONFIRMED", "CANCELLED"
    private LocalDateTime bookingTime;

    public String getIdString() {
        return id != null ? id.toHexString() : null;
    }
}


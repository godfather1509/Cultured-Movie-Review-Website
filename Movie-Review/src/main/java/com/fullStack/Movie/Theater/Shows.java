package com.fullStack.Movie.Theater;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "shows")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Shows {

    @Id
    @JsonSerialize(using = ToStringSerializer.class)
    private ObjectId id;

    private String movieId;
    private String theaterId;
    private int capacity;
    private String bookedSeats = "";
    private String time;
    private String screen;
    private Integer price = 180; // Starting ticket price for this show

    public String getShowId() {
        return id != null ? id.toHexString() : null;
    }

    public void addBookedSeats(java.util.List<String> seatsToAdd) {
        if (seatsToAdd == null || seatsToAdd.isEmpty()) return;
        java.util.Set<String> set = new java.util.LinkedHashSet<>();
        if (this.bookedSeats != null && !this.bookedSeats.isBlank()) {
            for (String s : this.bookedSeats.split(",")) {
                String trimmed = s.trim().toUpperCase();
                if (!trimmed.isEmpty()) set.add(trimmed);
            }
        }
        for (String s : seatsToAdd) {
            String trimmed = s.trim().toUpperCase();
            if (!trimmed.isEmpty()) set.add(trimmed);
        }
        this.bookedSeats = String.join(",", set);
    }

    public void removeBookedSeats(java.util.List<String> seatsToRemove) {
        if (this.bookedSeats == null || this.bookedSeats.isBlank() || seatsToRemove == null || seatsToRemove.isEmpty()) return;
        java.util.Set<String> removeSet = new java.util.HashSet<>();
        for (String s : seatsToRemove) {
            removeSet.add(s.trim().toUpperCase());
        }
        java.util.Set<String> set = new java.util.LinkedHashSet<>();
        for (String s : this.bookedSeats.split(",")) {
            String trimmed = s.trim().toUpperCase();
            if (!trimmed.isEmpty() && !removeSet.contains(trimmed)) {
                set.add(trimmed);
            }
        }
        this.bookedSeats = String.join(",", set);
    }

    public Shows(String theaterId, String movieId, int capacity, String time, String screen) {
        this.movieId = movieId;
        this.capacity = capacity;
        this.theaterId = theaterId;
        this.time = time;
        this.screen = screen;
        this.bookedSeats = "";
        this.price = 180;
    }

    public Shows(String theaterId, String movieId, int capacity, String time, String screen, String bookedSeats) {
        this.movieId = movieId;
        this.capacity = capacity;
        this.theaterId = theaterId;
        this.time = time;
        this.screen = screen;
        this.bookedSeats = bookedSeats != null ? bookedSeats : "";
        this.price = 180;
    }

    public Shows(String theaterId, String movieId, int capacity, String time, String screen, String bookedSeats, Integer price) {
        this.movieId = movieId;
        this.capacity = capacity;
        this.theaterId = theaterId;
        this.time = time;
        this.screen = screen;
        this.bookedSeats = bookedSeats != null ? bookedSeats : "";
        this.price = price != null ? price : 180;
    }
}
